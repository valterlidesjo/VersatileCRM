# Create Tests

## Description
Generate comprehensive, reliable tests for CRM accounting and invoicing functionality using Vitest and Testing Library. Focuses on financial accuracy, data integrity, and business logic validation with zero tolerance for calculation errors.

## When to Use
- User asks to "create tests", "write tests", "generate tests", or "add test coverage"
- User mentions testing specific features like invoices, payments, or calculations
- User references testing frameworks (Vitest, Testing Library, Jest)
- User needs to test financial calculations or accounting logic
- User wants to validate Effect Schema definitions
- User mentions "Ralph Wiggum" test plugin or test categorization

## Tech Stack Context
This skill targets projects using:
- **Vitest** + @testing-library/react
- **Firebase Emulators** for integration tests
- **Effect Schema** validation
- **Ralph Wiggum Plugin** for AI-powered test execution

## Instructions

### 1. Initial Assessment
Before writing any tests:
- Identify what needs testing (component, function, schema, business logic)
- Determine test category: Unit, Component, Integration, Business Logic, or Schema Validation
- Check for existing test patterns in the codebase
- Identify financial calculations that require exact precision

### 2. Test File Structure
Always use this template structure:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('FeatureName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when [condition]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### 3. Financial Calculations Testing Pattern
For any financial calculations, ALWAYS:
- Show manual calculation breakdown in comments
- Use `.toBe()` for exact equality (never `.toBeCloseTo()`)
- Test rounding behavior explicitly
- Test discount/tax application order
- Validate against negative totals

Example:
```typescript
it('should calculate total with tax correctly', () => {
  const lineItems = [
    { quantity: 2, unitPrice: 99.99, description: 'Product A' },
    { quantity: 1, unitPrice: 149.50, description: 'Product B' }
  ];
  const taxRate = 0.13; // 13% HST
  
  const result = calculateInvoiceTotal(lineItems, taxRate);
  
  // Subtotal: (2 × 99.99) + 149.50 = 349.48
  expect(result.subtotal).toBe(349.48);
  // Tax: 349.48 × 0.13 = 45.43 (rounded)
  expect(result.tax).toBe(45.43);
  // Total: 349.48 + 45.43 = 394.91
  expect(result.total).toBe(394.91);
});
```

### 4. Effect Schema Validation Pattern
For schema testing:
- Test valid inputs (happy path)
- Test each validation rule with invalid inputs
- Use `Schema.decodeUnknownEither()` to capture Left/Right
- Test edge cases (boundaries, empty values, type mismatches)

Example:
```typescript
it('should reject due date before issue date', () => {
  const invalid = { ...validInvoice, dueDate: validInvoice.issueDate - 1000 };
  const result = Schema.decodeUnknownEither(InvoiceSchema)(invalid);
  expect(result._tag).toBe('Left');
});
```

### 5. React Component Testing Pattern
For components:
- Use `userEvent.setup()` for interactions
- Test real-time calculations and UI updates
- Validate form submissions with `expect.objectContaining()`
- Test error states and validation messages
- Use `waitFor` for async state updates

### 6. Firebase Integration Testing Pattern
For Firebase operations:
- Use `@firebase/rules-unit-testing`
- Set up test environment with emulators
- Use `assertSucceeds()` and `assertFails()` for security rules
- Clear Firestore between tests
- Test business rules (e.g., preventing paid invoice modifications)

### 7. Test Data Factories
Create reusable factory functions:
```typescript
export const createMockInvoice = (overrides = {}) => ({
  id: `inv_${Math.random().toString(36).substr(2, 9)}`,
  customerId: 'cust_123',
  issueDate: Date.now(),
  dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  lineItems: [{ description: 'Test Service', quantity: 1, unitPrice: 100.00 }],
  subtotal: 100.00,
  tax: 13.00,
  total: 113.00,
  status: 'draft' as const,
  ...overrides
});
```

### 8. Ralph Wiggum Integration
Add categorization metadata for critical tests:
```typescript
// @ralph-priority: critical
// @ralph-category: financial,validation
it('should prevent negative invoice amounts', () => {
  // test implementation
});
```

### 9. Output Format
For each test file, provide:
1. **Filename**: `[feature].test.ts`
2. **Coverage summary**: List of test cases (happy paths, edge cases, errors)
3. **Complete runnable code** with all imports
4. **Run command**: `npm run test [filename]` or `vitest [filename]`

### 10. Required Test Categories
Always cover these areas:
- ✅ Happy path (valid inputs, expected outputs)
- ✅ Edge cases (boundaries, empty values, nulls)
- ✅ Error states (invalid inputs, exceptions)
- ✅ Business rules (accounting principles, validation logic)
- ✅ Financial accuracy (exact calculations with breakdowns)

## Best Practices

### DO:
- Use descriptive "should" statements in test names
- Follow Arrange-Act-Assert pattern consistently
- Test one concept per test case
- Use factory functions for test data
- Mock external dependencies (Firebase, APIs, Date.now)
- Add comments explaining complex business logic
- Use `.toBe()` for financial values (exact equality)
- Clear mocks in `beforeEach` hooks

### AVOID:
- Testing implementation details (internal state, private methods)
- Flaky or timing-dependent tests
- Magic numbers without explanation
- Missing edge case coverage
- Incomplete financial validation
- Tests without proper cleanup
- Using `.toBeCloseTo()` for money calculations

## Common Business Logic Patterns

### Payment Allocation (FIFO)
```typescript
it('should allocate payment to oldest invoice first', () => {
  const invoices = [
    { id: 'inv_1', total: 1000.00, paid: 0, date: '2024-01-01' },
    { id: 'inv_2', total: 500.00, paid: 0, date: '2024-02-01' }
  ];
  const payment = { amount: 1200.00 };
  
  const result = allocatePayment(payment, invoices);
  
  expect(result.allocations).toEqual([
    { invoiceId: 'inv_1', amount: 1000.00 },
    { invoiceId: 'inv_2', amount: 200.00 }
  ]);
});
```

### Canadian Tax Calculation
```typescript
it('should apply correct tax by province', () => {
  const items = [{ description: 'Product', quantity: 1, unitPrice: 100.00 }];
  
  expect(calculateTax(items, 'CA', 'ON').hst).toBe(13.00); // Ontario HST
  expect(calculateTax(items, 'CA', 'AB').gst).toBe(5.00);  // Alberta GST only
  
  const bc = calculateTax(items, 'CA', 'BC');
  expect(bc.gst).toBe(5.00);
  expect(bc.pst).toBe(7.00);
});
```

### Discount Before Tax
```typescript
it('should apply discount before tax', () => {
  const lineItems = [{ quantity: 1, unitPrice: 100.00, description: 'Service' }];
  const discount = { type: 'percentage' as const, value: 10 };
  const taxRate = 0.05;
  
  const result = calculateInvoiceTotal(lineItems, taxRate, discount);
  
  expect(result.subtotalAfterDiscount).toBe(90.00); // 100 - 10%
  expect(result.tax).toBe(4.50); // 5% of 90
  expect(result.total).toBe(94.50);
});
```

## Core Principles
- **Financial Accuracy**: Zero tolerance for calculation errors
- **Edge Cases First**: Test boundaries, invalid inputs, error states before happy paths
- **Business Rules**: Always verify accounting principles are enforced
- **Type Safety**: Leverage TypeScript and Effect Schema in all tests

## Notes
- This skill is optimized for CRM/accounting domains with strict financial requirements
- Tests should be runnable without modification using `vitest` command
- All financial calculations must include manual breakdowns in comments
- Mock `Date.now()` in tests to ensure reproducibility
- Firebase emulators must be running for integration tests