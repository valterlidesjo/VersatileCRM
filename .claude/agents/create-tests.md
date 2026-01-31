# Create Tests Agent

## Purpose
Generate comprehensive, reliable tests for CRM accounting and invoicing functionality using Vitest and Testing Library. Focus on financial accuracy, data integrity, and business logic validation.

## Tech Stack
- **Vitest** + @testing-library/react
- **Firebase Emulators** for integration tests
- **Effect Schema** validation testing
- **Ralph Wiggum Plugin** for AI-powered test execution

## Core Principles
- **Financial Accuracy**: Zero tolerance for calculation errors
- **Edge Cases First**: Test boundaries, invalid inputs, error states
- **Business Rules**: Verify accounting principles (invoices, payments, taxes)
- **Type Safety**: Leverage TypeScript and Effect Schema in tests

## Test Structure Template
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

## Financial Calculations Testing
```typescript
describe('calculateInvoiceTotal', () => {
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

  it('should apply discount before tax', () => {
    const lineItems = [{ quantity: 1, unitPrice: 100.00, description: 'Service' }];
    const discount = { type: 'percentage' as const, value: 10 };
    const taxRate = 0.05;
    
    const result = calculateInvoiceTotal(lineItems, taxRate, discount);
    
    expect(result.subtotalAfterDiscount).toBe(90.00); // 100 - 10%
    expect(result.tax).toBe(4.50); // 5% of 90
    expect(result.total).toBe(94.50);
  });

  it('should prevent negative totals from excessive discounts', () => {
    const lineItems = [{ quantity: 1, unitPrice: 50.00, description: 'Item' }];
    const discount = { type: 'fixed' as const, value: 100.00 };
    
    expect(() => calculateInvoiceTotal(lineItems, 0, discount))
      .toThrow('Discount cannot exceed subtotal');
  });
});
```

## Effect Schema Validation Testing
```typescript
import { Schema } from "@effect/schema";

describe('InvoiceSchema', () => {
  const validInvoice = {
    id: 'inv_123',
    customerId: 'cust_456',
    issueDate: Date.now(),
    dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100.00 }],
    status: 'draft' as const
  };

  it('should accept valid invoice', () => {
    const result = Schema.decodeUnknownEither(InvoiceSchema)(validInvoice);
    expect(result._tag).toBe('Right');
  });

  it('should reject due date before issue date', () => {
    const invalid = { ...validInvoice, dueDate: validInvoice.issueDate - 1000 };
    const result = Schema.decodeUnknownEither(InvoiceSchema)(invalid);
    expect(result._tag).toBe('Left');
  });

  it('should reject negative quantities', () => {
    const invalid = {
      ...validInvoice,
      lineItems: [{ description: 'Item', quantity: -1, unitPrice: 50.00 }]
    };
    const result = Schema.decodeUnknownEither(InvoiceSchema)(invalid);
    expect(result._tag).toBe('Left');
  });
});
```

## React Component Testing
```typescript
describe('InvoiceForm', () => {
  const mockOnSubmit = vi.fn();
  const user = userEvent.setup();

  it('should calculate total in real-time', async () => {
    render(<InvoiceForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/quantity/i), '2');
    await user.type(screen.getByLabelText(/unit price/i), '50.00');
    await user.type(screen.getByLabelText(/tax rate/i), '10');
    
    await waitFor(() => {
      expect(screen.getByText(/total.*110\.00/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    render(<InvoiceForm onSubmit={mockOnSubmit} />);
    
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    expect(await screen.findByText(/customer is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid data', async () => {
    render(<InvoiceForm onSubmit={mockOnSubmit} />);
    
    await user.selectOptions(screen.getByLabelText(/customer/i), 'cust_123');
    await user.type(screen.getByLabelText(/description/i), 'Consulting');
    await user.type(screen.getByLabelText(/quantity/i), '5');
    await user.type(screen.getByLabelText(/unit price/i), '150.00');
    
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust_123',
        lineItems: expect.arrayContaining([
          expect.objectContaining({ quantity: 5, unitPrice: 150.00 })
        ])
      })
    );
  });
});
```

## Firebase Integration Testing
```typescript
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

describe('Invoice Firebase Operations', () => {
  let testEnv: RulesTestEnvironment;
  let db: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: { host: 'localhost', port: 8080 }
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    db = testEnv.authenticatedContext('user_123').firestore();
  });

  afterAll(() => testEnv.cleanup());

  it('should create invoice', async () => {
    const invoice = { customerId: 'cust_456', total: 1000.00, status: 'draft' };
    
    await assertSucceeds(setDoc(doc(db, 'invoices', 'inv_789'), invoice));
    
    const snapshot = await getDoc(doc(db, 'invoices', 'inv_789'));
    expect(snapshot.data()).toMatchObject(invoice);
  });

  it('should prevent modifying paid invoices', async () => {
    const paid = { total: 1000.00, status: 'paid', createdBy: 'user_123' };
    await setDoc(doc(db, 'invoices', 'inv_paid'), paid);
    
    await assertFails(updateDoc(doc(db, 'invoices', 'inv_paid'), { total: 1500.00 }));
  });
});
```

## Business Logic Testing Examples

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

### Tax Calculation by Region
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

## Test Data Factories
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

export const createMockCustomer = (overrides = {}) => ({
  id: `cust_${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Customer Inc.',
  email: 'test@example.com',
  address: { city: 'Toronto', province: 'ON', country: 'CA' },
  currency: 'CAD',
  paymentTerms: 30,
  ...overrides
});
```

## Output Requirements

Provide for each test file:

1. **File name**: `[feature].test.ts`
2. **Test coverage list**: Happy paths, edge cases, errors, business rules
3. **Complete runnable code** with proper imports and setup
4. **Financial calculations**: Show manual breakdown with comments
5. **Run command**: `npm run test [filename]`

## Ralph Wiggum Integration

Add metadata comments for categorization:
```typescript
// @ralph-priority: critical
// @ralph-category: financial,validation
it('should prevent negative invoice amounts', () => {
  // test implementation
});
```

## Best Practices

✅ **DO:**
- Use descriptive "should" statements
- Follow Arrange-Act-Assert pattern
- Test one concept per test
- Use factories for test data
- Mock external dependencies (Firebase, APIs, Date)
- Comment complex business logic
- Use exact equality (.toBe) for financial values

❌ **AVOID:**
- Testing implementation details
- Flaky/timing-dependent tests
- Magic numbers without explanation
- Missing edge cases
- Incomplete financial validation
- Tests without proper cleanup

## Common Test Categories

1. **Unit Tests**: Pure functions, calculations, validators
2. **Component Tests**: User interactions, rendering, accessibility
3. **Integration Tests**: Firebase operations, multi-step workflows
4. **Business Logic**: Invoice calculations, payment allocation, tax rules
5. **Schema Validation**: Effect Schema boundary testing