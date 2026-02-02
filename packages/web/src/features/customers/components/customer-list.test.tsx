import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomerList } from "./customer-list";
import type { Customer } from "@crm/shared";

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "Acme AB",
    location: "Stockholm",
    phone: "+46701234567",
    email: "info@acme.se",
    status: "not_contacted",
    categoryOfWork: "IT",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Bygg & Co",
    location: "Gothenburg",
    phone: "+46709876543",
    email: "info@bygg.se",
    status: "mrr",
    categoryOfWork: "Construction",
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
  },
];

describe("CustomerList", () => {
  it("should show loading state", () => {
    render(<CustomerList customers={[]} loading={true} />);
    expect(screen.getByText("Loading customers...")).toBeInTheDocument();
  });

  it("should show empty state when no customers", () => {
    render(<CustomerList customers={[]} loading={false} />);
    expect(screen.getByText("No customers yet.")).toBeInTheDocument();
    expect(
      screen.getByText('Click "Add Customer" to get started.')
    ).toBeInTheDocument();
  });

  it("should render customer rows", () => {
    render(<CustomerList customers={mockCustomers} loading={false} />);
    expect(screen.getByText("Acme AB")).toBeInTheDocument();
    expect(screen.getByText("Bygg & Co")).toBeInTheDocument();
  });

  it("should show table headers", () => {
    render(<CustomerList customers={mockCustomers} loading={false} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("should display status badges with labels", () => {
    render(<CustomerList customers={mockCustomers} loading={false} />);
    expect(screen.getByText("Not Contacted")).toBeInTheDocument();
    expect(screen.getByText("MRR")).toBeInTheDocument();
  });

  it("should display customer details", () => {
    render(<CustomerList customers={mockCustomers} loading={false} />);
    expect(screen.getByText("Stockholm")).toBeInTheDocument();
    expect(screen.getByText("info@acme.se")).toBeInTheDocument();
    expect(screen.getByText("+46701234567")).toBeInTheDocument();
    expect(screen.getByText("IT")).toBeInTheDocument();
  });
});
