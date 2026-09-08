#!/usr/bin/env bash
# Puts `gandalf` on your PATH by symlinking bin/gandalf into ~/.local/bin.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
TARGET="${GANDALF_BIN_DIR:-$HOME/.local/bin}"

if ! command -v node >/dev/null 2>&1; then
  echo "gandalf needs Node.js (14+). Install it and run this script again." >&2
  echo "  macOS:  brew install node   (or https://nodejs.org)" >&2
  exit 1
fi

mkdir -p "$TARGET"
chmod +x "$ROOT/bin/gandalf"
ln -sf "$ROOT/bin/gandalf" "$TARGET/gandalf"
echo "linked $TARGET/gandalf -> $ROOT/bin/gandalf"

case ":$PATH:" in
  *":$TARGET:"*)
    echo "PATH already contains $TARGET. Run 'gandalf' from any quest directory."
    ;;
  *)
    echo
    echo "$TARGET is not on your PATH yet. Add this to ~/.zshrc (or ~/.bashrc):"
    echo
    echo "    export PATH=\"\$TARGET:\$PATH\"" | sed "s#\$TARGET#$TARGET#"
    echo
    echo "then restart your shell or run: source ~/.zshrc"
    ;;
esac

echo
echo "If 'gandalf' still doesn't run the right thing afterwards, check for a"
echo "shell function or alias shadowing it: type gandalf"
