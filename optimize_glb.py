#!/usr/bin/env python3
"""GLB 파일 용량 최적화 스크립트.

Blender 등에서 새로 뽑은 .glb를 models/ 폴더에 넣은 뒤 이 스크립트를 돌리면
텍스처를 WebP로 바꾸고 줄이고, 중복 데이터를 지우고, 지오메트리를 압축해서
파일 용량을 크게 줄여 준다(이 프로젝트 건물 모델 기준 보통 5~8배 정도 줄었다).

사용법:
  python optimize_glb.py models/place_새건물.glb        # 파일 하나
  python optimize_glb.py models/a.glb models/b.glb      # 여러 개
  python optimize_glb.py --new                          # models/ 안에서 아직 최적화 안 된 것만(추천)
  python optimize_glb.py --all                          # models/ 안의 전부(제외 목록 빼고)
  python optimize_glb.py --all --dir other_models       # 다른 폴더 전체
  python optimize_glb.py models/mom.glb --force         # 기본 제외 목록에 있는 파일도 강제로

필요한 것: Node.js(npx)가 설치돼 있어야 한다 — 설치돼 있으면 처음 실행할 때
@gltf-transform/cli를 자동으로 내려받아 쓴다(인터넷 필요).

주의(왜 --join/--palette/--simplify를 안 쓰는지): gltf-transform의 "optimize"
명령은 기본으로 메시를 합치고(join) 재질을 팔레트 텍스처로 합치는(palette)
옵션까지 켜져 있는데, 2026-11-21에 이 프로젝트 건물 모델들로 실제 테스트해보니
이 옵션들이 가끔 지오메트리 크기(바운딩박스)를 완전히 틀어지게 만들었다(세로가
1.5배로 늘어나는 등). 그래서 이 스크립트는 텍스처 압축 + 중복 제거 +
meshopt 지오메트리 압축만 쓰고 join/palette/simplify는 끈 "검증된 안전 조합"만
쓴다. 이 조합을 바꾸고 싶으면 반드시 최적화 전후 바운딩박스가 같은지
(three.js로 불러와서 Box3로 재보는 식으로) 직접 확인한 뒤 바꿀 것.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

# Windows 콘솔이 한글 코드페이지(cp949 등)일 때 npx(Node.js)가 내놓는 UTF-8 출력을
# 잘못 디코딩해서 죽는 걸 막는다 — 항상 UTF-8로 읽고 깨진 바이트는 버린다.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")
SUBPROCESS_TEXT_KWARGS = {"encoding": "utf-8", "errors": "replace"}

SAFE_OPTIMIZE_FLAGS = [
    "--texture-compress", "webp",
    "--join", "false",
    "--simplify", "false",
    "--palette", "false",
    # 2026-11-23: flatten·instance를 켜 두면 일부 모델(Seoul_Happy_Sign, 금파힐 문주 등)의 바운딩박스가
    # 틀어지고, 기본 압축(quantize)은 캐릭터 모델(walk 등)의 크기를 [-1,1]로 눌러 버렸다.
    # 그래서 flatten·instance를 끄고 meshopt만 쓴다 — 실측으로 확인한 조합.
    "--flatten", "false",
    "--instance", "false",
    "--compress", "meshopt",
]

# 애니메이션이 들어 있는 캐릭터 모델은 건물 모델과 성격이 달라서(뼈대·스킨 등) 형상 압축(meshopt·quantize)을
# 하면 몸이 [-1,1]로 눌려 망가진다(2026-11-23 확인). 그래서 이 파일들은 "텍스처만" 줄인다 —
# 크기 제한(resize) + WebP 변환만 하고 정점·뼈대·동작은 그대로 둔다(용량 대부분이 PNG 텍스처였다).
DEFAULT_SKIP = {"mom.glb", "walk.glb", "dance.glb"}


def run_npx(args, **kwargs):
    npx = "npx.cmd" if os.name == "nt" else "npx"
    return subprocess.run([npx, "--yes", "@gltf-transform/cli", *args],
                           shell=(os.name == "nt"), **kwargs)


def check_gltf_transform_available():
    try:
        result = run_npx(["--version"], capture_output=True, timeout=120, **SUBPROCESS_TEXT_KWARGS)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def optimize_textures_only(path, texture_size):
    size_before = os.path.getsize(path)
    with tempfile.TemporaryDirectory() as tmp:
        mid = os.path.join(tmp, "resized.glb")
        out_path = os.path.join(tmp, os.path.basename(path))
        steps = [
            ["resize", path, mid, "--width", str(texture_size), "--height", str(texture_size)],
            ["webp", mid, out_path, "--quality", "88"],
        ]
        for args in steps:
            result = run_npx(args, capture_output=True, **SUBPROCESS_TEXT_KWARGS)
            if result.returncode != 0:
                print(f"  실패: {result.stderr.strip()[-500:]}")
                return False
        size_after = os.path.getsize(out_path)
        if size_after >= size_before:
            print(f"  건너뜀(텍스처를 줄여도 안 줄어듦): {size_before:,} -> {size_after:,} bytes")
            return False
        shutil.copyfile(out_path, path)
        print(f"  (텍스처만) {size_before:,} -> {size_after:,} bytes ({100 - size_after * 100 // size_before}% 감소)")
        return True


def is_already_optimized(path):
    """GLB 안 JSON에 meshopt 압축 확장이 적혀 있으면 이미 이 스크립트로 최적화된 파일이다."""
    try:
        with open(path, "rb") as f:
            head = f.read(20)
            if len(head) < 20 or head[:4] != b"glTF":
                return False
            json_len = int.from_bytes(head[12:16], "little")
            return b"EXT_meshopt_compression" in f.read(json_len)
    except OSError:
        return False


def strip_extras(src, dst):
    """GLB 안 JSON의 "extras"(편집기가 남긴 메모·백업 데이터)를 모두 지운다. 게임은 이걸 쓰지 않는다.
    어떤 편집기는 여기에 three.js 장면 전체를 통째로 다시 넣어 둬서(2026-11-25 행당대림105·107: 28MB 중 19MB)
    최적화를 해도 용량이 거의 안 줄었다. 지운 게 있으면 True."""
    with open(src, "rb") as f:
        data = f.read()
    if data[:4] != b"glTF":
        return False
    json_len = int.from_bytes(data[12:16], "little")
    doc = json.loads(data[20:20 + json_len])
    removed = [0]

    def walk(o):
        if isinstance(o, dict):
            if "extras" in o:
                del o["extras"]
                removed[0] += 1
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(doc)
    if not removed[0]:
        return False
    new_json = json.dumps(doc, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    new_json += b" " * ((4 - len(new_json) % 4) % 4)  # GLB 청크는 4바이트 단위
    rest = data[20 + json_len:]  # BIN 청크(있으면) 그대로
    total = 12 + 8 + len(new_json) + len(rest)
    with open(dst, "wb") as f:
        f.write(b"glTF" + (2).to_bytes(4, "little") + total.to_bytes(4, "little"))
        f.write(len(new_json).to_bytes(4, "little") + b"JSON" + new_json)
        f.write(rest)
    return True


def optimize_one(path, texture_size):
    size_before = os.path.getsize(path)
    with tempfile.TemporaryDirectory() as tmp:
        out_path = os.path.join(tmp, os.path.basename(path))
        src = path
        stripped = os.path.join(tmp, "stripped.glb")
        if strip_extras(path, stripped):
            print("  (편집기가 남긴 extras 데이터 제거)")
            src = stripped
        result = run_npx(
            ["optimize", src, out_path, "--texture-size", str(texture_size), *SAFE_OPTIMIZE_FLAGS],
            capture_output=True, **SUBPROCESS_TEXT_KWARGS,
        )
        if result.returncode != 0 or not os.path.exists(out_path):
            print(f"  실패: {result.stderr.strip()[-500:]}")
            return False
        size_after = os.path.getsize(out_path)
        if size_after >= size_before:
            print(f"  건너뜀(최적화해도 안 줄어듦): {size_before:,} -> {size_after:,} bytes")
            return False
        shutil.copyfile(out_path, path)
    pct = 100 * (1 - size_after / size_before)
    print(f"  {size_before:,} -> {size_after:,} bytes ({pct:.0f}% 감소)")
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("files", nargs="*", help="최적화할 .glb 파일 경로(들)")
    parser.add_argument("--all", action="store_true", help="--dir 안의 .glb 파일을 전부 처리")
    parser.add_argument("--new", action="store_true", help="--dir 안에서 아직 최적화 안 된 .glb만 처리(이미 된 건 다시 압축하지 않음)")
    parser.add_argument("--dir", default="models", help="--all일 때 뒤질 폴더 (기본: models)")
    parser.add_argument("--texture-size", type=int, default=1024, help="텍스처 최대 한 변 픽셀 (기본: 1024)")
    parser.add_argument("--force", action="store_true", help="기본 제외 목록(mom.glb 등)도 처리")
    args = parser.parse_args()

    if not check_gltf_transform_available():
        print("npx로 @gltf-transform/cli를 실행할 수 없다 — Node.js가 설치돼 있는지,")
        print("인터넷에 연결돼 있는지 확인해줘.")
        sys.exit(1)

    targets = list(args.files)
    if args.new:
        for name in sorted(os.listdir(args.dir)):
            full = os.path.join(args.dir, name)
            if name.endswith(".glb") and name not in DEFAULT_SKIP and not is_already_optimized(full):
                targets.append(full)
        if not targets:
            print("최적화할 새 glb가 없다 — 모두 이미 최적화돼 있다.")
            sys.exit(0)
    if args.all:
        for name in sorted(os.listdir(args.dir)):
            if name.endswith(".glb"):
                targets.append(os.path.join(args.dir, name))

    if not targets:
        parser.print_help()
        sys.exit(1)

    ok, skipped, failed = 0, 0, 0
    for path in targets:
        base = os.path.basename(path)
        if not os.path.exists(path):
            print(f"{path}: 파일이 없다")
            failed += 1
            continue
        print(f"{path}")
        if base in DEFAULT_SKIP and not args.force:
            # 캐릭터 모델: 텍스처만 줄인다(정점·뼈대·동작은 그대로)
            if optimize_textures_only(path, args.texture_size):
                ok += 1
            else:
                skipped += 1
            continue
        if optimize_one(path, args.texture_size):
            ok += 1
        else:
            failed += 1

    print(f"\n완료: {ok}개 최적화, {skipped}개 건너뜀, {failed}개 실패/변화없음")


if __name__ == "__main__":
    main()
