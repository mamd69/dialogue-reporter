#!/usr/bin/env bash
# Verify dialogue-reporter installation

echo "🔍 Checking dialogue-reporter installation..."
echo ""

ERRORS=0
WARNINGS=0

# Check hook scripts exist and are executable
echo "📂 Hook Scripts:"
for hook in SessionStart Stop UserPromptSubmit; do
    HOOK_FILE=".claude/hooks/${hook}.sh"
    if [ ! -f "$HOOK_FILE" ]; then
        echo "  ❌ Missing: $HOOK_FILE"
        ((ERRORS++))
    elif [ ! -x "$HOOK_FILE" ]; then
        echo "  ⚠️  Not executable: $HOOK_FILE"
        echo "     Fix with: chmod +x $HOOK_FILE"
        ((WARNINGS++))
    else
        echo "  ✅ $hook.sh"
    fi
done

echo ""
echo "📝 Settings Registration:"

# Check settings.json exists
if [ ! -f ".claude/settings.json" ]; then
    echo "  ❌ Missing: .claude/settings.json"
    echo "     Run: bash .claude/hooks/install-dialogue-reporter.sh"
    ((ERRORS++))
else
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        echo "  ⚠️  Cannot verify registration (jq not installed)"
        echo "     Install jq to verify hook registration"
        ((WARNINGS++))
    else
        # Check each hook registration
        for hook in SessionStart Stop UserPromptSubmit; do
            REGISTERED=$(jq -e ".hooks.$hook[]?.hooks[]? | select(.script? == \".claude/hooks/${hook}.sh\")" .claude/settings.json 2>/dev/null)
            if [ -z "$REGISTERED" ]; then
                echo "  ❌ Not registered in settings.json: $hook"
                echo "     Run: bash .claude/hooks/install-dialogue-reporter.sh"
                ((ERRORS++))
            else
                echo "  ✅ $hook registered"
            fi
        done
    fi
fi

echo ""
echo "🔧 Dependencies:"

# Check jq
if command -v jq &> /dev/null; then
    echo "  ✅ jq installed"
else
    echo "  ❌ jq not installed (required for installation script)"
    echo "     Install: sudo apt-get install jq (Ubuntu/Debian)"
    echo "            brew install jq (macOS)"
    ((ERRORS++))
fi

echo ""
echo "📁 Configuration:"

# Check config file
if [ -f ".dialogue-reporter.config" ]; then
    echo "  ✅ Configuration file exists"

    # Load and display config
    source .dialogue-reporter.config 2>/dev/null || true
    OUTPUT_DIR="${OUTPUT_DIR:-docs/claude-conversations}"

    if [ ! -d "$OUTPUT_DIR" ]; then
        echo "  ⚠️  Output directory doesn't exist: $OUTPUT_DIR"
        echo "     Will be created automatically on first use"
        ((WARNINGS++))
    else
        FILE_COUNT=$(ls -1 "$OUTPUT_DIR"/*.md 2>/dev/null | wc -l)
        echo "  ✅ Output directory: $OUTPUT_DIR ($FILE_COUNT conversation files)"
    fi

    TOOL_DISPLAY="${TOOL_DISPLAY:-detailed}"
    echo "  ℹ️  Tool display mode: $TOOL_DISPLAY"

    TIMEZONE="${TIMEZONE:-America/New_York}"
    echo "  ℹ️  Timezone: $TIMEZONE"
else
    echo "  ⚠️  No configuration file found"
    echo "     Default settings will be used"
    ((WARNINGS++))
fi

echo ""
echo "📊 Summary:"
echo "════════════════════════════════════════"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Perfect! All checks passed."
    echo ""
    echo "Dialogue-reporter is properly installed and configured."
    echo "Restart Claude Code to activate the hooks."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Installation OK with $WARNINGS warning(s)."
    echo ""
    echo "Dialogue-reporter should work, but consider fixing warnings."
    exit 0
else
    echo "❌ Found $ERRORS error(s) and $WARNINGS warning(s)."
    echo ""
    echo "To fix these issues, run:"
    echo "  bash .claude/hooks/install-dialogue-reporter.sh"
    echo ""
    echo "If problems persist, check:"
    echo "  • Installation guide: docs/claude-conversations/DIALOGUE-REPORTER-README.md"
    echo "  • Debug logs: tail -f /tmp/dialogue-reporter-debug.log"
    exit 1
fi
