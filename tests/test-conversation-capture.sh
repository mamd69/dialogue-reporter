#!/usr/bin/env bash
# Test script for conversation capture

set -e

echo "🧪 Testing Dialogue Reporter Conversation Capture"
echo "================================================="

# Cleanup any previous test data
rm -rf /tmp/dialogue-reporter-test
mkdir -p /tmp/dialogue-reporter-test
rm -f docs/claude-conversations/claude-convo-*-test-*.md

# Create a mock transcript file
TRANSCRIPT_FILE="/tmp/dialogue-reporter-test/transcript.json"
cat > "$TRANSCRIPT_FILE" <<'EOF'
[
  {
    "role": "user",
    "content": "Hello, can you help me with testing?"
  },
  {
    "role": "assistant",
    "content": "Of course! I'd be happy to help you with testing."
  },
  {
    "role": "user",
    "content": "Great! Let's test the conversation capture."
  },
  {
    "role": "assistant",
    "content": "The conversation capture system is now recording our dialogue."
  }
]
EOF

echo "✅ Created mock transcript file"

# Test 1: SessionStart hook
echo ""
echo "📝 Test 1: SessionStart Hook"
echo '{"session_id": "test-session-123", "transcript_path": "'"$TRANSCRIPT_FILE"'"}' | .claude/hooks/SessionStart.sh 2>&1

CONV_FILE=$(cat /tmp/dialogue-reporter/current-file.txt 2>/dev/null)
if [ -f "$CONV_FILE" ]; then
  echo "✅ SessionStart created file: $CONV_FILE"
else
  echo "❌ SessionStart failed to create file"
  exit 1
fi

# Test 2: UserPromptSubmit hook
echo ""
echo "📝 Test 2: UserPromptSubmit Hook"
echo '{"prompt": "Hello, can you help me with testing?"}' | .claude/hooks/UserPromptSubmit.sh 2>&1

if grep -q "Hello, can you help me with testing?" "$CONV_FILE"; then
  echo "✅ UserPromptSubmit captured user message"
else
  echo "❌ UserPromptSubmit failed to capture message"
  cat "$CONV_FILE"
  exit 1
fi

# Test 3: Stop hook (first assistant response)
echo ""
echo "📝 Test 3: Stop Hook (First Response)"
echo '{"transcript_path": "'"$TRANSCRIPT_FILE"'"}' | .claude/hooks/Stop.sh 2>&1

if grep -q "Of course! I'd be happy to help you with testing." "$CONV_FILE"; then
  echo "✅ Stop hook captured first assistant response"
else
  echo "❌ Stop hook failed to capture first response"
  cat "$CONV_FILE"
  exit 1
fi

# Test 4: Second user message
echo ""
echo "📝 Test 4: Second UserPromptSubmit"
echo '{"prompt": "Great! Let'\''s test the conversation capture."}' | .claude/hooks/UserPromptSubmit.sh 2>&1

if grep -q "Great! Let's test the conversation capture." "$CONV_FILE"; then
  echo "✅ Second UserPromptSubmit captured"
else
  echo "❌ Second UserPromptSubmit failed"
  cat "$CONV_FILE"
  exit 1
fi

# Test 5: Stop hook (second assistant response)
echo ""
echo "📝 Test 5: Stop Hook (Second Response)"
echo '{"transcript_path": "'"$TRANSCRIPT_FILE"'"}' | .claude/hooks/Stop.sh 2>&1

if grep -q "The conversation capture system is now recording our dialogue." "$CONV_FILE"; then
  echo "✅ Stop hook captured second assistant response"
else
  echo "❌ Stop hook failed to capture second response"
  cat "$CONV_FILE"
  exit 1
fi

# Test 6: SessionEnd hook
echo ""
echo "📝 Test 6: SessionEnd Hook"
echo '{"transcript_path": "'"$TRANSCRIPT_FILE"'"}' | .claude/hooks/SessionEnd.sh 2>&1

if grep -q "✅ Conversation saved:" /dev/stderr 2>&1; then
  echo "✅ SessionEnd completed successfully"
else
  echo "⚠️  SessionEnd may have issues (non-critical)"
fi

# Verify final file structure
echo ""
echo "📋 Final Conversation File Content:"
echo "===================================="
cat "$CONV_FILE"
echo ""
echo "===================================="

# Verify file has all expected content
ERRORS=0
if ! grep -q "# Claude Code Conversation" "$CONV_FILE"; then
  echo "❌ Missing header"
  ERRORS=$((ERRORS + 1))
fi

if ! grep -q "Session: test-session-123" "$CONV_FILE"; then
  echo "❌ Missing session ID"
  ERRORS=$((ERRORS + 1))
fi

if ! grep -q "## Human" "$CONV_FILE"; then
  echo "❌ Missing Human section"
  ERRORS=$((ERRORS + 1))
fi

if ! grep -q "## Assistant" "$CONV_FILE"; then
  echo "❌ Missing Assistant section"
  ERRORS=$((ERRORS + 1))
fi

USER_MESSAGES=$(grep -c "## Human" "$CONV_FILE" || echo 0)
ASSISTANT_MESSAGES=$(grep -c "## Assistant" "$CONV_FILE" || echo 0)

echo ""
echo "📊 Statistics:"
echo "  User messages: $USER_MESSAGES (expected: 2)"
echo "  Assistant messages: $ASSISTANT_MESSAGES (expected: 2)"

if [ "$USER_MESSAGES" != "2" ] || [ "$ASSISTANT_MESSAGES" != "2" ]; then
  echo "❌ Message count mismatch"
  ERRORS=$((ERRORS + 1))
fi

# Cleanup
rm -rf /tmp/dialogue-reporter-test

if [ $ERRORS -eq 0 ]; then
  echo ""
  echo "✅ All tests passed! Conversation capture is working correctly."
  echo ""
  echo "📁 Test conversation saved to: $CONV_FILE"
  exit 0
else
  echo ""
  echo "❌ $ERRORS test(s) failed"
  exit 1
fi
