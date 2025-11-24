#!/usr/bin/env bash
# UserPromptSubmit Hook - Capture user messages

# Debug log
LOG_FILE="/tmp/dialogue-reporter-userprompt-debug.log"
echo "=== UserPromptSubmit Called at $(date) ===" >> "$LOG_FILE"

# Read hook input
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')

# Extract session ID from transcript path (format: /path/.../SESSION_ID.jsonl)
SESSION_ID=""
if [ -n "$TRANSCRIPT_PATH" ]; then
  SESSION_ID=$(basename "$TRANSCRIPT_PATH" .jsonl)
fi

echo "SESSION_ID=$SESSION_ID" >> "$LOG_FILE"

# Use session-specific directory for temp files
SESSION_DIR="/tmp/dialogue-reporter/$SESSION_ID"
CONV_FILE=$(cat "$SESSION_DIR/current-file.txt" 2>/dev/null)

echo "PROMPT length: ${#PROMPT}" >> "$LOG_FILE"
echo "CONV_FILE (initial): $CONV_FILE" >> "$LOG_FILE"

# If no conversation file tracked, try to recover it
if [ -z "$CONV_FILE" ]; then
  echo "⚠️  No tracked file, attempting recovery..." >> "$LOG_FILE"

  # Get cwd from hook input or use current directory
  CWD=$(echo "$INPUT" | jq -r '.cwd // ""')
  if [ -z "$CWD" ]; then
    CWD=$(pwd)
  fi

  DIR="$CWD/docs/claude-conversations"

  echo "Looking in: $DIR" >> "$LOG_FILE"
  echo "Searching for SESSION_ID: $SESSION_ID" >> "$LOG_FILE"

  # Find conversation file that matches THIS session ID
  # Search for "**Session:** $SESSION_ID" in all conversation files
  RECENT_FILE=""
  if [ -n "$SESSION_ID" ]; then
    RECENT_FILE=$(grep -l "^\*\*Session:\*\* $SESSION_ID" "$DIR"/claude-convo-*.md 2>/dev/null | head -1)
  fi

  # Fallback: if no session ID match found, try most recent file (legacy behavior)
  if [ -z "$RECENT_FILE" ]; then
    echo "⚠️  No file found for session $SESSION_ID, falling back to most recent" >> "$LOG_FILE"
    RECENT_FILE=$(ls -t "$DIR"/claude-convo-*.md 2>/dev/null | head -1)
  fi

  if [ -n "$RECENT_FILE" ]; then
    CONV_FILE="$RECENT_FILE"
    # Restore tracking in session-specific directory
    mkdir -p "$SESSION_DIR"
    echo "$CONV_FILE" > "$SESSION_DIR/current-file.txt"
    echo "✓ Recovered CONV_FILE: $CONV_FILE" >> "$LOG_FILE"
  else
    echo "❌ No conversation file found. SessionStart may not have run." >&2
    echo "❌ Recovery failed, no file found" >> "$LOG_FILE"
    exit 0
  fi
fi

if [ -n "$PROMPT" ]; then
  # Append user message
  cat >> "$CONV_FILE" <<EOF

## Human

$PROMPT

EOF
  echo "✓ Wrote Human message (${#PROMPT} chars) to $CONV_FILE" >> "$LOG_FILE"
else
  echo "⚠️  Empty PROMPT, skipping" >> "$LOG_FILE"
fi

echo "===" >> "$LOG_FILE"
