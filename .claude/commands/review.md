---
allowed-tools: Read, Edit, Bash, Glob, Grep, Task
description: Review code implementations for quality, requirements adherence, and integration with existing codebase
---

# Review Command

Performs focused code review of implementations against requirements, analyzing code quality, security, and integration with existing codebase patterns.

## Usage
```
/review "Plan to add dark mode toggle" "Created ThemeToggle component with localStorage persistence"
/review "Plan for user authentication flow" "Implemented JWT-based auth with refresh tokens"
/review "Plan to add vote animations" "Added useEffect animations in WaveLeaderboardGalleryItemVotes"
/review "Plan to optimize performance" "Added React.memo and useCallback optimizations"
```

## Review Context

### Current Implementation Status
- **Modified Files**: !`git status --porcelain`
- **Recent Changes**: !`git log --oneline -3`
- **Current Branch**: !`git branch --show-current`
- **Build Status**: !`npm run build 2>/dev/null || echo "Build check skipped"`

### Code Quality Assessment
- **TypeScript Errors**: !`npx tsc --noEmit 2>/dev/null || echo "TypeScript check skipped"`
- **Linting Status**: !`npm run lint 2>/dev/null || echo "Lint check skipped"`
- **Test Status**: !`npm test --passWithNoTests 2>/dev/null || echo "Test check skipped"`

### Implementation Analysis
- **Component Count**: !`find components/ -name "*.tsx" | wc -l`
- **Hook Usage**: !`find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "use[A-Z]" | wc -l`
- **Modified Components**: !`git diff --name-only | grep -E "\.(tsx|ts)$" | head -5`

## Prompt

You are a senior software engineer performing a code review. Compare the implementation against the original plan and evaluate quality, security, and integration.

**Original Plan**: $ARGUMENTS

**Review Focus Areas:**

### 🎯 Requirements Adherence
- **Functional Requirements**: Does the implementation meet all specified requirements?
- **Non-Functional Requirements**: Performance, accessibility, security considerations
- **Scope Alignment**: Is the implementation within the planned scope?
- **Missing Features**: Are there planned features not implemented?

### 💻 Code Quality Assessment

#### **Implementation Quality**
- **Code Structure**: Component hierarchy, separation of concerns
- **TypeScript Usage**: Type safety, interface design, strict mode compliance
- **React Best Practices**: Hook usage, state management, component lifecycle
- **Error Handling**: Edge cases, error boundaries, user feedback
- **Performance**: Unnecessary re-renders, memory leaks, optimization opportunities

#### **Integration Quality**
- **Existing Patterns**: Does it follow established codebase conventions?
- **Component Reuse**: Are existing components and hooks properly utilized?
- **API Consistency**: Does it match existing API patterns and data flow?
- **Styling Consistency**: Does it follow existing design system and CSS patterns?
- **File Organization**: Is code organized according to project structure?

### 🔒 Security & Robustness

#### **Security Considerations**
- **Input Validation**: Are user inputs properly validated and sanitized?
- **Authentication/Authorization**: Are security checks properly implemented?
- **Data Exposure**: Is sensitive data properly protected?
- **XSS Prevention**: Are dynamic content and user inputs safe?
- **Dependency Security**: Are new dependencies secure and necessary?

#### **Robustness**
- **Error Boundaries**: Are errors properly caught and handled?
- **Loading States**: Are loading and error states handled gracefully?
- **Edge Cases**: Are boundary conditions and edge cases considered?
- **Memory Management**: Are resources properly cleaned up?
- **Browser Compatibility**: Does it work across target browsers?

### 📊 Performance Impact

#### **Bundle Analysis**
- **Bundle Size**: Impact on overall bundle size
- **Code Splitting**: Is lazy loading used where appropriate?
- **Dependencies**: Are new dependencies justified and minimal?
- **Tree Shaking**: Are unused exports eliminated?

#### **Runtime Performance**
- **Render Performance**: Are components optimized for frequent updates?
- **Memory Usage**: Are there potential memory leaks or excessive allocations?
- **Network Requests**: Are API calls optimized and cached appropriately?
- **Animation Performance**: Are animations smooth and performant?

### ♿ Accessibility & UX

#### **Accessibility Compliance**
- **ARIA Labels**: Are interactive elements properly labeled?
- **Keyboard Navigation**: Can users navigate without a mouse?
- **Screen Reader Support**: Are content changes announced properly?
- **Color Contrast**: Do colors meet accessibility standards?
- **Focus Management**: Is focus properly managed during interactions?

#### **User Experience**
- **Responsive Design**: Does it work well on different screen sizes?
- **Loading States**: Are users informed during async operations?
- **Error Messages**: Are error messages helpful and user-friendly?
- **Intuitive Interface**: Is the interface easy to understand and use?

### 🧪 Testing & Documentation

#### **Test Coverage**
- **Unit Tests**: Are components and functions adequately tested?
- **Integration Tests**: Are component interactions tested?
- **Edge Cases**: Are error conditions and boundary cases tested?
- **Accessibility Tests**: Are accessibility features tested?

#### **Documentation Quality**
- **Code Comments**: Are complex implementations documented?
- **Props Documentation**: Are component interfaces documented?
- **Usage Examples**: Are there examples of how to use new features?
- **API Documentation**: Are new APIs properly documented?

## Review Output Format

### 📋 Review Summary

**Overall Assessment**: ✅ Excellent / ⚠️ Good with Issues / ❌ Needs Significant Work

**Key Findings**:
- **Strengths**: What was implemented well
- **Issues**: Problems that need attention
- **Recommendations**: Specific improvements to make

### 🎯 Requirements Review

#### **Implemented Requirements**
- ✅ **Requirement 1**: Fully implemented as planned
- ✅ **Requirement 2**: Implemented with minor deviations
- ⚠️ **Requirement 3**: Partially implemented, missing X feature
- ❌ **Requirement 4**: Not implemented

#### **Scope Analysis**
- **Within Scope**: Features that match the original plan
- **Scope Creep**: Additional features beyond the plan
- **Missing Features**: Planned features not implemented
- **Justified Changes**: Deviations with clear technical reasons

### 💻 Technical Review

#### **Code Quality** (Score: X/10)
**Strengths**:
- Specific examples of good implementation
- Proper use of TypeScript and React patterns
- Good integration with existing codebase

**Issues**:
- Specific code issues with file:line references
- Performance concerns with specific components
- Missing error handling or edge cases

**Recommendations**:
- [ ] Fix TypeScript errors in ComponentName.tsx:25
- [ ] Add error boundary for AsyncComponent
- [ ] Optimize re-renders in ExpensiveComponent using React.memo

#### **Integration Quality** (Score: X/10)
**Strengths**:
- Follows existing patterns in similar components
- Proper use of existing hooks and utilities
- Consistent styling and naming conventions

**Issues**:
- Inconsistent with existing patterns in specific areas
- Missing integration with existing error handling
- Not using established utilities for common operations

#### **Security Assessment** (Score: X/10)
**Strengths**:
- Proper input validation and sanitization
- Secure handling of sensitive data
- No obvious security vulnerabilities

**Issues**:
- Missing input validation in specific components
- Potential XSS vulnerability in dynamic content
- Authentication checks not implemented

### 🚀 Performance Review

#### **Bundle Impact**
- **Size Impact**: +X KB (acceptable/concerning)
- **Dependencies**: X new dependencies added
- **Code Splitting**: Properly implemented / Missing opportunities

#### **Runtime Performance**
- **Render Performance**: Optimized / Needs improvement
- **Memory Usage**: Efficient / Potential leaks detected
- **Network Requests**: Optimized / Missing caching

### 🔧 Specific Issues Found

#### **Critical Issues** (Must Fix)
1. **Security Issue**: Description with file:line reference
2. **Performance Issue**: Description with specific component
3. **Accessibility Issue**: Description with WCAG guideline

#### **Major Issues** (Should Fix)
1. **Code Quality**: Description with specific improvement
2. **Integration**: Description with existing pattern to follow
3. **Error Handling**: Description with missing edge case

#### **Minor Issues** (Could Fix)
1. **Documentation**: Missing comments in complex function
2. **Optimization**: Potential micro-optimization opportunity
3. **Consistency**: Minor naming or styling inconsistency

### 📝 Action Items

#### **Immediate Actions** (Before Merge)
- [ ] Fix critical security issue in Component.tsx
- [ ] Add missing error handling for async operations
- [ ] Resolve TypeScript errors

#### **Short-term Improvements** (Next Sprint)
- [ ] Add unit tests for new components
- [ ] Improve accessibility with ARIA labels
- [ ] Optimize performance in identified components

#### **Long-term Considerations** (Future)
- [ ] Consider architectural improvements for scalability
- [ ] Add comprehensive documentation
- [ ] Implement monitoring for new features

### 🎯 Final Recommendation

**Merge Status**: ✅ Ready to Merge / ⚠️ Merge with Conditions / ❌ Do Not Merge

**Rationale**: Specific reasoning for the recommendation based on the review findings.

**Next Steps**: Clear actions needed before or after merge.

Focus on actionable feedback with specific file references and concrete improvement suggestions.