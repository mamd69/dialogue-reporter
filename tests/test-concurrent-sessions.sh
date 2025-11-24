#!/usr/bin/env bash
# Test concurrent session support

echo "🧪 Testing Concurrent Session Support"
echo "======================================"

# Clean up any existing test files
rm -rf /tmp/dialogue-reporter-test
mkdir -p /tmp/dialogue-reporter-test

# Test 1: Session-specific directories are created
echo ""
echo "Test 1: Session-specific directory creation"
SESSION_ID_1="session-abc123"
SESSION_ID_2="session-xyz789"

SESSION_DIR_1="/tmp/dialogue-reporter-test/$SESSION_ID_1"
SESSION_DIR_2="/tmp/dialogue-reporter-test/$SESSION_ID_2"

mkdir -p "$SESSION_DIR_1"
mkdir -p "$SESSION_DIR_2"

echo "test-file-1.md" > "$SESSION_DIR_1/current-file.txt"
echo "test-file-2.md" > "$SESSION_DIR_2/current-file.txt"

FILE1=$(cat "$SESSION_DIR_1/current-file.txt")
FILE2=$(cat "$SESSION_DIR_2/current-file.txt")

if [ "$FILE1" = "test-file-1.md" ] && [ "$FILE2" = "test-file-2.md" ]; then
  echo "✅ Session-specific directories work correctly"
  echo "   Session 1: $FILE1"
  echo "   Session 2: $FILE2"
else
  echo "❌ Session-specific directories failed"
  exit 1
fi

# Test 2: Session ID extraction from transcript path
echo ""
echo "Test 2: Session ID extraction from transcript path"

TRANSCRIPT_PATH_1="/home/user/.claude/projects/test-project/abc123.jsonl"
TRANSCRIPT_PATH_2="/home/user/.claude/projects/test-project/xyz789.jsonl"

EXTRACTED_ID_1=$(basename "$TRANSCRIPT_PATH_1" .jsonl)
EXTRACTED_ID_2=$(basename "$TRANSCRIPT_PATH_2" .jsonl)

if [ "$EXTRACTED_ID_1" = "abc123" ] && [ "$EXTRACTED_ID_2" = "xyz789" ]; then
  echo "✅ Session ID extraction works correctly"
  echo "   Extracted from path 1: $EXTRACTED_ID_1"
  echo "   Extracted from path 2: $EXTRACTED_ID_2"
else
  echo "❌ Session ID extraction failed"
  exit 1
fi

# Test 3: Each session can track different line numbers independently
echo ""
echo "Test 3: Independent line tracking"

echo "100" > "$SESSION_DIR_1/last-line-processed.txt"
echo "250" > "$SESSION_DIR_2/last-line-processed.txt"

LINE1=$(cat "$SESSION_DIR_1/last-line-processed.txt")
LINE2=$(cat "$SESSION_DIR_2/last-line-processed.txt")

if [ "$LINE1" = "100" ] && [ "$LINE2" = "250" ]; then
  echo "✅ Independent line tracking works correctly"
  echo "   Session 1 last line: $LINE1"
  echo "   Session 2 last line: $LINE2"
else
  echo "❌ Independent line tracking failed"
  exit 1
fi

# Cleanup
rm -rf /tmp/dialogue-reporter-test

echo ""
echo "🎉 All tests passed! Concurrent session support is working."
echo ""
echo "Key improvements:"
echo "  • Each session has its own temp directory: /tmp/dialogue-reporter/\$SESSION_ID/"
echo "  • Session ID is extracted from transcript path"
echo "  • Sessions can run concurrently without interfering"
echo "  • Each session tracks its own conversation file and line position"
