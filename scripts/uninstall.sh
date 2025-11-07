#!/bin/bash
# Dialogue Reporter - Uninstall Script
echo "🗑️  Dialogue Reporter Uninstall"
echo "==============================="
read -p "Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 0; fi
if [ -f ".mcprc.json" ]; then
    node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('.mcprc.json','utf8'));if(c.mcpServers&&c.mcpServers['dialogue-reporter']){delete c.mcpServers['dialogue-reporter'];fs.writeFileSync('.mcprc.json',JSON.stringify(c,null,2));}"
    echo "✓ MCP server unregistered"
fi
read -p "Remove config? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] && [ -f ".dialogue-reporter.json" ]; then rm .dialogue-reporter.json; echo "✓ Config removed"; fi
read -p "Remove logs? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] && [ -d "./dialogue-reports" ]; then rm -rf ./dialogue-reports; echo "✓ Logs removed"; fi
echo "✅ Uninstalled"
