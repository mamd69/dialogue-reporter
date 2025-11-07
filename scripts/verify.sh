#!/bin/bash
# Dialogue Reporter - Verification Script
set -e
echo "🔍 Dialogue Reporter Verification"
echo "================================="
echo ""
ERRORS=0
echo -n "Checking CLI tool... "
if command -v dialogue-reporter &> /dev/null; then echo "✓"; else echo "✗"; ERRORS=$((ERRORS+1)); fi
echo -n "Checking MCP registration... "
if [ -f ".mcprc.json" ] && grep -q "dialogue-reporter" .mcprc.json; then echo "✓"; else echo "✗"; ERRORS=$((ERRORS+1)); fi
echo -n "Checking configuration... "
if [ -f ".dialogue-reporter.json" ]; then echo "✓"; else echo "✗"; ERRORS=$((ERRORS+1)); fi
echo -n "Checking output directory... "
if [ -d "./dialogue-reports" ]; then echo "✓"; else echo "✗"; ERRORS=$((ERRORS+1)); fi
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    exit 0
else
    echo "❌ $ERRORS check(s) failed"
    exit 1
fi
