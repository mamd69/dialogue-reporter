#!/usr/bin/env bash
# Dialogue Reporter Installation Script
# Automatically registers hooks in .claude/settings.json

set -e  # Exit on error

SETTINGS_FILE=".claude/settings.json"
BACKUP_FILE=".claude/settings.json.backup.$(date +%Y%m%d-%H%M%S)"

echo "🔧 Installing dialogue-reporter hooks..."
echo ""

# Check if we're in a valid directory
if [ ! -d ".claude/hooks" ]; then
    echo "❌ Error: .claude/hooks directory not found"
    echo "   Are you in the root of your project?"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required but not installed"
    echo ""
    echo "Install jq with:"
    echo "  • Ubuntu/Debian: sudo apt-get install jq"
    echo "  • macOS: brew install jq"
    echo "  • Fedora: sudo dnf install jq"
    exit 1
fi

# Backup existing settings if they exist
if [ -f "$SETTINGS_FILE" ]; then
    cp "$SETTINGS_FILE" "$BACKUP_FILE"
    echo "📦 Backed up settings to: $BACKUP_FILE"
else
    # Create minimal settings.json if it doesn't exist
    echo '{"hooks":{}}' > "$SETTINGS_FILE"
    echo "📄 Created new settings.json"
fi

echo ""
echo "Registering hooks in settings.json..."

# Register hooks using jq
# This PREPENDS dialogue-reporter hooks, preserving any existing hooks

# Process each hook type with jq
# Per Claude Code docs, hooks use nested structure:
# "EventName": [{ "hooks": [{ "type": "command", "command": "..." }] }]
# Use $CLAUDE_PROJECT_DIR for reliable path resolution
# https://code.claude.com/docs/en/hooks

# For SessionStart - nested hooks structure with $CLAUDE_PROJECT_DIR
jq '.hooks = (.hooks // {}) |
  .hooks.SessionStart = (
    [{"hooks": [{"type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/SessionStart.sh"}]}] +
    ((.hooks.SessionStart // []) | map(select(.hooks[0].command | contains("SessionStart.sh") | not)))
  )' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"

# For UserPromptSubmit
jq '.hooks.UserPromptSubmit = (
    [{"hooks": [{"type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/UserPromptSubmit.sh"}]}] +
    ((.hooks.UserPromptSubmit // []) | map(select(.hooks[0].command | contains("UserPromptSubmit.sh") | not)))
  )' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"

# For Stop
jq '.hooks.Stop = (
    [{"hooks": [{"type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/Stop.sh"}]}] +
    ((.hooks.Stop // []) | map(select(.hooks[0].command | contains("Stop.sh") | not)))
  )' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"

echo "✅ SessionStart hook registered"
echo "✅ UserPromptSubmit hook registered"
echo "✅ Stop hook registered"

# Make hooks executable
chmod +x .claude/hooks/SessionStart.sh 2>/dev/null || true
chmod +x .claude/hooks/Stop.sh 2>/dev/null || true
chmod +x .claude/hooks/UserPromptSubmit.sh 2>/dev/null || true

echo ""
echo "✅ Hooks registered successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart Claude Code for changes to take effect"
echo "   2. Verify with: bash .claude/hooks/verify-dialogue-reporter.sh"
echo ""
echo "💡 Tip: Your conversations will be saved to docs/claude-conversations/"
