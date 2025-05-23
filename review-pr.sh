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

## CRITICAL CONSTRAINTS
1. **ONLY review files that are actually modified in this PR** - do NOT suggest improvements for files not touched by this PR
2. **If providing improvement instructions, output MUST start with "Task:" on the first line** - NO headers, NO introductions, NO explanations before the first task
3. **Apply reasonable standards** - we want good code quality and test coverage, not perfection. Don't nitpick minor issues unless they pose real risk

## Review Framework

### 1. Initial Analysis & Scope Assessment
- What is the stated purpose of this PR?
- What files were modified and what types of changes were made?
- Is the scope appropriate for the described changes?
- Are there any files changed that seem unrelated to the main objective?
- **IMPORTANT: Only analyze files shown in the PR diff - do not suggest improvements for files not modified in this PR**

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

**Test Philosophy:**
- Goal is PRACTICAL test coverage, not perfection
- Focus on good coverage of happy paths and common failure scenarios
- Avoid nitpicking about obscure edge cases unless they represent real user risk
- 80% coverage of important flows is better than 100% coverage with brittle tests

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

**Reasonable Coverage Guidelines:**
- Core functionality MUST be tested
- Common error paths SHOULD be tested
- Obscure edge cases MAY be tested if high risk
- Don't demand tests for trivial getters/setters
- Focus on tests that provide real confidence in the code

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
(Just these three words, nothing else)

### Option B: Improvement Instructions
**OUTPUT REQUIREMENTS:**
- First line MUST start with "Task:" - NO text before it
- ONLY suggest improvements for files actually modified in this PR
- Do NOT suggest adding new files or modifying files outside the PR scope
- Do NOT write "Based on my review..." or ANY introductory text
- Do NOT write "Here are the improvements..." or ANY header text
- Do NOT write "Option B:" or ANY section labels

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

**FINAL REMINDERS:**
- Review ONLY the files shown as modified in the PR diff
- Do NOT suggest creating new test files unless tests were modified in this PR
- Do NOT suggest improvements for components/files not touched by this PR
- If you choose Option B, your VERY FIRST characters must be "Task:"
- NO preamble, NO introduction, NO "Based on my analysis" - start with Task immediately

PROMPT_END
