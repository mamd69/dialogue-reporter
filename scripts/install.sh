#!/bin/bash
# Dialogue Reporter - Installation Script
set -e
echo "📝 Dialogue Reporter Installation"
echo "=================================="
echo ""
echo "Checking prerequisites..."
if ! command -v claude &> /dev/null; then
    echo "⚠️  Claude CLI not found"
    exit 1
fi
echo "✓ Prerequisites met"
echo ""
if [ ! -f ".mcprc.json" ]; then
    echo '{"mcpServers":{}}' > .mcprc.json
    echo "✓ Created .mcprc.json"
fi
echo "Registering MCP server..."
GLOBAL_NODE_MODULES=$(npm root -g)
MCP_SERVER_PATH="$GLOBAL_NODE_MODULES/dialogue-reporter/dist/mcp/server.js"
node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('.mcprc.json','utf8'));c.mcpServers=c.mcpServers||{};c.mcpServers['dialogue-reporter']={command:'node',args:['$MCP_SERVER_PATH'],env:{DIALOGUE_REPORTER_CONFIG:'./.dialogue-reporter.json'}};fs.writeFileSync('.mcprc.json',JSON.stringify(c,null,2));"
echo "✓ MCP server registered"
if [ ! -f ".dialogue-reporter.json" ]; then
    cat > .dialogue-reporter.json << 'EOF'
{"outputDirectory":"./dialogue-reports","filenamePattern":"conversation-{timestamp}.md","formatting":{"includeMetadata":true,"syntaxHighlighting":true,"includeToolCalls":true,"includeTimestamps":true},"performance":{"maxBufferSize":100,"flushInterval":5000}}
EOF
    echo "✓ Configuration created"
fi
mkdir -p ./dialogue-reports
echo "✓ Output directory created"
echo ""
echo "✅ Dialogue Reporter installed successfully!"
echo "📂 Conversations will be saved to: ./dialogue-reports/"
