#!/usr/bin/env bash
# Session End Hook - Final cleanup and save

# Load configuration for timezone
CONFIG_FILE=".dialogue-reporter.config"
if [ -f "$CONFIG_FILE" ]; then
  source "$CONFIG_FILE"
fi
export TZ="${TIMEZONE:-America/New_York}"

# Read hook input
INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')
CONV_FILE=$(cat /tmp/dialogue-reporter/current-file.txt 2>/dev/null)

if [ -n "$CONV_FILE" ] && [ -f "$CONV_FILE" ]; then
  # Do a final capture of any remaining messages
  if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    LAST_INDEX=$(cat /tmp/dialogue-reporter/last-message-index.txt 2>/dev/null || echo "0")
    TOTAL_MESSAGES=$(jq 'length' "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

    # Capture any remaining messages
    for ((i=$LAST_INDEX; i<$TOTAL_MESSAGES; i++)); do
      ROLE=$(jq -r ".[$i].role // empty" "$TRANSCRIPT_PATH")
      CONTENT=$(jq -r ".[$i].content // empty" "$TRANSCRIPT_PATH")

      if [ -n "$CONTENT" ]; then
        if [ "$ROLE" = "user" ]; then
          cat >> "$CONV_FILE" <<EOF

## Human

$CONTENT

EOF
        elif [ "$ROLE" = "assistant" ]; then
          cat >> "$CONV_FILE" <<EOF

## Assistant

$CONTENT

EOF
        fi
      fi
    done
  fi

  echo "✅ Conversation saved: $CONV_FILE" >&2
fi

# Clean up temp files
rm -rf /tmp/dialogue-reporter 2>/dev/null
