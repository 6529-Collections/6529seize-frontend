---
allowed-tools: Read, Glob, Grep, Task
description: Generate specific, contextual solutions and plans for React/Next.js development challenges with deep codebase analysis
---

# Generate Command

Analyzes codebase context to generate specific, actionable plans and solutions for React/Next.js/TypeScript development challenges without making code changes.

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

You are a senior React/Next.js developer analyzing this specific codebase. 

**Challenge**: $ARGUMENTS

**Analysis Required:**
1. **Read referenced files** to understand current implementation
2. **Identify existing patterns** in the codebase for similar functionality
3. **Consider the tech stack** and current architecture
4. **Evaluate performance implications** of proposed solutions

**Generate Comprehensive Plans (DO NOT IMPLEMENT):**

### 🎯 Problem Analysis
- **Current State**: What exists now (be specific about files/components)
- **Core Issue**: The exact problem to solve
- **User Impact**: How this affects the user experience

### 💡 Solution Options

#### **Option A: [Approach Name]**
- **Files**: Which files to modify
- **Changes**: What to change
- **Pros/Cons**: Key trade-offs

#### **Option B: [Alternative Approach]**
- **Files**: Which files to modify
- **Changes**: What to change
- **Pros/Cons**: Key trade-offs

### 🚀 Recommended Plan

#### **Step 1**: File to modify + what to change
#### **Step 2**: File to modify + what to change
#### **Step 3**: File to modify + what to change

### 📝 Key Changes
- [ ] Specific change 1
- [ ] Specific change 2
- [ ] Specific change 3

### 🔧 Code Example
```typescript
// Key code snippet showing the main change
```

Focus on specific, actionable plans that fit naturally into the existing codebase architecture and patterns. This command generates comprehensive implementation plans - use `/implement` to execute the actual code changes.