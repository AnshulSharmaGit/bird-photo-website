#!/bin/bash
# Bird Site Sync — one-time install script
# Run from the project root: bash sync/install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USERNAME=$(whoami)
PLIST_SRC="$SCRIPT_DIR/com.birdsite.sync.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.birdsite.sync.plist"

echo "=== Bird Site Sync Installer ==="
echo "User: $USERNAME"

# 1. Install Python deps
echo ""
echo "Installing Python dependencies..."
pip3 install -r "$SCRIPT_DIR/requirements.txt"

# 2. Set up config.json
if [ ! -f "$SCRIPT_DIR/config.json" ]; then
  cp "$SCRIPT_DIR/config.example.json" "$SCRIPT_DIR/config.json"
  echo ""
  echo "Created sync/config.json — fill in your credentials before running."
else
  echo ""
  echo "sync/config.json already exists, skipping."
fi
chmod 600 "$SCRIPT_DIR/config.json"

# 3. Install launchd plist (replace USERNAME placeholder)
sed "s/USERNAME/$USERNAME/g" "$PLIST_SRC" > "$PLIST_DEST"
echo "Installed launchd plist to $PLIST_DEST"

# 4. Load the job
launchctl unload "$PLIST_DEST" 2>/dev/null || true
launchctl load "$PLIST_DEST"
echo "Loaded launchd job com.birdsite.sync"

echo ""
echo "=== Done! ==="
echo ""
echo "Next steps:"
echo "  1. Edit sync/config.json with your credentials"
echo "  2. Grant Full Disk Access to Terminal in:"
echo "     System Settings → Privacy & Security → Full Disk Access"
echo "  3. Test manually: python3 sync/sync.py --dry-run"
echo "  4. The sync runs daily at 06:00 AM"
echo "  5. Logs: ~/Library/Logs/birdsite-sync.log"
