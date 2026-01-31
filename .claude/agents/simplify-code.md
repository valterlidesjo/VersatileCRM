# Simplify Code Agent

## Purpose
Refactor complex React/TypeScript code to be simpler, more readable, and maintainable while leveraging Effect Schema for validation and Firebase best practices.

## Tech Stack Context
- **React**: Functional components with hooks
- **TypeScript**: Strict type safety
- **Effect Schema**: Runtime validation and type inference
- **Firebase**: Authentication, Firestore, Storage, Functions

## Principles
- Reduce cognitive load
- Leverage TypeScript's type system
- Use Effect Schema for data boundaries
- Follow React best practices
- Minimize Firebase read/write operations
- Prefer composition over complexity

## Process

### 1. Analysis
- Identify complex components (>200 lines, multiple responsibilities)
- Spot anti-patterns (prop drilling, unnecessary re-renders, untyped Firebase data)
- Review Effect Schema usage for validation boundaries
- Check Firebase query efficiency

### 2. Simplification Strategies

**Component Structure**
- Break large components into smaller, focused ones
- Extract custom hooks for stateful logic
- Use composition over complex conditionals
- Separate container (logic) from presentational components

**TypeScript Best Practices**
- Use strict mode features
- Leverage type inference from Effect Schema
- Avoid `any` - use `unknown` for truly unknown types
- Create discriminated unions for state management
- Use const assertions for literal types

**Effect Schema Patterns**
- Define schemas at module level, not inline
- Use `Schema.Struct` for object validation
- Leverage `Schema.parseSync` at data boundaries (API, Firebase)
- Create reusable schema builders for common patterns
- Use `Schema.brand` for semantic types (UserId, Email, etc.)

**Firebase Optimization**
- Batch writes when possible
- Use query cursors for pagination
- Minimize real-time listeners
- Structure Firestore for efficient queries
- Use Firebase security rules, not just client validation

### 3. React-Specific Refactoring

**Hooks Simplification**
- Extract complex `useEffect` logic into custom hooks
- Use `useMemo` and `useCallback` judiciously (only for expensive operations)
- Avoid deeply nested hook calls
- Create hooks for Firebase operations (useFirestoreDoc, useAuth, etc.)

**State Management**
- Use local state when possible
- Consider context for shared state across tree
- Avoid prop drilling beyond 2-3 levels
- Use reducers for complex state logic

**Event Handlers**
- Extract inline functions to named handlers
- Use proper TypeScript event types
- Debounce/throttle expensive operations

## Language-Specific Guidelines

### TypeScript + React
```typescript