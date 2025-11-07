#!/usr/bin/env node

/**
 * Dialogue Reporter CLI
 *
 * Command-line interface for managing Dialogue Reporter
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const program = new Command();

program
  .name('dialogue-reporter')
  .description('Automatically log Claude Code conversations to markdown')
  .version('1.0.0');

/**
 * Install command
 */
program
  .command('install')
  .description('Install and configure Dialogue Reporter')
  .option('--manual', 'Show manual installation steps')
  .option('--force', 'Force re-installation')
  .action(async (options) => {
    try {
      if (options.manual) {
        showManualInstructions();
        return;
      }

      console.log('📝 Installing Dialogue Reporter...\n');

      // Step 1: Check Claude Flow
      console.log('🔍 Checking for Claude Flow...');
      const hasClaudeFlow = await checkClaudeFlow();

      if (!hasClaudeFlow) {
        console.log('❌ Claude Flow not detected');
        console.log('\nInstall Claude Flow first:');
        console.log('  claude mcp add claude-flow npx claude-flow@alpha mcp start\n');
        process.exit(1);
      }

      console.log('✅ Claude Flow detected\n');

      // Step 2: Detect Claude Code project
      console.log('🔍 Detecting Claude Code project...');
      const isClaudeProject = await detectClaudeProject();

      if (!isClaudeProject) {
        console.log('⚠️  Not in a Claude Code project');
        console.log('\nRun this command from your project directory.\n');
        process.exit(1);
      }

      console.log('✅ Claude Code project detected\n');

      // Step 3: Register MCP server
      console.log('📝 Registering MCP server...');
      await registerMCPServer(options.force);
      console.log('✅ MCP server registered\n');

      // Step 4: Create config
      console.log('⚙️  Creating configuration...');
      await createDefaultConfig();
      console.log('✅ Configuration created\n');

      // Step 5: Setup output directory
      console.log('📁 Setting up output directory...');
      await setupOutputDirectory();
      console.log('✅ Output directory ready\n');

      // Step 6: Verify
      console.log('🔍 Running verification...');
      const verified = await runVerification();

      if (verified) {
        console.log('✅ All checks passed\n');
        console.log('🎉 Dialogue Reporter installed successfully!\n');
        console.log('Your conversations will be saved to: ./dialogue-reports/\n');
        console.log('Next steps:');
        console.log('  1. Restart Claude Code');
        console.log('  2. Start a conversation');
        console.log('  3. Check ./dialogue-reports/ for your markdown file\n');
      } else {
        console.log('⚠️  Installation complete but verification failed');
        console.log('Run "dialogue-reporter verify" to troubleshoot\n');
      }
    } catch (error) {
      console.error('❌ Installation failed:', error);
      process.exit(1);
    }
  });

/**
 * Verify command
 */
program
  .command('verify')
  .description('Verify Dialogue Reporter installation')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    console.log('🔍 Verifying Dialogue Reporter installation...\n');

    const checks = [
      { name: 'MCP server registered', fn: checkMCPRegistration },
      { name: 'Configuration valid', fn: checkConfiguration },
      { name: 'Output directory writable', fn: checkOutputDirectory },
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        const result = await check.fn();
        if (result) {
          console.log(`✅ ${check.name}`);
        } else {
          console.log(`❌ ${check.name}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${check.name}: ${error}`);
        allPassed = false;
      }
    }

    console.log();

    if (allPassed) {
      console.log('✅ All checks passed\n');
      process.exit(0);
    } else {
      console.log('❌ Some checks failed\n');
      console.log('Troubleshooting:');
      console.log('  1. Run "dialogue-reporter install --force"');
      console.log('  2. Check logs with "dialogue-reporter logs"');
      console.log('  3. See docs: https://github.com/dialogue-reporter/dialogue-reporter\n');
      process.exit(1);
    }
  });

/**
 * Configuration commands
 */
const configCmd = program
  .command('config')
  .description('Manage configuration');

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const configPath = '.dialogue-reporter.json';
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log('No configuration file found');
      console.log('Run "dialogue-reporter install" to create one');
    }
  });

configCmd
  .command('reset')
  .description('Reset to default configuration')
  .action(async () => {
    await createDefaultConfig();
    console.log('✅ Configuration reset to defaults');
  });

/**
 * Status command
 */
program
  .command('status')
  .description('Show Dialogue Reporter status')
  .action(async () => {
    console.log('Dialogue Reporter Status\n');

    const mcp = await checkMCPRegistration();
    console.log(`MCP Server:     ${mcp ? '✅ Registered' : '❌ Not registered'}`);

    const config = await checkConfiguration();
    console.log(`Configuration:  ${config ? '✅ Valid' : '❌ Invalid'}`);

    const output = await checkOutputDirectory();
    console.log(`Output Dir:     ${output ? '✅ Writable' : '❌ Not writable'}`);

    console.log();
  });

/**
 * Uninstall command
 */
program
  .command('uninstall')
  .description('Uninstall Dialogue Reporter')
  .action(async () => {
    console.log('🗑️  Uninstalling Dialogue Reporter...\n');

    try {
      // Remove MCP registration
      console.log('📝 Removing MCP registration...');
      await removeMCPServer();
      console.log('✅ MCP registration removed\n');

      console.log('✅ Dialogue Reporter uninstalled\n');
      console.log('Note: Your conversation markdown files in ./dialogue-reports/ were not deleted.\n');
    } catch (error) {
      console.error('❌ Uninstall failed:', error);
      process.exit(1);
    }
  });

program.parse();

// ============================================================================
// Helper Functions
// ============================================================================

async function checkClaudeFlow(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('npx claude-flow@alpha --version');
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function detectClaudeProject(): Promise<boolean> {
  // Check for Claude Code indicators
  return (
    fs.existsSync('.claude') ||
    fs.existsSync('.mcprc.json') ||
    fs.existsSync('.mcp.json')
  );
}

async function registerMCPServer(force: boolean = false): Promise<void> {
  const mcprcPath = '.mcprc.json';
  let mcprc: any = {};

  if (fs.existsSync(mcprcPath)) {
    mcprc = JSON.parse(fs.readFileSync(mcprcPath, 'utf-8'));
  }

  if (!mcprc.servers) {
    mcprc.servers = {};
  }

  if (mcprc.servers['dialogue-reporter'] && !force) {
    console.log('(already registered)');
    return;
  }

  // Add server configuration
  mcprc.servers['dialogue-reporter'] = {
    command: 'node',
    args: [path.resolve(__dirname, '../mcp/server.js')],
    env: {
      DIALOGUE_REPORTER_CONFIG: path.resolve(process.cwd(), '.dialogue-reporter.json'),
    },
  };

  fs.writeFileSync(mcprcPath, JSON.stringify(mcprc, null, 2));
}

async function createDefaultConfig(): Promise<void> {
  const configPath = '.dialogue-reporter.json';
  const defaultConfig = {
    outputDirectory: './dialogue-reports',
    filenamePattern: 'conversation-{timestamp}.md',
    formatting: {
      syntaxHighlighting: true,
      includeMetadata: true,
      includeTimestamps: true,
      includeToolCalls: true,
    },
    performance: {
      maxBufferSize: 100,
      flushInterval: 5000,
      asyncWrites: true,
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

async function setupOutputDirectory(): Promise<void> {
  const dir = './dialogue-reports';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function runVerification(): Promise<boolean> {
  try {
    const mcp = await checkMCPRegistration();
    const config = await checkConfiguration();
    const output = await checkOutputDirectory();

    return mcp && config && output;
  } catch {
    return false;
  }
}

async function checkMCPRegistration(): Promise<boolean> {
  const mcprcPath = '.mcprc.json';

  if (!fs.existsSync(mcprcPath)) {
    return false;
  }

  const mcprc = JSON.parse(fs.readFileSync(mcprcPath, 'utf-8'));
  return !!mcprc.servers?.['dialogue-reporter'];
}

async function checkConfiguration(): Promise<boolean> {
  const configPath = '.dialogue-reporter.json';

  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return !!(config.outputDirectory && config.filenamePattern);
  } catch {
    return false;
  }
}

async function checkOutputDirectory(): Promise<boolean> {
  const configPath = '.dialogue-reporter.json';

  if (!fs.existsSync(configPath)) {
    return false;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const dir = config.outputDirectory || './dialogue-reports';

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Test write
    const testFile = path.join(dir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    return true;
  } catch {
    return false;
  }
}

async function removeMCPServer(): Promise<void> {
  const mcprcPath = '.mcprc.json';

  if (!fs.existsSync(mcprcPath)) {
    return;
  }

  const mcprc = JSON.parse(fs.readFileSync(mcprcPath, 'utf-8'));

  if (mcprc.servers?.['dialogue-reporter']) {
    delete mcprc.servers['dialogue-reporter'];
    fs.writeFileSync(mcprcPath, JSON.stringify(mcprc, null, 2));
  }
}

function showManualInstructions(): void {
  console.log(`
Manual Installation Steps

1. Add MCP Server Registration
   Edit .mcprc.json and add:

   "dialogue-reporter": {
     "command": "node",
     "args": ["./node_modules/dialogue-reporter/dist/mcp/server.js"],
     "env": {
       "DIALOGUE_REPORTER_CONFIG": "./.dialogue-reporter.json"
     }
   }

2. Create Configuration File
   Create .dialogue-reporter.json:

   {
     "outputDirectory": "./dialogue-reports",
     "filenamePattern": "conversation-{timestamp}.md",
     "formatting": {
       "syntaxHighlighting": true,
       "includeMetadata": true,
       "includeTimestamps": true,
       "includeToolCalls": true
     },
     "performance": {
       "maxBufferSize": 100,
       "flushInterval": 5000,
       "asyncWrites": true
     }
   }

3. Create Output Directory
   mkdir -p ./dialogue-reports

4. Restart Claude Code

5. Verify
   dialogue-reporter verify
  `);
}
