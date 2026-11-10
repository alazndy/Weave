#!/usr/bin/env bash
# Installs the Weave desktop app for the current user (no sudo needed).
#   scripts/install-linux.sh             build if needed, install, add menu entry
#   scripts/install-linux.sh --uninstall remove the app (your projects are kept)
#   scripts/install-linux.sh --purge     remove the app AND all saved projects/libraries
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
APP_DIR="${WEAVE_INSTALL_DIR:-$HOME/.local/opt/Weave}"
BIN_DIR="${WEAVE_BIN_DIR:-$HOME/.local/bin}"
DESKTOP_FILE="$DATA_HOME/applications/weave.desktop"
ICON_FILE="$DATA_HOME/icons/hicolor/512x512/apps/weave.png"
USER_DATA="${XDG_CONFIG_HOME:-$HOME/.config}/weave"

uninstall() {
  rm -rf "$APP_DIR" "$BIN_DIR/weave" "$DESKTOP_FILE" "$ICON_FILE"
  command -v update-desktop-database >/dev/null && update-desktop-database "$DATA_HOME/applications" 2>/dev/null || true
  echo "Weave removed."
}

case "${1:-}" in
  --uninstall) uninstall; echo "Your projects are kept in $USER_DATA (use --purge to delete them)."; exit 0 ;;
  --purge) uninstall; rm -rf "$USER_DATA"; echo "Saved projects and libraries deleted."; exit 0 ;;
  "") ;;
  *) echo "Unknown option: $1" >&2; exit 2 ;;
esac

UNPACKED="$ROOT/release/linux-unpacked"
if [ ! -x "$UNPACKED/weave" ]; then
  echo "Building the desktop app (first time takes a few minutes)..."
  (cd "$ROOT" && npx pnpm@9 install --frozen-lockfile && npx pnpm@9 run desktop:build)
fi

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR" "$BIN_DIR" "$(dirname "$DESKTOP_FILE")" "$(dirname "$ICON_FILE")"
cp -a "$UNPACKED/." "$APP_DIR/"
cp "$ROOT/build/icon.png" "$ICON_FILE"
ln -sf "$APP_DIR/weave" "$BIN_DIR/weave"

cat > "$DESKTOP_FILE" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Weave
Comment=Vehicle system cabling schematic editor
Exec=$APP_DIR/weave %U
Icon=weave
Terminal=false
Categories=Graphics;Engineering;
StartupWMClass=Weave
DESKTOP
command -v update-desktop-database >/dev/null && update-desktop-database "$DATA_HOME/applications" 2>/dev/null || true

echo "Weave installed: $APP_DIR"
echo "Start it from your application menu or run: weave"
echo "Projects and libraries are stored in $USER_DATA"
