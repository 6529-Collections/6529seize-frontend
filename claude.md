# Claude Code Project Configuration

This document contains project-specific instructions and guidelines for Claude Code interactions.

---

## 🚀 Project Overview

This is a Next.js frontend application for the 6529 ecosystem, featuring:
- React/TypeScript codebase
- SCSS styling with Bootstrap
- Complex state management
- NFT and blockchain integrations
- Real-time features with WebSocket

---

## 🔧 Development Guidelines

### Code Standards
- Follow existing TypeScript patterns and conventions
- Use SCSS modules for styling
- Maintain consistent naming conventions
- Prefer editing existing files over creating new ones

### Testing
- Run tests with appropriate framework commands
- Always check linting and type checking before committing
- Ensure all tests pass before submitting changes

### Slash Commands
Custom slash commands are available in `.claude/commands/` directory:
- `/brainstorm` - Generate creative ideas and explore approaches
- `/plan` - Create high-level implementation plans
- `/implement` - Provide detailed step-by-step instructions  
- `/review` - Audit implementations against original plans

---

## 📁 Project Structure

- `components/` - React components organized by feature
- `pages/` - Next.js pages and API routes
- `hooks/` - Custom React hooks
- `services/` - API and external service integrations
- `store/` - State management
- `styles/` - SCSS stylesheets
- `types/` - TypeScript type definitions

---

## 🔄 Workflow Recommendations

1. **Research Phase**: Use search tools to understand existing code
2. **Planning Phase**: Use `/brainstorm` and `/plan` for complex tasks
3. **Implementation Phase**: Use `/implement` for detailed execution
4. **Review Phase**: Use `/review` to validate against requirements
5. **Quality Assurance**: Run linting, type checking, and tests

---

## 📋 Best Practices

### Code Quality
- Always read existing code before making changes
- Follow established patterns and conventions in the codebase
- Use TypeScript strictly - avoid `any` types
- Write self-documenting code with clear variable names
- Keep components small and focused on single responsibilities

### File Organization
- Place files in appropriate directories based on functionality
- Use consistent naming: PascalCase for components, camelCase for functions
- Group related files together (component + styles + tests)
- Avoid creating unnecessary new files - extend existing ones when possible

### State Management
- Use React hooks appropriately (useState, useEffect, custom hooks)
- Keep state as close to where it's used as possible
- Use the existing store pattern for global state
- Avoid prop drilling - use context or state management

### Performance
- Use React.memo for expensive components
- Implement proper loading states and error handling
- Optimize images and media assets
- Use lazy loading for large components

### Security
- Never commit sensitive data (API keys, tokens, passwords)
- Validate all user inputs
- Use proper authentication and authorization patterns
- Follow OWASP guidelines for web security

### Testing
- Write tests for new functionality
- Update existing tests when modifying code
- Use meaningful test descriptions
- Test both happy path and error scenarios

### Documentation
- Update comments when changing complex logic
- Document non-obvious business logic
- Keep README files current
- Use JSDoc for complex functions

---

## 💡 Common Development Tasks

Use these descriptions with your slash commands for typical development scenarios:

### Frontend Features
- "add responsive navigation menu with mobile hamburger"
- "implement dark mode toggle with system preference detection"
- "create user authentication flow with email/password and social login"
- "add file upload component with drag-and-drop and progress bar"
- "implement infinite scroll for large data lists"
- "create modal dialog system with keyboard navigation"
- "add search functionality with autocomplete and filtering"
- "implement real-time notifications system"
- "create responsive data table with sorting and pagination"
- "add form validation with real-time feedback"

### Performance & Optimization
- "optimize bundle size and implement code splitting"
- "add lazy loading for images and components"
- "implement caching strategy for API calls"
- "optimize React rendering with memoization"
- "add service worker for offline functionality"
- "implement virtual scrolling for large lists"
- "optimize CSS and reduce unused styles"
- "add progressive web app features"

### API & Data Management
- "implement RESTful API integration with error handling"
- "add GraphQL client with caching and mutations"
- "create data fetching hooks with loading states"
- "implement optimistic updates for better UX"
- "add offline-first data synchronization"
- "create type-safe API client with TypeScript"
- "implement rate limiting and request queuing"
- "add real-time data updates with WebSockets"

### Testing & Quality
- "add unit tests for React components"
- "implement integration tests for user flows"
- "create end-to-end tests with Playwright"
- "add accessibility testing and improvements"
- "implement code coverage reporting"
- "create visual regression testing"
- "add performance monitoring and metrics"
- "implement error tracking and logging"

### DevOps & Deployment
- "set up CI/CD pipeline with automated testing"
- "implement Docker containerization"
- "add environment-specific configuration"
- "create deployment scripts and automation"
- "implement feature flags and A/B testing"
- "add monitoring and alerting systems"
- "create backup and disaster recovery plan"
- "implement security scanning and vulnerability checks"

### Code Quality & Architecture
- "refactor legacy code to modern patterns"
- "implement design system and component library"
- "add TypeScript to existing JavaScript project"
- "create reusable custom hooks"
- "implement clean architecture patterns"
- "add linting and formatting rules"
- "create documentation and style guides"
- "implement code review and quality gates"
