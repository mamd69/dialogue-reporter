# Publishing Guide

This document explains how to publish new versions of dialogue-reporter to npm.

## Setup (One-time)

### 1. Create npm Access Token

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type (for CI/CD)
4. Copy the token (starts with `npm_...`)

### 2. Add Token to GitHub Secrets

1. Go to your repository: https://github.com/mamd69/dialogue-reporter/settings/secrets/actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click "Add secret"

## Publishing Methods

### Method 1: Automatic (Recommended)

Push a version tag to trigger automatic publishing:

```bash
# Bump version (patch/minor/major)
npm version patch  # 1.1.0 → 1.1.1
# or: npm version minor  # 1.1.0 → 1.2.0
# or: npm version major  # 1.1.0 → 2.0.0

# Push with tags
git push --follow-tags
```

**What happens:**
1. ✓ GitHub Actions runs tests, lint, typecheck
2. ✓ Builds the package
3. ✓ Publishes to npm with provenance
4. ✓ Creates GitHub release automatically

### Method 2: Manual Workflow

Use GitHub UI for manual releases:

1. Go to https://github.com/mamd69/dialogue-reporter/actions/workflows/release-manual.yml
2. Click "Run workflow"
3. Select version bump type (patch/minor/major)
4. Click "Run workflow"

**What happens:**
1. ✓ Bumps version in package.json
2. ✓ Creates and pushes git tag
3. ✓ Runs tests and builds
4. ✓ Publishes to npm
5. ✓ Creates GitHub release

### Method 3: Manual (Local)

For complete manual control:

```bash
# 1. Update version
npm version patch

# 2. Run quality checks
npm test
npm run lint
npm run typecheck

# 3. Build
npm run build

# 4. Publish (requires npm login)
npm publish --access public

# 5. Push to GitHub
git push --follow-tags
```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **PATCH** (1.1.0 → 1.1.1): Bug fixes, no breaking changes
- **MINOR** (1.1.0 → 1.2.0): New features, backwards compatible
- **MAJOR** (1.1.0 → 2.0.0): Breaking changes

## Pre-release Versions

For beta/alpha releases:

```bash
# Create pre-release version
npm version prerelease --preid=beta  # 1.1.0 → 1.1.1-beta.0

# Publish with tag
npm publish --tag beta

# Users install with:
npm install dialogue-reporter@beta
```

## Troubleshooting

### "Permission denied" error

- Verify NPM_TOKEN secret is set correctly
- Ensure token has "Automation" permission
- Check package.json name matches npm package

### "Package already exists" error

- You're trying to publish the same version twice
- Bump version number first: `npm version patch`

### Tests/lint fail in CI

- Run locally first: `npm test && npm run lint`
- Fix issues before pushing tag
- Delete failed tag: `git tag -d v1.1.1 && git push origin :refs/tags/v1.1.1`

## Monitoring

After publishing:

- Check npm: https://www.npmjs.com/package/dialogue-reporter
- Check GitHub releases: https://github.com/mamd69/dialogue-reporter/releases
- Verify CI passed: https://github.com/mamd69/dialogue-reporter/actions

## Rollback

If you need to unpublish (within 72 hours):

```bash
# Unpublish specific version (not recommended)
npm unpublish dialogue-reporter@1.1.1

# Deprecate version (preferred)
npm deprecate dialogue-reporter@1.1.1 "Please use version 1.1.2 instead"
```

## Best Practices

1. ✓ Always update CHANGELOG.md before releasing
2. ✓ Run tests locally before tagging
3. ✓ Use descriptive commit messages
4. ✓ Tag versions in git (`v1.1.1` format)
5. ✓ Test pre-releases before stable release
6. ✓ Monitor npm download stats and issues
