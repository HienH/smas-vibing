# Git Workflow for SMAS
## Feature Branch Development with Manual Integration Testing

**Document Purpose:** Defines the Git workflow for the SMAS project, ensuring code quality through feature branches and manual integration testing before merging to main.

**Last Updated:** June 28, 2025

---

## 🎯 Workflow Overview

### Core Principles
- **Feature Branches:** Every new feature/change uses a separate branch
- **Manual Integration:** All changes are manually tested before merging to main
- **Code Review:** Pull requests require review and approval
- **Clean History:** Maintain clean, linear commit history
- **Quality Assurance:** Integration testing ensures everything works together

---

## 🌿 Branch Strategy

### Main Branch (`main`)
- **Purpose:** Production-ready code only
- **Protection:** Direct pushes disabled, requires pull request
- **Integration:** All features must pass manual integration testing
- **Deployment:** Automatically deploys to production

### Feature Branches (`feature/feature-name`)
- **Purpose:** Development of new features or changes
- **Naming:** `feature/descriptive-feature-name`
- **Lifecycle:** Created from main, merged back via pull request
- **Testing:** Individual feature testing + integration testing

### Hotfix Branches (`hotfix/issue-description`)
- **Purpose:** Critical bug fixes for production
- **Naming:** `hotfix/issue-description`
- **Lifecycle:** Created from main, merged back to main and develop
- **Priority:** High priority, minimal scope

---

## 🔄 Development Workflow

### 1. Starting a New Feature

```bash
# Ensure you're on main and it's up to date
git checkout main
git pull origin main

# Create and switch to new feature branch
git checkout -b feature/your-feature-name

# Verify you're on the new branch
git branch
```

### 2. Development Process

```bash
# Make your changes
# ... edit files ...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add user authentication component

- Add login button component
- Implement Spotify OAuth integration
- Add user menu dropdown
- Include proper error handling"

# Push feature branch to remote
git push origin feature/your-feature-name
```

### 3. Commit Message Convention

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): implement Spotify OAuth login"
git commit -m "fix(playlist): resolve duplicate song addition issue"
git commit -m "docs(readme): update installation instructions"
```

---

## 🧪 Integration Testing Process

### Pre-Integration Checklist

Before creating a pull request, ensure:

- [ ] **Code Quality**
  - [ ] All files under 500 lines
  - [ ] Proper `@fileoverview` comments
  - [ ] JSDoc/TSDoc documentation
  - [ ] Descriptive variable names with auxiliary verbs
  - [ ] TypeScript strict mode compliance

- [ ] **Testing**
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Manual testing completed
  - [ ] Edge cases handled

- [ ] **Code Review**
  - [ ] Self-review completed
  - [ ] Code follows project conventions
  - [ ] No console.log statements
  - [ ] Proper error handling

### Manual Integration Testing

1. **Local Testing**
   ```bash
   # Switch to main branch
   git checkout main
   git pull origin main
   
   # Merge feature branch locally
   git merge feature/your-feature-name
   
   # Install dependencies (if needed)
   npm install
   
   # Run tests
   npm run test
   npm run test:integration
   
   # Start development server
   npm run dev
   ```

2. **Integration Test Scenarios**
   - [ ] **Authentication Flow**
     - [ ] Spotify OAuth login works
     - [ ] Session management functions
     - [ ] Logout process works
   
   - [ ] **Playlist Management**
     - [ ] Playlist creation works
     - [ ] Song addition/removal functions
     - [ ] Duplicate prevention works
   
   - [ ] **Sharing System**
     - [ ] Link generation works
     - [ ] Friend contribution flow works
     - [ ] Rate limiting functions
   
   - [ ] **UI/UX**
     - [ ] Responsive design works
     - [ ] Accessibility compliance
     - [ ] Loading states display correctly
     - [ ] Error states handle gracefully

3. **Performance Testing**
   - [ ] Page load times acceptable
   - [ ] No memory leaks
   - [ ] Bundle size within limits
   - [ ] Core Web Vitals in green

4. **Cross-Browser Testing**
   - [ ] Chrome (latest)
   - [ ] Firefox (latest)
   - [ ] Safari (latest)
   - [ ] Mobile browsers

### Integration Test Results

If integration testing passes:
```bash
# Reset to main (clean state)
git checkout main
git reset --hard origin/main

# Create pull request
# ... create PR on GitHub/GitLab ...
```

If integration testing fails:
```bash
# Reset to main
git checkout main
git reset --hard origin/main

# Fix issues in feature branch
git checkout feature/your-feature-name
# ... fix issues ...
git add .
git commit -m "fix: resolve integration test failures"
git push origin feature/your-feature-name

# Repeat integration testing
```

---

## 🔀 Pull Request Process

### Creating a Pull Request

1. **Title Format:** `feat: brief description of the feature`
2. **Description Template:**
   ```markdown
   ## Description
   Brief description of what this PR accomplishes.

   ## Changes Made
   - [ ] Change 1
   - [ ] Change 2
   - [ ] Change 3

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed
   - [ ] Cross-browser testing completed

   ## Integration Testing
   - [ ] Local integration testing completed
   - [ ] All test scenarios pass
   - [ ] Performance testing completed
   - [ ] No breaking changes detected

   ## Screenshots (if applicable)
   [Add screenshots of UI changes]

   ## Checklist
   - [ ] Code follows project conventions
   - [ ] Documentation updated
   - [ ] No console.log statements
   - [ ] Proper error handling
   - [ ] Accessibility compliance
   ```

### Review Process

1. **Self-Review**
   - [ ] Code follows project rules
   - [ ] All tests pass
   - [ ] Documentation updated
   - [ ] No sensitive data exposed

2. **Peer Review**
   - [ ] Code review completed
   - [ ] Integration testing verified
   - [ ] Approval received

3. **Final Integration Test**
   - [ ] Manual integration testing by reviewer
   - [ ] All scenarios tested
   - [ ] Performance verified

---

## 🛡️ Branch Protection Rules

### Main Branch Protection

Configure these rules in your Git hosting platform:

- **Require pull request reviews before merging**
  - Required approving reviews: 1
  - Dismiss stale PR approvals when new commits are pushed
  - Require review from code owners

- **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - Status checks: `test`, `lint`, `build`

- **Restrict pushes that create files larger than 100 MB**
- **Require linear history**
- **Include administrators in these restrictions**

### Feature Branch Guidelines

- **Naming Convention:** `feature/descriptive-name`
- **Maximum Lifetime:** 2 weeks (prevent stale branches)
- **Regular Updates:** Rebase on main weekly
- **Scope:** One feature per branch

---

## 🚨 Emergency Procedures

### Hotfix Process

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Make minimal changes
# ... fix the issue ...

# Commit with urgency
git commit -m "fix: critical bug in authentication flow

URGENT: Fixes authentication failure for users
- Resolve token refresh issue
- Add fallback authentication method"

# Push and create urgent PR
git push origin hotfix/critical-bug-fix
```

### Rollback Process

If issues are discovered after merge:

```bash
# Create rollback branch
git checkout main
git checkout -b hotfix/rollback-feature-x

# Revert the problematic commit
git revert <commit-hash>

# Test the rollback
npm run test
npm run dev

# Create PR for rollback
git push origin hotfix/rollback-feature-x
```

---

## 📊 Quality Metrics

### Commit Quality
- **Commit Size:** Small, focused commits
- **Message Quality:** Clear, descriptive messages
- **Frequency:** Regular commits (not large dumps)

### Code Quality
- **File Size:** All files under 500 lines
- **Documentation:** 100% JSDoc coverage
- **Type Safety:** 100% TypeScript coverage
- **Test Coverage:** Minimum 80%

### Process Quality
- **Integration Test Success Rate:** >95%
- **Average PR Review Time:** <24 hours
- **Feature Branch Lifetime:** <2 weeks
- **Rollback Frequency:** <5% of releases

---

## 🔧 Git Configuration

### Recommended Git Config

```bash
# Set up your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up default branch name
git config --global init.defaultBranch main

# Set up pull strategy
git config --global pull.rebase true

# Set up commit template
git config --global commit.template ~/.gitmessage
```

### Commit Template

Create `~/.gitmessage`:
```
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>
```

---

This workflow ensures code quality, proper testing, and smooth collaboration while maintaining the ability to manually verify integration before any changes reach the main branch. 