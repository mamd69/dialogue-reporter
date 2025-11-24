# Changelog

All notable changes to dialogue-reporter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2025-11-24

### Fixed
- **CRITICAL FIX**: Install command now properly updates `.claude/settings.json` to register hooks
  - Previously hooks were copied but not activated in settings
  - Users had to manually edit settings.json for hooks to work
  - Now works immediately after installation with no manual configuration
- Improved hook detection to avoid duplicates in settings.json
- Added automatic backup of existing settings.json if invalid JSON detected

### Changed
- Install command now outputs confirmation when settings.json is updated
- Better error handling for settings.json modifications

## [1.1.1] - 2025-11-24

### Fixed
- Skip postinstall script in CI environments to prevent error messages during CI builds
- Postinstall welcome message still displays for real user installations

## [1.1.0] - 2025-11-24

### Added
- **Concurrent Session Support** - Multiple Claude Code sessions can now run simultaneously without interference
  - Each session uses its own temp directory: `/tmp/dialogue-reporter/{session-id}/`
  - Session ID is automatically extracted from transcript path
  - Independent tracking for conversation files and line positions
  - No race conditions or cross-session interference
- Added `SessionStart.sh` hook to CLI installation
- Added comprehensive test suite for concurrent session support
- **GitHub Actions Automation** - Automated npm publishing workflow
  - Automatic publishing on version tags (v*.*.*)
  - Manual release workflow via GitHub UI
  - Continuous integration testing on Node 18, 20, 22
  - Publishing guide in docs/PUBLISHING.md

### Changed
- **BREAKING**: Temp file location changed from `/tmp/dialogue-reporter/` to `/tmp/dialogue-reporter/{session-id}/`
- Updated all hooks to use session-specific directories:
  - `SessionStart.sh` - Creates session-specific temp directory
  - `Stop.sh` - Extracts session ID and uses session-specific storage
  - `UserPromptSubmit.sh` - Extracts session ID and uses session-specific storage
- Updated documentation with concurrent session examples and architecture details

### Fixed
- Race conditions when running multiple Claude Code sessions in the same project
- Session isolation ensures each conversation is captured correctly

## [1.0.5] - 2025-11-12

### Fixed
- Improved metadata recovery when temp files are cleared
- Fixed duplicate content issues in conversation capture

## [1.0.0] - 2025-11-11

### Added
- Initial release
- Automatic conversation capture via Claude Code hooks
- Configurable tool display modes (detailed, simple, hidden)
- Timezone configuration
- Persistent metadata in conversation files
- Debug logging
- CLI commands: install, uninstall, status, config, logs
