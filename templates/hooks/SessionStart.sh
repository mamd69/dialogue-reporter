#!/usr/bin/env bash
# Session Start Hook - Initialize new conversation file

# Read hook input to get session info
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')

# Load configuration
CONFIG_FILE=".dialogue-reporter.config"
if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi

# Use configured values or defaults
TIMEZONE=${TIMEZONE:-"America/New_York"}
DIR=${OUTPUT_DIR:-"docs/claude-conversations"}

# Set timezone for date commands
export TZ="$TIMEZONE"
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
**Session:** $SESSION_ID

---

EOF

# Store metadata for other hooks in SESSION-SPECIFIC directory
SESSION_DIR="/tmp/dialogue-reporter/$SESSION_ID"
mkdir -p "$SESSION_DIR"
echo "$FILE" > "$SESSION_DIR/current-file.txt"
echo "$SESSION_ID" > "$SESSION_DIR/session-id.txt"
echo "$TRANSCRIPT_PATH" > "$SESSION_DIR/transcript-path.txt"
echo "0" > "$SESSION_DIR/last-line-processed.txt"

echo "📝 Conversation started: $FILE (Session: $SESSION_ID)" >&2
