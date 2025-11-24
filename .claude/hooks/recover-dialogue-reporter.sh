#!/usr/bin/env bash
# Recover dialogue-reporter state after /tmp cleanup

echo "🔧 Recovering dialogue-reporter state..."
echo ""

# Load configuration
CONFIG_FILE=".dialogue-reporter.config"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

DIR="${OUTPUT_DIR:-docs/claude-conversations}"

if [ ! -d "$DIR" ]; then
    echo "❌ Output directory not found: $DIR"
    exit 1
fi

# Find all conversation files with session IDs
echo "📂 Scanning conversation files..."

RECOVERED=0
for CONV_FILE in "$DIR"/claude-convo-*.md; do
    if [ ! -f "$CONV_FILE" ]; then
        continue
    fi

    # Extract session ID from conversation file
    SESSION_ID=$(grep "^\*\*Session:\*\*" "$CONV_FILE" | sed 's/\*\*Session:\*\* //')

    if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "unknown" ]; then
        continue
    fi

    # Create session-specific temp directory
    SESSION_DIR="/tmp/dialogue-reporter/$SESSION_ID"
    mkdir -p "$SESSION_DIR"

    # Store conversation file path
    echo "$CONV_FILE" > "$SESSION_DIR/current-file.txt"
    echo "$SESSION_ID" > "$SESSION_DIR/session-id.txt"

    # Recover LAST_LINE from metadata comment in conversation file
    LAST_LINE=$(grep "^<!-- LAST_LINE:" "$CONV_FILE" | tail -1 | sed 's/<!-- LAST_LINE: \([0-9]*\) -->/\1/')

    if [ -n "$LAST_LINE" ] && [[ "$LAST_LINE" =~ ^[0-9]+$ ]]; then
        echo "$LAST_LINE" > "$SESSION_DIR/last-line-processed.txt"
        echo "  ✅ Session $SESSION_ID"
        echo "     File: $(basename "$CONV_FILE")"
        echo "     Last line: $LAST_LINE"
        ((RECOVERED++))
    else
        echo "$LAST_LINE" > "$SESSION_DIR/last-line-processed.txt"
        echo "  ⚠️  Session $SESSION_ID (no LAST_LINE metadata)"
        echo "     File: $(basename "$CONV_FILE")"
    fi

    echo ""
done

echo "════════════════════════════════════════"

if [ $RECOVERED -eq 0 ]; then
    echo "ℹ️  No active sessions found to recover"
    echo ""
    echo "This is normal if:"
    echo "  • You're starting a fresh session"
    echo "  • All previous sessions were properly closed"
else
    echo "✅ Recovered state for $RECOVERED session(s)"
    echo ""
    echo "Your conversations will resume from their last saved position."
fi

echo ""
echo "💡 Tip: This script runs automatically when hooks detect missing state."
echo "   You normally don't need to run it manually."
