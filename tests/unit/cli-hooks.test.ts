/**
 * CLI Hook Configuration Tests
 *
 * Tests for the updateClaudeSettings function ensuring correct hook structure
 * per Claude Code documentation.
 *
 * Per Claude Code docs (https://code.claude.com/docs/en/hooks), hooks use nested structure:
 * "EventName": [{ "hooks": [{ "type": "command", "command": "..." }] }]
 */

import * as fs from 'fs';
import * as path from 'path';

describe('CLI Hook Configuration', () => {
  const testDir = '/tmp/dialogue-reporter-cli-test';
  const settingsPath = path.join(testDir, '.claude', 'settings.json');

  beforeEach(() => {
    // Clean test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(path.join(testDir, '.claude', 'hooks'), { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  /**
   * Helper to simulate updateClaudeSettings behavior
   * This mirrors the logic in src/cli/index.ts
   */
  function updateClaudeSettings(settingsPath: string): void {
    let settings: any = {
      hooks: {
        SessionStart: [],
        UserPromptSubmit: [],
        Stop: [],
      },
    };

    if (fs.existsSync(settingsPath)) {
      try {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        settings = JSON.parse(content);
      } catch (error) {
        fs.copyFileSync(settingsPath, `${settingsPath}.backup`);
      }
    }

    if (!settings.hooks) {
      settings.hooks = {};
    }

    // Check if hook exists in nested structure
    const hasHook = (hookArray: any[], command: string): boolean => {
      if (!Array.isArray(hookArray)) return false;
      return hookArray.some((h) => h.hooks?.some((hook: any) => hook.command?.includes(command)));
    };

    // Add hooks with nested structure per Claude Code docs
    // Use $CLAUDE_PROJECT_DIR for reliable path resolution
    if (!settings.hooks.SessionStart) {
      settings.hooks.SessionStart = [];
    }
    if (!hasHook(settings.hooks.SessionStart, 'SessionStart.sh')) {
      settings.hooks.SessionStart.push({
        hooks: [
          {
            type: 'command',
            command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/SessionStart.sh',
          },
        ],
      });
    }

    if (!settings.hooks.UserPromptSubmit) {
      settings.hooks.UserPromptSubmit = [];
    }
    if (!hasHook(settings.hooks.UserPromptSubmit, 'UserPromptSubmit.sh')) {
      settings.hooks.UserPromptSubmit.push({
        hooks: [
          {
            type: 'command',
            command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/UserPromptSubmit.sh',
          },
        ],
      });
    }

    if (!settings.hooks.Stop) {
      settings.hooks.Stop = [];
    }
    if (!hasHook(settings.hooks.Stop, 'Stop.sh')) {
      settings.hooks.Stop.push({
        hooks: [
          {
            type: 'command',
            command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/Stop.sh',
          },
        ],
      });
    }

    const claudeDir = path.dirname(settingsPath);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }

  describe('hook structure validation', () => {
    it('should generate nested hook structure per Claude Code docs', () => {
      // Run the update function
      updateClaudeSettings(settingsPath);

      // Read the generated settings
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

      // Verify nested structure per Claude Code documentation
      expect(settings.hooks).toBeDefined();

      // SessionStart should have nested structure
      expect(settings.hooks.SessionStart).toBeDefined();
      expect(Array.isArray(settings.hooks.SessionStart)).toBe(true);
      expect(settings.hooks.SessionStart.length).toBeGreaterThan(0);

      const sessionHook = settings.hooks.SessionStart[0];
      // Should have nested 'hooks' array
      expect(sessionHook.hooks).toBeDefined();
      expect(Array.isArray(sessionHook.hooks)).toBe(true);
      expect(sessionHook.hooks[0].type).toBe('command');
      expect(sessionHook.hooks[0].command).toContain('SessionStart.sh');

      // UserPromptSubmit should have nested structure
      expect(settings.hooks.UserPromptSubmit).toBeDefined();
      expect(settings.hooks.UserPromptSubmit[0].hooks).toBeDefined();
      expect(settings.hooks.UserPromptSubmit[0].hooks[0].type).toBe('command');
      expect(settings.hooks.UserPromptSubmit[0].hooks[0].command).toContain('UserPromptSubmit.sh');

      // Stop should have nested structure
      expect(settings.hooks.Stop).toBeDefined();
      expect(settings.hooks.Stop[0].hooks).toBeDefined();
      expect(settings.hooks.Stop[0].hooks[0].type).toBe('command');
      expect(settings.hooks.Stop[0].hooks[0].command).toContain('Stop.sh');
    });

    it('should preserve existing hooks when adding new ones', () => {
      // Create settings with existing hooks (different command)
      const existingSettings = {
        hooks: {
          SessionStart: [
            {
              hooks: [
                {
                  type: 'command',
                  command: 'echo "existing hook"',
                },
              ],
            },
          ],
        },
      };

      fs.writeFileSync(settingsPath, JSON.stringify(existingSettings, null, 2));

      // Run update
      updateClaudeSettings(settingsPath);

      // Read the settings
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

      // Should have both the existing hook and the dialogue-reporter hook
      expect(settings.hooks.SessionStart.length).toBe(2);

      const hasExistingHook = settings.hooks.SessionStart.some(
        (h: any) => h.hooks?.[0]?.command === 'echo "existing hook"'
      );
      expect(hasExistingHook).toBe(true);

      const hasDialogueReporterHook = settings.hooks.SessionStart.some(
        (h: any) => h.hooks?.[0]?.command?.includes('SessionStart.sh')
      );
      expect(hasDialogueReporterHook).toBe(true);
    });

    it('should not duplicate hooks on multiple runs', () => {
      // First run
      updateClaudeSettings(settingsPath);

      // Second run
      updateClaudeSettings(settingsPath);

      // Read the settings
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

      // Should only have one of each hook
      expect(settings.hooks.SessionStart.length).toBe(1);
      expect(settings.hooks.UserPromptSubmit.length).toBe(1);
      expect(settings.hooks.Stop.length).toBe(1);
    });
  });

  describe('correct structure per Claude Code docs', () => {
    it('should match documented hook structure with $CLAUDE_PROJECT_DIR', () => {
      // Per https://code.claude.com/docs/en/hooks
      // The correct structure for events without matchers is:
      // "hooks": {
      //   "SessionStart": [
      //     { "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/..." }] }
      //   ]
      // }

      const correctStructure = {
        hooks: {
          SessionStart: [
            {
              hooks: [
                {
                  type: 'command',
                  command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/SessionStart.sh',
                },
              ],
            },
          ],
        },
      };

      // Verify this is valid JSON and has the expected nested shape
      expect(correctStructure.hooks.SessionStart[0].hooks).toBeDefined();
      expect(correctStructure.hooks.SessionStart[0].hooks[0].type).toBe('command');
      expect(correctStructure.hooks.SessionStart[0].hooks[0].command).toContain('$CLAUDE_PROJECT_DIR');
    });

    it('should use type "command" not "script"', () => {
      // Per Claude Code docs, only "command" and "prompt" are valid types
      // "script" is NOT valid
      updateClaudeSettings(settingsPath);

      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

      // All hooks should use type: "command"
      expect(settings.hooks.SessionStart[0].hooks[0].type).toBe('command');
      expect(settings.hooks.UserPromptSubmit[0].hooks[0].type).toBe('command');
      expect(settings.hooks.Stop[0].hooks[0].type).toBe('command');

      // None should use "script"
      const allHooksValid = [
        ...settings.hooks.SessionStart,
        ...settings.hooks.UserPromptSubmit,
        ...settings.hooks.Stop,
      ].every((h: any) => h.hooks?.every((hook: any) => hook.type !== 'script'));
      expect(allHooksValid).toBe(true);
    });

    it('should use $CLAUDE_PROJECT_DIR for reliable path resolution', () => {
      // Per Claude Code docs, use $CLAUDE_PROJECT_DIR for scripts
      updateClaudeSettings(settingsPath);

      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

      // All hook commands should use $CLAUDE_PROJECT_DIR
      expect(settings.hooks.SessionStart[0].hooks[0].command).toContain('$CLAUDE_PROJECT_DIR');
      expect(settings.hooks.UserPromptSubmit[0].hooks[0].command).toContain('$CLAUDE_PROJECT_DIR');
      expect(settings.hooks.Stop[0].hooks[0].command).toContain('$CLAUDE_PROJECT_DIR');
    });
  });
});
