# 6529 SEIZE Frontend Dev Guide

## Build & Development Commands
- `npm run dev` - Start development server on port 3001
- `npm run build` - Build production version
- `npm run lint` - Run ESLint
- `npm run test:e2e` - Run all Playwright E2E tests
- `npm run test:e2e:ui` - Run Playwright tests with UI
- `npm run test:e2e -- tests/pages/the-memes.spec.ts` - Run a single test file

## Code Style Guidelines
- **Imports**: Group imports by type (React/Next, external libraries, internal components)
- **Types**: Use TypeScript interfaces and specific types; avoid 'any'
- **Props**: Use readonly for props and function parameters
- **Components**: Use function components with explicit return types
- **File Structure**: Component files with matching .module.scss in same directory
- **Error Handling**: Use try/catch blocks and provide user feedback with toast messages

## State Management
- Use React hooks for local state
- Use context API for shared state
- Prefer React Query for data fetching and caching