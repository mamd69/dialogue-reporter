#!/usr/bin/env node

/**
 * Postinstall Script
 *
 * Runs automatically after npm install
 * Provides helpful guidance for setup
 */

// Skip if in CI/development environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
if (isCI) {
  process.exit(0);
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📝 Dialogue Reporter installed successfully!            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Thank you for installing Dialogue Reporter!

Dialogue Reporter automatically captures your Claude Code conversations
and saves them as beautiful markdown files.

Quick Start:
  1. Navigate to your Claude Code project directory
  2. Run: npx dialogue-reporter install
  3. Start a conversation in Claude Code
  4. Find your captured conversations in docs/claude-conversations/

Available Commands:
  npx dialogue-reporter install    - Install hooks in current project
  npx dialogue-reporter status     - Check installation status
  npx dialogue-reporter config     - View configuration
  npx dialogue-reporter logs       - Debug hook execution
  npx dialogue-reporter uninstall  - Remove from project
  npx dialogue-reporter --help     - Show all commands

Features:
  ✅ Automatic conversation capture with Claude Code hooks
  ✅ Configurable tool display (detailed/simple/hidden)
  ✅ Timezone support for accurate timestamps
  ✅ Persistent tracking survives restarts
  ✅ Zero configuration required (works out of the box)

Documentation:
  https://github.com/mamd69/dialogue-reporter

Issues or questions?
  https://github.com/mamd69/dialogue-reporter/issues

Happy logging! 🚀
`);
