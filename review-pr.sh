#!/bin/bash

# GitHub Pull Request Review Command
# Usage: ./review-pr.sh <github-pr-url>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <github-pr-url>"
    echo "Example: $0 https://github.com/owner/repo/pull/123/files"
    exit 1
fi

PR_URL="$1"

cat << PROMPT_END | claude -p
# Comprehensive GitHub Pull Request Review

**Task:** Review this pull request: $PR_URL

## Review Framework

### 1. Initial Analysis & Scope Assessment
- What is the stated purpose of this PR?
- What files were modified and what types of changes were made?
- Is the scope appropriate for the described changes?
- Are there any files changed that seem unrelated to the main objective?

**Red Flags:**
- Changes to files not mentioned in PR description
- Modifications to critical system files (config, security, auth)
- Large refactoring disguised as a small feature
- Dependencies added/removed without justification
- Build/deployment configuration changes

### 2. Side Effect & Unintended Change Analysis

**For each modified file, analyze:**
- Did this file need to be changed for the stated objective?
- Are the changes minimal and focused?
- Were existing APIs or interfaces modified unnecessarily?
- Are there changes that affect other parts of the system?

**Breaking Changes Detection:**
- Function signature modifications
- Public API changes
- Database schema alterations
- Configuration file changes
- Environment variable additions/removals
- Route modifications
- Component prop changes

### 3. Code Quality & Implementation Review

**Standards & Best Practices:**
- Consistency: Does code follow existing project patterns?
- Readability: Are variable names, functions, and comments clear?
- Architecture: Does the solution fit the existing system design?
- Performance: Are there obvious performance concerns?
- Security: Any potential vulnerabilities introduced?

**Logic & Implementation Analysis:**
- Edge case handling
- Input validation
- Error handling completeness
- Resource cleanup (memory leaks, event listeners)
- Async operation safety
- Race condition potential
- Null/undefined safety

### 4. Test Coverage & Quality Assessment

**Test Completeness - verify tests cover:**
- Happy path scenarios
- Edge cases and boundary conditions
- Error conditions and failure modes
- Integration points
- User interaction flows

**Missing Test Scenarios (Common Gaps):**
- Loading states and transitions
- Error message display
- Form validation feedback
- Network failure handling
- Concurrent user actions
- Performance under load
- Permission/authorization checks
- Data validation rules

### 5. Specific Review Patterns by Change Type

**New Features:**
- Feature completeness matches requirements
- All user scenarios are tested
- Error handling is comprehensive
- Performance impact is considered
- Security implications are addressed

**Bug Fixes:**
- Root cause is properly addressed (not just symptoms)
- Fix doesn't introduce new issues
- Regression test is added
- Similar issues elsewhere are considered
- Fix is minimal and targeted

**Refactoring:**
- Behavior is preserved exactly
- No new functionality is mixed in
- Test coverage is maintained or improved
- Performance characteristics are unchanged

### 6. Advanced Review Considerations

**Performance Impact:**
- Bundle size changes
- Runtime performance implications
- Database query efficiency
- API response times
- Memory usage patterns

**Security Review:**
- Input sanitization
- Authentication/authorization changes
- Data exposure risks
- XSS/CSRF vulnerabilities
- Dependency security updates

**Accessibility & UX:**
- Keyboard navigation
- Screen reader compatibility
- Color contrast requirements
- Mobile responsiveness
- Loading state management

---

## FINAL DECISION

Analyze the pull request thoroughly using all criteria above, then provide ONLY one of these two responses:

### Option A: Ready to merge

### Option B: Improvement Instructions
Format as direct instructions with NO introductory text, explanations, or context. Start immediately with the first task:

Task: [Specific improvement needed]
File: [Exact file path]
Reason: [Why this improvement is critical - the specific issue, risk, or benefit]
Action: [Detailed steps to implement]
Code: [Example implementation if needed]

Task: [Next specific improvement]
File: [Exact file path]
Reason: [Why this improvement is critical - the specific issue, risk, or benefit]
Action: [Detailed steps to implement]
Code: [Example implementation if needed]

**EXAMPLE FORMAT:**
Task: Add error handling for API response
File: src/api/userService.ts
Reason: Current code assumes API always returns valid JSON, but network errors or server issues could cause JSON.parse() to throw, crashing the application
Action: Wrap the JSON parsing in try-catch and return appropriate error response
Code: 
\`\`\`typescript
try {
  const data = await response.json();
  return { success: true, data };
} catch (error) {
  return { success: false, error: 'Invalid response format' };
}
\`\`\`

**CRITICAL FORMATTING RULES:**
- NO introductory sentences or explanations
- NO "Based on my review..." or "Here is my assessment..."
- NO "Option B:" headers or section labels
- Start directly with the first "Task:" line
- Make output ready for immediate copy-paste to another AI
- Each task MUST include a clear "Reason:" explaining the issue being addressed
- Reasons should specify: the problem, the risk/impact, and why it matters
- Be specific about consequences (e.g., "will crash", "exposes user data", "breaks on mobile")

PROMPT_END
