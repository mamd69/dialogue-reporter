#!/usr/bin/env bash
# UserPromptSubmit Hook - Capture user messages

# Read hook input
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""')
CONV_FILE=$(cat /tmp/dialogue-reporter/current-file.txt 2>/dev/null)

if [ -z "$CONV_FILE" ]; then
  echo "⚠️  No conversation file found. SessionStart may not have run." >&2
  exit 0
fi

if [ -n "$PROMPT" ]; then
  # Append user message
  cat >> "$CONV_FILE" <<EOF

## Human

$PROMPT

EOF
fi
