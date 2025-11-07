#!/usr/bin/env node

/**
 * Postinstall Script
 *
 * Runs automatically after npm install
 * Provides helpful guidance for setup
 */

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📝 Dialogue Reporter v1.0.0 installed!                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Thank you for installing Dialogue Reporter!

Quick Start:
  1. Navigate to your Claude Code project
  2. Run: dialogue-reporter install
  3. Restart Claude Code
  4. Start a conversation
  5. Check ./dialogue-reports/ for markdown files

Commands:
  dialogue-reporter install   - Setup in current project
  dialogue-reporter verify    - Test installation
  dialogue-reporter status    - Check status
  dialogue-reporter --help    - Show all commands

Documentation:
  https://github.com/dialogue-reporter/dialogue-reporter

Issues or questions?
  https://github.com/dialogue-reporter/dialogue-reporter/issues

Happy logging! 🚀
`);
