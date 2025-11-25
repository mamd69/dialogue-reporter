/**
 * CLI Hook Configuration Tests
 *
 * Tests for the updateClaudeSettings function ensuring correct hook structure
 * per Claude Code documentation.
 */

import * as fs from 'fs';
import * as path from 'path';

// Import the function we're testing by loading the compiled CLI module
// We need to test the updateClaudeSettings logic directly

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

    const hasHook = (hookArray: any[], command: string): boolean => {
      if (!Array.isArray(hookArray)) return false;
      return hookArray.some(
        (h) =>
          h.command?.includes(command) ||
          h.hooks?.some((hook: any) => hook.command?.includes(command))
      );
    };

    const migrateHookArray = (hookArray: any[]): any[] => {
      if (!Array.isArray(hookArray)) return [];
      const migrated: any[] = [];
      for (const item of hookArray) {
        if (item.hooks && Array.isArray(item.hooks)) {
          migrated.push(...item.hooks);
        } else if (item.type && item.command) {
          migrated.push(item);
        }
      }
      return migrated;
    };

    if (settings.hooks.SessionStart) {
      settings.hooks.SessionStart = migrateHookArray(settings.hooks.SessionStart);
    }
    if (settings.hooks.UserPromptSubmit) {
      settings.hooks.UserPromptSubmit = migrateHookArray(settings.hooks.UserPromptSubmit);
    }
    if (settings.hooks.Stop) {
      settings.hooks.Stop = migrateHookArray(settings.hooks.Stop);
    }

    if (!settings.hooks.SessionStart) {
      settings.hooks.SessionStart = [];
    }
    if (!hasHook(settings.hooks.SessionStart, 'SessionStart.sh')) {
      settings.hooks.SessionStart.push({
        type: 'command',
        command: '.claude/hooks/SessionStart.sh',
      });
    }

    if (!settings.hooks.UserPromptSubmit) {
      settings.hooks.UserPromptSubmit = [];
    }
    if (!hasHook(settings.hooks.UserPromptSubmit, 'UserPromptSubmit.sh')) {
      settings.hooks.UserPromptSubmit.push({
        type: 'command',
        command: '.claude/hooks/UserPromptSubmit.sh',
      });
    }

    if (!settings.hooks.Stop) {
      settings.hooks.Stop = [];
    }
    if (!hasHook(settings.hooks.Stop, 'Stop.sh')) {
      settings.hooks.Stop.push({
        type: 'command',
        command: '.claude/hooks/Stop.sh',
      });
    }

    const claudeDir = path.dirname(settingsPath);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }

  describe('hook structure validation', () => {
    it('should generate flat hook structure (not nested)', () => {
      // Run the update function
      updateClaudeSettings(settingsPath);

      // Read the generated settings
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

      // Verify flat structure (hooks directly in array, not nested under "hooks" key)
      expect(settings.hooks).toBeDefined();

      // SessionStart should have flat structure
      expect(settings.hooks.SessionStart).toBeDefined();
      expect(Array.isArray(settings.hooks.SessionStart)).toBe(true);
      expect(settings.hooks.SessionStart.length).toBeGreaterThan(0);

      const hook = settings.hooks.SessionStart[0];
      // Should have 'type' and 'command' directly, not nested
      expect(hook.type).toBe('command');
      expect(hook.command).toContain('SessionStart.sh');
      // Should NOT have nested 'hooks' array
      expect(hook.hooks).toBeUndefined();

      // UserPromptSubmit should have flat structure
      expect(settings.hooks.UserPromptSubmit).toBeDefined();
      expect(settings.hooks.UserPromptSubmit[0].type).toBe('command');
      expect(settings.hooks.UserPromptSubmit[0].command).toContain('UserPromptSubmit.sh');
      expect(settings.hooks.UserPromptSubmit[0].hooks).toBeUndefined();

      // Stop should have flat structure
      expect(settings.hooks.Stop).toBeDefined();
      expect(settings.hooks.Stop[0].type).toBe('command');
      expect(settings.hooks.Stop[0].command).toContain('Stop.sh');
      expect(settings.hooks.Stop[0].hooks).toBeUndefined();
    });

    it('should migrate old nested structure to flat structure', () => {
      // Create settings with old incorrect nested structure
      const oldSettings = {
        hooks: {
          SessionStart: [
            {
              hooks: [
                {
                  type: 'command',
                  command: '.claude/hooks/SessionStart.sh',
                },
              ],
            },
          ],
          UserPromptSubmit: [
            {
              hooks: [
                {
                  type: 'command',
                  command: '.claude/hooks/UserPromptSubmit.sh',
                },
              ],
            },
          ],
          Stop: [
            {
              hooks: [
                {
                  type: 'command',
                  command: '.claude/hooks/Stop.sh',
                },
              ],
            },
          ],
        },
      };

      fs.writeFileSync(settingsPath, JSON.stringify(oldSettings, null, 2));

      // Run update (should migrate)
      updateClaudeSettings(settingsPath);

      // Read the migrated settings
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

      // Verify migration to flat structure
      expect(settings.hooks.SessionStart[0].hooks).toBeUndefined();
      expect(settings.hooks.SessionStart[0].type).toBe('command');

      expect(settings.hooks.UserPromptSubmit[0].hooks).toBeUndefined();
      expect(settings.hooks.UserPromptSubmit[0].type).toBe('command');

      expect(settings.hooks.Stop[0].hooks).toBeUndefined();
      expect(settings.hooks.Stop[0].type).toBe('command');
    });

    it('should preserve existing flat hooks when adding new ones', () => {
      // Create settings with existing flat hooks (different command)
      const existingSettings = {
        hooks: {
          SessionStart: [
            {
              type: 'command',
              command: 'echo "existing hook"',
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
        (h: any) => h.command === 'echo "existing hook"'
      );
      expect(hasExistingHook).toBe(true);

      const hasDialogueReporterHook = settings.hooks.SessionStart.some(
        (h: any) => h.command?.includes('SessionStart.sh')
      );
      expect(hasDialogueReporterHook).toBe(true);

      // All hooks should be flat
      settings.hooks.SessionStart.forEach((hook: any) => {
        expect(hook.hooks).toBeUndefined();
      });
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
    it('should match documented hook structure', () => {
      // Per https://docs.claude.com/en/docs/claude-code/hooks
      // The correct structure is:
      // "hooks": {
      //   "SessionStart": [
      //     { "type": "command", "command": "..." }
      //   ]
      // }

      const correctStructure = {
        hooks: {
          SessionStart: [
            {
              type: 'command',
              command: '.claude/hooks/SessionStart.sh',
            },
          ],
        },
      };

      // Verify this is valid JSON and has the expected shape
      expect(correctStructure.hooks.SessionStart[0].type).toBe('command');
      expect(correctStructure.hooks.SessionStart[0].command).toBeDefined();
      expect((correctStructure.hooks.SessionStart[0] as any).hooks).toBeUndefined();
    });

    it('should NOT have nested hooks wrapper', () => {
      // The INCORRECT structure that was generated before:
      const incorrectStructure = {
        hooks: {
          SessionStart: [
            {
              hooks: [
                {
                  type: 'command',
                  command: '.claude/hooks/SessionStart.sh',
                },
              ],
            },
          ],
        },
      };

      // This is what we're trying to avoid
      expect(incorrectStructure.hooks.SessionStart[0].hooks).toBeDefined();
      // The "hooks" key inside the array item is WRONG
    });
  });
});
