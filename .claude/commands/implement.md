---
allowed-tools: Read, Edit, Bash, Glob, Grep, Task, Write, MultiEdit
description: Implement specific features by making targeted code changes with deep codebase understanding
---

# Implementation Command

Analyzes existing code patterns and implements features by making precise, contextual code changes that follow established conventions.

## Usage
```
/implement "add responsive navigation menu with mobile hamburger"
/implement "add dark mode toggle" @components/header/Header.tsx
/implement "fix bug in user authentication" @components/auth/Auth.tsx
/implement "optimize performance in data table" @components/table/DataTable.tsx
/implement "add vote count animations for leaderboard tabs"
```

## Implementation Analysis

### Codebase Understanding
- **Current Files**: !`git status --porcelain`
- **Target Components**: !`find components/ -name "*.tsx" | grep -i "$ARGUMENTS" | head -5`
- **Related Hooks**: !`find hooks/ -name "*.ts" | grep -i "$ARGUMENTS" | head -5`
- **Similar Patterns**: !`find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "useState\|useEffect" | head -3`

### Technology Stack Detection
- **React Version**: !`grep '"react"' package.json`
- **TypeScript**: !`ls tsconfig*.json`
- **Styling**: !`find . -name "*.scss" -o -name "*.css" | head -3`
- **Animation Library**: !`grep -E '"(framer-motion|react-spring)"' package.json`

### Code Quality Standards
- **Linting**: !`ls .eslintrc* prettier.config* 2>/dev/null || echo "No linting config found"`
- **Testing**: !`find . -name "*.test.tsx" -o -name "*.spec.tsx" | head -3`
- **Type Safety**: !`grep -E '"strict|noImplicitAny"' tsconfig.json`

## Prompt

You are a senior software engineer working on this specific React/Next.js codebase. 

**Implementation Task**: $ARGUMENTS

**Implementation Process:**

### Step 1: Analyze Current Implementation
1. **Read referenced files** to understand existing patterns
2. **Identify component hierarchy** and data flow
3. **Understand existing conventions** for similar functionality
4. **Check for existing utilities** and hooks to reuse

### Step 2: Plan Minimal Changes
1. **Identify exact files** to modify or create
2. **Determine integration points** with existing components
3. **Plan TypeScript interfaces** and prop types
4. **Consider performance implications** of changes

### Step 3: Implement Changes
1. **Make targeted edits** using Edit/MultiEdit tools
2. **Follow existing code patterns** exactly
3. **Maintain consistent naming** and structure
4. **Preserve existing functionality** while adding new features

### Step 4: Verify Implementation
1. **Check TypeScript compilation** if possible
2. **Verify file changes** are minimal and focused
3. **Ensure integration** with existing components
4. **Document any breaking changes** or new requirements

## Implementation Requirements

### Code Changes Must:
- **Follow existing patterns** in the codebase
- **Use established conventions** for naming and structure
- **Maintain TypeScript strictness** with proper typing
- **Preserve existing functionality** while adding new features
- **Be minimal and focused** - only change what's necessary
- **Integrate seamlessly** with existing components

### Implementation Strategy:
1. **Read target files** first to understand current implementation
2. **Identify exact integration points** for new functionality
3. **Make incremental changes** that build on existing code
4. **Test integration** with existing components
5. **Document changes** and usage patterns

### File Modification Approach:
- **Edit existing files** when adding to existing functionality
- **Create new files** only when adding completely new components
- **Use MultiEdit** for coordinated changes across related files
- **Maintain file organization** and directory structure

## Expected Output Format

### Implementation Summary
```
Files Modified:
- components/path/Component.tsx (added new prop, updated interface)
- hooks/useHook.ts (added new functionality)
- components/path/Parent.tsx (integrated new component)

Files Created:
- components/path/NewComponent.tsx (new feature component)
- types/NewTypes.ts (TypeScript interfaces)
```

### Code Changes Made
For each file, show:
1. **What was changed** and why
2. **How it integrates** with existing code
3. **New interfaces** or types added
4. **Props or hooks** added/modified

### Integration Points
- **Parent components** that use the new functionality
- **Props passed down** and their types
- **State management** and data flow
- **Event handlers** and callbacks

### Testing Recommendations
- **Manual testing** steps to verify functionality
- **Unit tests** that should be added
- **Integration scenarios** to test
- **Edge cases** to consider

### Usage Examples
```typescript
// How to use the new functionality
<Component newProp={value} />

// Hook usage
const { newFeature } = useHook();
```

Focus on making precise, minimal changes that solve the specific problem while maintaining code quality and existing patterns.