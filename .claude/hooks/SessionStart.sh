#!/usr/bin/env bash
# Session Start Hook - Initialize new conversation file

DIR="docs/claude-conversations"
DATE=$(date +%Y-%m-%d)

# Ensure directory exists
mkdir -p "$DIR"

# Find next available file number
NUMBER=1
while [ -f "$DIR/claude-convo-$DATE-$NUMBER.md" ]; do
  NUMBER=$((NUMBER + 1))
done

FILE="$DIR/claude-convo-$DATE-$NUMBER.md"

# Create file with header
cat > "$FILE" <<EOF
# Claude Code Conversation

**Date:** $(date +"%A, %B %d, %Y")
**Time:** $(date +"%H:%M:%S")
**Model:** claude-sonnet-4-5-20250929
**Session:** $(cat | jq -r '.sessionId // "unknown"')

---

EOF

# Store filename for other hooks to use
echo "$FILE" > /tmp/dialogue-reporter-current-file.txt
