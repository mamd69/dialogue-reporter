/**
 * Configuration Loader
 *
 * Loads and manages user configuration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

import { Config, ConfigError } from '../types';
import { DEFAULT_CONFIG } from './defaults';
import { validateConfig } from './validator';

export class ConfigLoader {
  private currentConfig: Config = DEFAULT_CONFIG;
  private configPath?: string;

  async load(configPath?: string): Promise<Config> {
    const paths = this.getConfigPaths(configPath);

    for (const filePath of paths) {
      if (existsSync(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const config = JSON.parse(content);

          // Validate
          const validation = validateConfig(config);
          if (!validation.valid) {
            throw new ConfigError(
              `Invalid configuration: ${validation.errors.join(', ')}`,
              { path: filePath, errors: validation.errors }
            );
          }

          // Merge with defaults
          this.currentConfig = {
            ...DEFAULT_CONFIG,
            ...config,
            formatting: {
              ...DEFAULT_CONFIG.formatting,
              ...config.formatting,
            },
            performance: {
              ...DEFAULT_CONFIG.performance,
              ...config.performance,
            },
          };

          this.configPath = filePath;
          return this.currentConfig;
        } catch (error) {
          if (error instanceof ConfigError) throw error;

          throw new ConfigError(
            `Failed to load config from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { path: filePath }
          );
        }
      }
    }

    // No config file found, use defaults
    return this.currentConfig;
  }

  async save(config: Config, filePath?: string): Promise<void> {
    const targetPath = filePath || this.configPath || '.dialogue-reporter.json';

    try {
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(targetPath, content, 'utf-8');
      this.currentConfig = config;
      this.configPath = targetPath;
    } catch (error) {
      throw new ConfigError(
        `Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { path: targetPath }
      );
    }
  }

  get(): Config {
    return this.currentConfig;
  }

  async update(partial: Partial<Config>): Promise<void> {
    const updated: Config = {
      ...this.currentConfig,
      ...partial,
      formatting: {
        ...this.currentConfig.formatting,
        ...(partial.formatting || {}),
      },
      performance: {
        ...this.currentConfig.performance,
        ...(partial.performance || {}),
      },
    };

    // Validate updated config
    const validation = validateConfig(updated);
    if (!validation.valid) {
      throw new ConfigError(
        `Invalid configuration update: ${validation.errors.join(', ')}`,
        { errors: validation.errors }
      );
    }

    this.currentConfig = updated;

    // Save if we have a path
    if (this.configPath) {
      await this.save(updated, this.configPath);
    }
  }

  private getConfigPaths(customPath?: string): string[] {
    if (customPath) {
      return [customPath];
    }

    return [
      '.dialogue-reporter.json',
      path.join(process.cwd(), '.dialogue-reporter.json'),
      path.join(process.env.HOME || '~', '.dialogue-reporter.json'),
    ];
  }
}

/**
 * Singleton instance
 */
export const configLoader = new ConfigLoader();
