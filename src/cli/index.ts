#!/usr/bin/env node

/**
 * Dialogue Reporter CLI
 *
 * Command-line interface for installing and managing Dialogue Reporter hooks
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('dialogue-reporter')
  .description('Automatically log Claude Code conversations to markdown')
  .version('1.1.0');

/**
 * Install command
 */
program
  .command('install')
  .description('Install Dialogue Reporter hooks in current project')
  .option('--force', 'Overwrite existing hooks')
  .action(async (options) => {
    try {
      console.log('📝 Installing Dialogue Reporter...\n');

      // Step 1: Verify we're in a project directory
      const cwd = process.cwd();
      console.log(`📁 Installing in: ${cwd}\n`);

      // Step 2: Create .claude/hooks directory
      const hooksDir = path.join(cwd, '.claude', 'hooks');
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
        console.log('✅ Created .claude/hooks directory');
      } else {
        console.log('✅ .claude/hooks directory exists');
      }

      // Step 3: Copy hook files
      const templateDir = path.join(__dirname, '../../templates/hooks');
      const hooks = ['SessionStart.sh', 'Stop.sh', 'UserPromptSubmit.sh'];

      for (const hook of hooks) {
        const sourcePath = path.join(templateDir, hook);
        const destPath = path.join(hooksDir, hook);

        if (fs.existsSync(destPath) && !options.force) {
          console.log(`⚠️  ${hook} already exists (use --force to overwrite)`);
          continue;
        }

        fs.copyFileSync(sourcePath, destPath);
        fs.chmodSync(destPath, 0o755); // Make executable
        console.log(`✅ Installed ${hook}`);
      }

      // Step 4: Create config file
      const configPath = path.join(cwd, '.dialogue-reporter.config');
      if (!fs.existsSync(configPath) || options.force) {
        const templateConfigPath = path.join(__dirname, '../../templates/config/default.config');
        fs.copyFileSync(templateConfigPath, configPath);
        console.log('✅ Created .dialogue-reporter.config');
      } else {
        console.log('✅ .dialogue-reporter.config already exists');
      }

      // Step 5: Update .claude/settings.json to register hooks
      const settingsPath = path.join(cwd, '.claude', 'settings.json');
      try {
        updateClaudeSettings(settingsPath, hooksDir);
        console.log('✅ Updated .claude/settings.json with hook registrations');
      } catch (error: any) {
        console.log('⚠️  Could not update .claude/settings.json:', error.message);
        console.log('   You may need to manually add hooks to settings.json');
      }

      // Step 6: Create output directory
      const config = loadConfig(configPath);
      const outputDir = path.join(cwd, config.OUTPUT_DIR || 'docs/claude-conversations');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`✅ Created ${outputDir}`);
      } else {
        console.log(`✅ ${outputDir} exists`);
      }

      console.log('\n🎉 Installation complete!\n');
      console.log('Next steps:');
      console.log('  1. Customize .dialogue-reporter.config if needed');
      console.log('  2. Start a Claude Code conversation');
      console.log(`  3. Your conversations will be saved to ${outputDir}/\n`);
      console.log('Configuration:');
      console.log('  - Edit .dialogue-reporter.config to customize:');
      console.log('    - TIMEZONE: Your timezone (default: America/New_York)');
      console.log('    - OUTPUT_DIR: Where to save conversations');
      console.log('    - TOOL_DISPLAY: "detailed", "simple", or "hidden"\n');

    } catch (error: any) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  });

/**
 * Uninstall command
 */
program
  .command('uninstall')
  .description('Remove Dialogue Reporter hooks')
  .option('--keep-conversations', 'Keep conversation files')
  .action(async (options) => {
    try {
      console.log('🗑️  Uninstalling Dialogue Reporter...\n');

      const cwd = process.cwd();
      const hooksDir = path.join(cwd, '.claude', 'hooks');
      const hooks = ['SessionStart.sh', 'Stop.sh', 'UserPromptSubmit.sh'];

      for (const hook of hooks) {
        const hookPath = path.join(hooksDir, hook);
        if (fs.existsSync(hookPath)) {
          fs.unlinkSync(hookPath);
          console.log(`✅ Removed ${hook}`);
        }
      }

      const configPath = path.join(cwd, '.dialogue-reporter.config');
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        console.log('✅ Removed .dialogue-reporter.config');
      }

      if (!options.keepConversations) {
        const outputDir = path.join(cwd, 'docs/claude-conversations');
        if (fs.existsSync(outputDir)) {
          console.log(`\n⚠️  Conversation files in ${outputDir}/ were not deleted.`);
          console.log('Delete manually if desired.\n');
        }
      }

      console.log('\n✅ Dialogue Reporter uninstalled\n');

    } catch (error: any) {
      console.error('❌ Uninstall failed:', error.message);
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command('status')
  .description('Show Dialogue Reporter installation status')
  .action(() => {
    console.log('📊 Dialogue Reporter Status\n');

    const cwd = process.cwd();
    const hooksDir = path.join(cwd, '.claude', 'hooks');
    const configPath = path.join(cwd, '.dialogue-reporter.config');

    // Check hooks
    const hooks = ['SessionStart.sh', 'Stop.sh', 'UserPromptSubmit.sh'];
    let hooksInstalled = 0;

    for (const hook of hooks) {
      const hookPath = path.join(hooksDir, hook);
      const exists = fs.existsSync(hookPath);
      console.log(`${exists ? '✅' : '❌'} ${hook}`);
      if (exists) hooksInstalled++;
    }

    // Check config
    const configExists = fs.existsSync(configPath);
    console.log(`${configExists ? '✅' : '❌'} .dialogue-reporter.config`);

    // Check output directory
    if (configExists) {
      const config = loadConfig(configPath);
      const outputDir = path.join(cwd, config.OUTPUT_DIR || 'docs/claude-conversations');
      const outputExists = fs.existsSync(outputDir);
      console.log(`${outputExists ? '✅' : '❌'} Output directory: ${outputDir}`);

      if (outputExists) {
        const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.md'));
        console.log(`\n📝 ${files.length} conversation file(s) captured`);
      }
    }

    console.log();

    if (hooksInstalled === hooks.length && configExists) {
      console.log('✅ Dialogue Reporter is installed and ready\n');
    } else {
      console.log('⚠️  Dialogue Reporter is not fully installed');
      console.log('Run "dialogue-reporter install" to set up\n');
    }
  });

/**
 * Config command
 */
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const configPath = path.join(process.cwd(), '.dialogue-reporter.config');

    if (!fs.existsSync(configPath)) {
      console.log('❌ No configuration file found');
      console.log('Run "dialogue-reporter install" first\n');
      return;
    }

    console.log('⚙️  Current Configuration:\n');
    const config = fs.readFileSync(configPath, 'utf-8');
    console.log(config);
    console.log('\nEdit .dialogue-reporter.config to customize settings\n');
  });

/**
 * Logs command
 */
program
  .command('logs')
  .description('Show recent hook logs for debugging')
  .option('--stop', 'Show Stop hook logs')
  .option('--user', 'Show UserPromptSubmit hook logs')
  .action((options) => {
    console.log('📋 Recent Hook Logs\n');

    if (!options.stop && !options.user) {
      // Show both by default
      options.stop = true;
      options.user = true;
    }

    if (options.stop) {
      const stopLog = '/tmp/dialogue-reporter-debug.log';
      console.log('=== Stop Hook ===');
      if (fs.existsSync(stopLog)) {
        const content = fs.readFileSync(stopLog, 'utf-8');
        const lines = content.split('\n').slice(-50); // Last 50 lines
        console.log(lines.join('\n'));
      } else {
        console.log('No logs found');
      }
      console.log();
    }

    if (options.user) {
      const userLog = '/tmp/dialogue-reporter-userprompt-debug.log';
      console.log('=== UserPromptSubmit Hook ===');
      if (fs.existsSync(userLog)) {
        const content = fs.readFileSync(userLog, 'utf-8');
        const lines = content.split('\n').slice(-50); // Last 50 lines
        console.log(lines.join('\n'));
      } else {
        console.log('No logs found');
      }
      console.log();
    }
  });

program.parse();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Update Claude settings.json to register dialogue-reporter hooks
 */
function updateClaudeSettings(settingsPath: string, hooksDir: string): void {
  // Create default settings structure if file doesn't exist
  let settings: any = {
    hooks: {
      SessionStart: [],
      UserPromptSubmit: [],
      Stop: []
    }
  };

  // Read existing settings if file exists
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(content);
    } catch (error) {
      console.log('⚠️  Existing settings.json is invalid, creating backup');
      fs.copyFileSync(settingsPath, `${settingsPath}.backup`);
    }
  }

  // Ensure hooks object exists
  if (!settings.hooks) {
    settings.hooks = {};
  }

  // Helper to check if hook already exists
  const hasHook = (hookArray: any[], command: string): boolean => {
    if (!Array.isArray(hookArray)) return false;
    return hookArray.some(h =>
      h.hooks?.some((hook: any) => hook.command?.includes(command))
    );
  };

  // Add SessionStart hook if not present
  if (!settings.hooks.SessionStart) {
    settings.hooks.SessionStart = [];
  }
  if (!hasHook(settings.hooks.SessionStart, 'SessionStart.sh')) {
    settings.hooks.SessionStart.push({
      hooks: [{
        type: 'command',
        command: '.claude/hooks/SessionStart.sh'
      }]
    });
  }

  // Add UserPromptSubmit hook if not present
  if (!settings.hooks.UserPromptSubmit) {
    settings.hooks.UserPromptSubmit = [];
  }
  if (!hasHook(settings.hooks.UserPromptSubmit, 'UserPromptSubmit.sh')) {
    settings.hooks.UserPromptSubmit.push({
      hooks: [{
        type: 'command',
        command: '.claude/hooks/UserPromptSubmit.sh'
      }]
    });
  }

  // Add Stop hook if not present
  if (!settings.hooks.Stop) {
    settings.hooks.Stop = [];
  }
  if (!hasHook(settings.hooks.Stop, 'Stop.sh')) {
    settings.hooks.Stop.push({
      hooks: [{
        type: 'command',
        command: '.claude/hooks/Stop.sh'
      }]
    });
  }

  // Ensure .claude directory exists
  const claudeDir = path.dirname(settingsPath);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Write updated settings
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}

function loadConfig(configPath: string): Record<string, string> {
  const config: Record<string, string> = {};

  if (!fs.existsSync(configPath)) {
    return config;
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        config[key.trim()] = value.trim();
      }
    }
  }

  return config;
}
