#!/usr/bin/env bash
# Session End Hook - Save full conversation transcript

# Read the transcript from stdin
INPUT=$(cat)

# Get the conversation file
CONV_FILE=$(cat /tmp/dialogue-reporter-current-file.txt 2>/dev/null)

if [ -z "$CONV_FILE" ]; then
  # Fallback: create file if it doesn't exist
  DIR="docs/claude-conversations"
  DATE=$(date +%Y-%m-%d)
  mkdir -p "$DIR"

  NUMBER=1
  while [ -f "$DIR/claude-convo-$DATE-$NUMBER.md" ]; do
    NUMBER=$((NUMBER + 1))
  done

  CONV_FILE="$DIR/claude-convo-$DATE-$NUMBER.md"

  cat > "$CONV_FILE" <<EOF
# Claude Code Conversation

**Date:** $(date +"%A, %B %d, %Y")
**Time:** $(date +"%H:%M:%S")
**Session:** conversation-end

---

EOF
fi

# Extract transcript from hook input
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript // empty')

if [ -n "$TRANSCRIPT" ]; then
  # Append the full transcript
  echo "$TRANSCRIPT" >> "$CONV_FILE"
else
  # Try to extract messages array
  echo "$INPUT" | jq -r '
    .messages[]? |
    if .role == "user" then
      "\n## Human\n\n\(.content)\n"
    elif .role == "assistant" then
      "\n## Assistant\n\n\(.content)\n"
    else
      ""
    end
  ' >> "$CONV_FILE" 2>/dev/null
fi

# Clean up temp file
rm -f /tmp/dialogue-reporter-current-file.txt
