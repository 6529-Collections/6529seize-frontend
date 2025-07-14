---
allowed-tools: Read, Edit, Bash, Glob, Grep, Task
description: Generate specific, contextual solutions for React/Next.js development challenges with deep codebase analysis
---

# Generate Command

Analyzes codebase context to generate specific, actionable solutions for React/Next.js/TypeScript development challenges.

## Usage
```
/generate "improve tab navigation feedback in leaderboard"
/generate "add dark mode toggle" @components/header/Header.tsx
/generate "optimize performance in data table" @components/table/DataTable.tsx
/generate "fix accessibility issues in form validation"
/generate "implement real-time updates for chat messages"
```

## Contextual Analysis

### Repository Analysis
- **Project Structure**: !`find . -type d -name "components" -o -name "hooks" -o -name "pages" -o -name "app" | head -10`
- **Technology Stack**: !`grep -E '"(react|next|typescript|tailwind|framer-motion)"' package.json`
- **Current Branch**: !`git branch --show-current`
- **Recent Changes**: !`git log --oneline -3`

### Code Pattern Detection
- **Component Patterns**: !`find components/ -name "*.tsx" | xargs grep -l "export.*FC\|export default" | head -5`
- **Hook Usage**: !`find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "use[A-Z]" | head -5`
- **State Management**: !`find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "useState\|useContext\|useReducer" | head -3`

### UI/Styling Analysis
- **Style Approach**: !`find . -name "*.scss" -o -name "*.css" | head -3`
- **Animation Library**: !`grep -E '"(framer-motion|react-spring|lottie)"' package.json`
- **UI Components**: !`find components/ -name "*.tsx" | xargs grep -l "className.*tw-" | head -5`

## Prompt

You are a senior React/Next.js developer working on this specific codebase. 

**Challenge**: $ARGUMENTS

**Analysis Required:**
1. **Read referenced files** to understand current implementation
2. **Identify existing patterns** in the codebase for similar functionality
3. **Consider the tech stack** and current architecture
4. **Evaluate performance implications** of proposed solutions

**Provide Specific Solutions:**

### 🎯 Problem Analysis
- **Current State**: What exists now (be specific about files/components)
- **Core Issue**: The exact problem to solve
- **User Impact**: How this affects the user experience
- **Technical Constraints**: Limitations in current architecture

### 💡 Solution Options (3 specific approaches)

#### **Option A: [Specific Technical Approach]**
- **Implementation**: Exact components/files to modify
- **Code Changes**: Specific functions/hooks/components to create
- **Dependencies**: Any new packages or existing utilities to use
- **Pros**: Specific benefits for this codebase
- **Cons**: Specific drawbacks or limitations

#### **Option B: [Alternative Technical Approach]**
- **Implementation**: Different components/files to modify
- **Code Changes**: Alternative functions/hooks/components
- **Dependencies**: Different packages or utilities
- **Pros**: Different benefits for this codebase
- **Cons**: Different drawbacks or limitations

#### **Option C: [Third Technical Approach]**
- **Implementation**: Third set of components/files
- **Code Changes**: Third approach to functions/hooks/components
- **Dependencies**: Third set of packages or utilities
- **Pros**: Third set of benefits
- **Cons**: Third set of drawbacks

### 🚀 Recommended Implementation Plan

#### **Phase 1: Foundation**
- **File**: `path/to/specific/file.tsx`
- **Action**: Create/modify specific component with exact interface
- **Code**: Key function signatures and prop types
- **Test**: Specific test cases to verify

#### **Phase 2: Integration**
- **File**: `path/to/integration/file.tsx`
- **Action**: Connect to existing components with specific props
- **Code**: Exact integration points and data flow
- **Test**: Integration test scenarios

#### **Phase 3: Enhancement**
- **File**: `path/to/enhancement/file.tsx`
- **Action**: Add advanced features with specific implementations
- **Code**: Performance optimizations and edge cases
- **Test**: Edge case and performance testing

### 📝 Implementation Checklist

#### **Core Changes Required**
- [ ] Create/modify `ComponentName` in `specific/path/file.tsx`
- [ ] Add `hookName` custom hook in `hooks/useSpecificHook.ts`
- [ ] Update `ParentComponent` to integrate new functionality
- [ ] Add TypeScript interfaces for new props/state

#### **Testing Requirements**
- [ ] Unit tests for `ComponentName` component
- [ ] Integration tests for user interactions
- [ ] Performance tests for render optimization
- [ ] Accessibility tests for new UI elements

#### **Documentation Updates**
- [ ] Update component props documentation
- [ ] Add usage examples in relevant README
- [ ] Document new hook usage patterns
- [ ] Update API documentation if applicable

### 🔧 Code Examples

**Key Component Interface:**
```typescript
interface SpecificComponentProps {
  // Exact props based on codebase patterns
}
```

**Hook Signature:**
```typescript
function useSpecificHook(): {
  // Return type based on existing patterns
}
```

**Integration Pattern:**
```typescript
// How it fits into existing component hierarchy
```

### ⚡ Performance Considerations
- **Bundle Impact**: Estimated size increase/decrease
- **Runtime Performance**: Render frequency and optimization
- **Memory Usage**: State management and cleanup
- **Network Requests**: API calls and caching strategy

### 🎨 Design Considerations
- **Existing Design System**: How to match current UI patterns
- **Responsive Behavior**: Mobile and desktop considerations
- **Accessibility**: WCAG compliance and keyboard navigation
- **Animation Strategy**: Consistent with existing motion design

Focus on specific, actionable solutions that fit naturally into the existing codebase architecture and patterns.