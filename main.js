const STAT_LABELS = {
  intellect: "지력",
  stamina: "체력",
  power: "근력",
  art: "감성",
  social: "사회성",
  diligence: "성실성",
};

const HOME_FALLBACK = { lat: 37.5495, lng: 127.0203 };
const CHILD_WALK_M_PER_MIN = 70;

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function renderClock() {
  const el = document.getElementById("clock");
  const now = new Date();
  el.textContent = now.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    new kakao.maps.services.Geocoder().addressSearch(address, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
      } else {
        reject(new Error(`지오코딩 실패: ${address}`));
      }
    });
  });
}

function offsetLatLng(lat, lng, distanceM, bearingDeg) {
  const earthRadiusM = 6371000;
  const bearing = (bearingDeg * Math.PI) / 180;
  const dLat = ((distanceM * Math.cos(bearing)) / earthRadiusM) * (180 / Math.PI);
  const dLng =
    ((distanceM * Math.sin(bearing)) / (earthRadiusM * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return { lat: lat + dLat, lng: lng + dLng };
}

function addMarker(map, position, content) {
  const marker = new kakao.maps.Marker({ map, position: new kakao.maps.LatLng(position.lat, position.lng) });
  const infowindow = new kakao.maps.InfoWindow({ content: `<div class="map-tip">${content}</div>` });
  kakao.maps.event.addListener(marker, "click", () => infowindow.open(map, marker));
  return marker;
}

async function renderMap(character, academies, categories) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(HOME_FALLBACK.lat, HOME_FALLBACK.lng),
    level: 4,
  });

  let homePos = HOME_FALLBACK;
  try {
    homePos = await geocodeAddress(character.home.address);
  } catch (err) {
    console.warn(err);
  }
  map.setCenter(new kakao.maps.LatLng(homePos.lat, homePos.lng));
  addMarker(map, homePos, `집<br>${character.home.address}`);

  try {
    const schoolPos = await geocodeAddress(character.school.address);
    addMarker(map, schoolPos, `학교 — ${character.school.name}<br>${character.school.address}`);
  } catch (err) {
    console.warn(err);
  }

  const localAcademies = academies.filter((a) => a.location.mode === "walk" && a.location.etaMinFromHome != null);
  localAcademies.forEach((academy, i) => {
    const bearingDeg = (360 / localAcademies.length) * i;
    const distanceM = academy.location.etaMinFromHome * CHILD_WALK_M_PER_MIN;
    const pos = offsetLatLng(homePos.lat, homePos.lng, distanceM, bearingDeg);
    const category = categoryMap[academy.categoryId];
    addMarker(
      map,
      pos,
      `<strong>${academy.name}</strong> (가상 위치)<br>${category.label} · 도보 ${academy.location.etaMinFromHome}분`
    );
  });
}

function renderStats(character) {
  document.getElementById("char-name").textContent = `${character.name} (초${character.grade})`;

  const statsEl = document.getElementById("stats");
  statsEl.innerHTML = "";
  Object.entries(character.stats).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <span class="label">${STAT_LABELS[key] ?? key}</span>
      <span class="bar"><span style="width:${Math.min(value, 100)}%"></span></span>
      <span class="value">${value}</span>
    `;
    statsEl.appendChild(row);
  });

  const condEl = document.getElementById("condition");
  condEl.innerHTML = `<p class="muted">허기 ${character.condition.hunger} · 체력(현재) ${character.condition.staminaNow}</p>`;
}

function renderAcademies(academies, categories) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const el = document.getElementById("academies");
  el.innerHTML = "";

  academies.forEach((academy) => {
    const category = categoryMap[academy.categoryId];
    const growthText = Object.entries(category.growth)
      .map(([stat, amount]) => `${STAT_LABELS[stat] ?? stat} +${amount}`)
      .join(" · ");

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${academy.name}</strong> (${category.label})<br>
      <span class="muted">${growthText} · 집에서 ${academy.location.mode === "walk" ? "도보" : "이동"} ${academy.location.etaMinFromHome}분</span>
    `;
    el.appendChild(li);
  });
}

async function main() {
  renderClock();
  setInterval(renderClock, 1000 * 30);

  const [character, academies, categories] = await Promise.all([
    loadJSON("data/character.json"),
    loadJSON("data/academies.json"),
    loadJSON("data/academy_categories.json"),
  ]);

  renderStats(character);
  renderAcademies(academies, categories);
  renderMap(character, academies, categories);
}

main();
