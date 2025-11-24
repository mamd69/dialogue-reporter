# Concurrent Session Support

## Overview

As of version 1.1.0, dialogue-reporter fully supports running multiple Claude Code sessions simultaneously without any interference or race conditions.

## Implementation Details

### Session Isolation

Each Claude Code session now uses its own isolated temp directory:

```bash
# Old (v1.0.x) - Shared directory caused race conditions
/tmp/dialogue-reporter/
  ├── current-file.txt
  ├── last-line-processed.txt
  └── session-id.txt

# New (v1.1.0+) - Session-specific directories
/tmp/dialogue-reporter/{session-id}/
  ├── current-file.txt
  ├── last-line-processed.txt
  ├── session-id.txt
  └── transcript-path.txt
```

### Session ID Extraction

The session ID is automatically extracted from the Claude Code transcript path:

```bash
# Transcript path format
/path/to/.claude/projects/my-project/{session-id}.jsonl

# Example
/home/user/.claude/projects/dialogue-reporter/3df5ae42-ae15-48a3-a0d3-86924a76733d.jsonl
                                             ↑
                                    Session ID: 3df5ae42-ae15-48a3-a0d3-86924a76733d
```

### Hook Changes

#### SessionStart.sh
- Creates session-specific directory: `/tmp/dialogue-reporter/$SESSION_ID/`
- Stores metadata in session-specific location
- Initializes session-specific tracking files

#### Stop.sh
- Extracts session ID from transcript path
- Reads from session-specific temp directory
- Updates session-specific line tracking
- Falls back to metadata recovery if temp files are missing

#### UserPromptSubmit.sh
- Extracts session ID from transcript path
- Uses session-specific temp directory
- Recovery logic uses session-specific paths

## Benefits

### ✅ No Race Conditions
Each session has its own storage, eliminating the race condition where multiple sessions would overwrite shared temp files.

### ✅ Independent Tracking
Each session independently tracks:
- Current conversation file
- Last processed line number
- Session metadata
- Transcript path

### ✅ Separate Output Files
Each session creates its own conversation file:
```bash
docs/claude-conversations/
  ├── claude-convo-2025-11-24-1.md  # Session 1
  ├── claude-convo-2025-11-24-2.md  # Session 2
  └── claude-convo-2025-11-24-3.md  # Session 3
```

### ✅ Backward Compatible
The recovery logic ensures that if temp files are missing, the hooks can still recover the session state from conversation file metadata.

## Usage Example

### Terminal 1
```bash
cd my-project
claude
# Conversation captured to claude-convo-2025-11-24-1.md
```

### Terminal 2 (Same Project)
```bash
cd my-project
claude
# Conversation captured to claude-convo-2025-11-24-2.md
```

Both sessions run independently with zero interference!

## Testing

Run the concurrent session test suite:

```bash
./tests/test-concurrent-sessions.sh
```

This verifies:
- Session-specific directory creation
- Session ID extraction from transcript paths
- Independent line tracking per session

## Migration from v1.0.x

**No action required!** The update is backward compatible:

1. Update dialogue-reporter: `npm install -g dialogue-reporter@latest`
2. Reinstall hooks: `dialogue-reporter install --force`
3. Start using concurrent sessions immediately

Old temp files in `/tmp/dialogue-reporter/` will be ignored, and new sessions will use session-specific directories.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code Session 1                     │
│                  (Session ID: abc-123)                       │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ├─ Transcript: /path/abc-123.jsonl
                    ├─ Temp Dir: /tmp/dialogue-reporter/abc-123/
                    └─ Output: claude-convo-2025-11-24-1.md

┌─────────────────────────────────────────────────────────────┐
│                    Claude Code Session 2                     │
│                  (Session ID: xyz-789)                       │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ├─ Transcript: /path/xyz-789.jsonl
                    ├─ Temp Dir: /tmp/dialogue-reporter/xyz-789/
                    └─ Output: claude-convo-2025-11-24-2.md
```

## Technical Details

### Session ID Format
Claude Code generates session IDs as UUIDs (e.g., `3df5ae42-ae15-48a3-a0d3-86924a76733d`)

### Temp Directory Structure
```bash
/tmp/dialogue-reporter/{session-id}/
  ├── current-file.txt          # Path to active .md file
  ├── last-line-processed.txt   # Last line read from transcript
  ├── session-id.txt            # Session identifier
  └── transcript-path.txt       # Path to .jsonl transcript
```

### Recovery Mechanism
If session-specific temp files are missing (e.g., after system reboot):
1. Hook extracts session ID from transcript path
2. Hook finds most recent conversation file
3. Hook reads `<!-- LAST_LINE: N -->` metadata from file
4. Hook creates session-specific temp directory
5. Hook resumes from correct position

## Known Limitations

None! Concurrent sessions work exactly like single sessions, just independently.

## Future Enhancements

Potential improvements for future versions:
- Session cleanup on Claude Code exit
- Session metadata in conversation file headers
- Cross-session analytics and reporting
- Configurable temp directory location

## Support

If you encounter any issues with concurrent sessions:

1. Check logs: `dialogue-reporter logs`
2. Verify installation: `dialogue-reporter status`
3. Report issues: https://github.com/mamd69/dialogue-reporter/issues

## Related

- **Issue**: [#1 - Add support for concurrent Claude Code sessions](https://github.com/mamd69/dialogue-reporter/issues/1)
- **Version**: 1.1.0+
- **Date**: November 24, 2025
