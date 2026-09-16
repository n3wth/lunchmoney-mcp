"""Export the official emblem. Requires ImageMagick; see assets/branding."""

import base64
from pathlib import Path
import shutil
import subprocess


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    source = root / "assets/branding/lunch-money-emblem.png"
    icon = root / "site/icon.png"
    # Remove empty canvas only; preserve aspect ratio and add clear space.
    subprocess.run([
        "magick", str(source), "-trim", "+repage", "-resize", "448x448",
        "-gravity", "center", "-background", "none", "-extent", "512x512",
        str(icon),
    ], check=True)
    for size, name in [(32, "icon-32.png"), (180, "apple-touch-icon.png")]:
        subprocess.run([
            "magick", str(icon), "-resize", f"{size}x{size}",
            *(["-background", "white", "-alpha", "remove", "-alpha", "off"]
              if name == "apple-touch-icon.png" else []),
            str(root / "site" / name),
        ], check=True)
    encoded = base64.b64encode(icon.read_bytes()).decode("ascii")
    (root / "site/favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
        '<title>Lunch Money</title>'
        f'<image width="512" height="512" href="data:image/png;base64,{encoded}"/>'
        '</svg>\n', encoding="utf-8",
    )
    for package in ["codex-plugin", "claude-plugin", "cursor-plugin"]:
        shutil.copyfile(icon, root / "packages" / package / "assets/icon.png")


if __name__ == "__main__":
    main()
