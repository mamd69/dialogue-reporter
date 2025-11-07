/**
 * Configuration Validator
 *
 * Validates user configuration for correctness
 */

import { Config, ValidationResult } from '../types';

export function validateConfig(config: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!config.outputDirectory) {
    errors.push('outputDirectory is required');
  }

  if (!config.filenamePattern) {
    errors.push('filenamePattern is required');
  }

  // Validate outputDirectory
  if (typeof config.outputDirectory !== 'string') {
    errors.push('outputDirectory must be a string');
  }

  // Validate filenamePattern
  if (typeof config.filenamePattern !== 'string') {
    errors.push('filenamePattern must be a string');
  }

  // Validate formatting options
  if (config.formatting) {
    if (typeof config.formatting.syntaxHighlighting !== 'boolean') {
      errors.push('formatting.syntaxHighlighting must be a boolean');
    }

    if (typeof config.formatting.includeMetadata !== 'boolean') {
      errors.push('formatting.includeMetadata must be a boolean');
    }

    if (typeof config.formatting.includeTimestamps !== 'boolean') {
      errors.push('formatting.includeTimestamps must be a boolean');
    }

    if (typeof config.formatting.includeToolCalls !== 'boolean') {
      errors.push('formatting.includeToolCalls must be a boolean');
    }
  } else {
    errors.push('formatting configuration is required');
  }

  // Validate performance options
  if (config.performance) {
    if (typeof config.performance.maxBufferSize !== 'number') {
      errors.push('performance.maxBufferSize must be a number');
    } else if (config.performance.maxBufferSize < 1) {
      errors.push('performance.maxBufferSize must be at least 1');
    } else if (config.performance.maxBufferSize > 1000) {
      warnings.push('performance.maxBufferSize > 1000 may use excessive memory');
    }

    if (typeof config.performance.flushInterval !== 'number') {
      errors.push('performance.flushInterval must be a number');
    } else if (config.performance.flushInterval < 0) {
      errors.push('performance.flushInterval must be non-negative');
    }

    if (typeof config.performance.asyncWrites !== 'boolean') {
      errors.push('performance.asyncWrites must be a boolean');
    }
  } else {
    errors.push('performance configuration is required');
  }

  // Validate customFormatter if provided
  if (config.customFormatter !== undefined && config.customFormatter !== null) {
    if (typeof config.customFormatter !== 'string') {
      errors.push('customFormatter must be a string (file path)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
