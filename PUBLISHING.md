# Publishing Dialogue Reporter to npm

## First-Time Setup (One-Time)

### 1. Create npm Account (if you don't have one)
Go to https://www.npmjs.com/signup and create an account.

### 2. Login to npm from Terminal
```bash
npm login
```
You'll be prompted for:
- **Username**: Your npm username
- **Password**: Your npm password
- **Email**: Your npm email
- **One-time password**: 2FA code (if enabled)

### 3. Verify Login
```bash
npm whoami
```
Should display your npm username.

---

## Publishing Process

### Step 1: Pre-Publish Checklist

**Verify everything is ready:**
```bash
# Check package.json is correct
cat package.json | grep -E "name|version|repository"

# Ensure clean working directory
git status

# Run tests (optional but recommended)
npm test

# Build TypeScript
npm run build

# Verify dist/ folder was created
ls -la dist/
```

### Step 2: Test Package Locally (Optional but Recommended)

**Create a test tarball:**
```bash
npm pack
```

This creates a file like `dialogue-reporter-1.0.0.tgz`

**Test install locally:**
```bash
# In a different directory
cd /tmp
npm install /workspaces/dialogue-reporter/dialogue-reporter-1.0.0.tgz
npx dialogue-reporter --version
```

Clean up:
```bash
rm /workspaces/dialogue-reporter/dialogue-reporter-1.0.0.tgz
```

### Step 3: Publish to npm

**Publish the package:**
```bash
npm publish
```

**What happens:**
1. `prepublishOnly` script runs automatically (builds TypeScript)
2. Package is uploaded to npm registry
3. You'll see: `+ dialogue-reporter@1.0.0`

**Verify it's published:**
```bash
npm view dialogue-reporter
```

---

## How Users Install It

Once published, anyone can install using either method:

### Method 1: Global Install (Recommended)
```bash
npm install -g dialogue-reporter
```

### Method 2: npx (No Install Required)
```bash
npx dialogue-reporter install
```

The `npx` command automatically downloads and runs the latest version without permanently installing it.

---

## Setting Up in Claude Code

After publishing, users can set it up with these simple steps:

### Quick Setup (3 commands)
```bash
# 1. Install globally
npm install -g dialogue-reporter

# 2. Add to Claude Code MCP servers
dialogue-reporter install

# 3. Restart Claude Code
# (Conversations will now be logged automatically!)
```

### Manual MCP Setup (Alternative)

Add to `.mcp.json` or `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dialogue-reporter": {
      "command": "dialogue-reporter",
      "args": ["serve"],
      "type": "stdio"
    }
  }
}
```

Then restart Claude Code.

---

## Updating Your Package

When you make changes and want to publish a new version:

### Step 1: Update Version Number
```bash
# Patch version (1.0.0 → 1.0.1) - for bug fixes
npm version patch

# Minor version (1.0.0 → 1.1.0) - for new features
npm version minor

# Major version (1.0.0 → 2.0.0) - for breaking changes
npm version major
```

This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag

### Step 2: Push to GitHub
```bash
git push && git push --tags
```

### Step 3: Publish Update
```bash
npm publish
```

---

## Troubleshooting

### "Package name already taken"
If someone already published `dialogue-reporter`, you have options:

**Option A: Use scoped package**
```bash
# Update package.json name to:
"name": "@mamd69/dialogue-reporter"

# Publish as scoped package:
npm publish --access public
```

Users would then install with:
```bash
npm install -g @mamd69/dialogue-reporter
# or
npx @mamd69/dialogue-reporter install
```

**Option B: Choose different name**
- `claude-conversation-logger`
- `claude-code-reporter`
- `conversation-md-logger`

### "Need to authenticate"
```bash
npm login
```

### "Build failed"
```bash
npm run clean
npm run build
```

### "Tests failed"
You can skip tests and publish anyway:
```bash
npm publish --no-test
```

---

## Making it Easier for Users

### Add to README.md
```markdown
## Installation

Install globally via npm:
\`\`\`bash
npm install -g dialogue-reporter
dialogue-reporter install
\`\`\`

Or run directly with npx (no install):
\`\`\`bash
npx dialogue-reporter install
\`\`\`
```

### Create Installation Video/GIF
Show the 3-step process:
1. `npm install -g dialogue-reporter`
2. `dialogue-reporter install`
3. Restart Claude Code
4. See conversation logs appear in `docs/claude-conversations/`

---

## Summary: Quick Publishing Commands

```bash
# One-time setup
npm login

# Every time you publish/update
npm run build           # Build TypeScript
npm version patch       # Bump version (1.0.0 → 1.0.1)
git push --tags         # Push to GitHub
npm publish             # Publish to npm

# Done! Users can now:
npm install -g dialogue-reporter
# or
npx dialogue-reporter install
```

---

## Current Package Status

- **Name**: `dialogue-reporter`
- **Version**: `1.0.0`
- **Repository**: https://github.com/mamd69/dialogue-reporter
- **License**: MIT
- **Node**: >=18.0.0

**Next Steps:**
1. Run `npm login` (one-time)
2. Run `npm publish`
3. Share with users!
