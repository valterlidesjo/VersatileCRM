import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PipelineBoard } from "./pipeline-board";
import type { Customer } from "@crm/shared";

// Mock TanStack Router's useNavigate
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    name: "Test Company",
    location: "Stockholm",
    phone: "+46701234567",
    email: "test@test.se",
    status: "not_contacted",
    categoryOfWork: "IT",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("PipelineBoard", () => {
  it("should show loading state", () => {
    render(
      <PipelineBoard customers={[]} loading={true} onUpdateStatus={vi.fn()} />
    );
    expect(screen.getByText("Loading pipeline...")).toBeInTheDocument();
  });

  it("should render all 4 pipeline stage columns", () => {
    render(
      <PipelineBoard customers={[]} loading={false} onUpdateStatus={vi.fn()} />
    );
    expect(screen.getByText("Prospecting")).toBeInTheDocument();
    expect(screen.getByText("Contacted")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Deal Closed")).toBeInTheDocument();
  });

  it("should render the lost section", () => {
    render(
      <PipelineBoard customers={[]} loading={false} onUpdateStatus={vi.fn()} />
    );
    expect(screen.getByText(/Lost \(0\)/)).toBeInTheDocument();
  });

  it("should place customer in correct column based on status", () => {
    const customers = [
      makeCustomer({ id: "c1", name: "Prospecting Co", status: "not_contacted" }),
      makeCustomer({ id: "c2", name: "Contacted Co", status: "contacted" }),
      makeCustomer({ id: "c3", name: "InProg Co", status: "in_progress" }),
      makeCustomer({ id: "c4", name: "MRR Co", status: "mrr" }),
    ];

    render(
      <PipelineBoard customers={customers} loading={false} onUpdateStatus={vi.fn()} />
    );

    expect(screen.getByText("Prospecting Co")).toBeInTheDocument();
    expect(screen.getByText("Contacted Co")).toBeInTheDocument();
    expect(screen.getByText("InProg Co")).toBeInTheDocument();
    expect(screen.getByText("MRR Co")).toBeInTheDocument();
  });

  it("should filter customers by search", () => {
    const customers = [
      makeCustomer({ id: "c1", name: "Acme Corp", status: "not_contacted" }),
      makeCustomer({ id: "c2", name: "Beta Inc", status: "contacted" }),
    ];

    render(
      <PipelineBoard customers={customers} loading={false} onUpdateStatus={vi.fn()} />
    );

    const searchInput = screen.getByPlaceholderText("Search customers...");
    fireEvent.change(searchInput, { target: { value: "Acme" } });

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Inc")).not.toBeInTheDocument();
  });

  it("should show correct counts in summary", () => {
    const customers = [
      makeCustomer({ id: "c1", status: "not_contacted" }),
      makeCustomer({ id: "c2", status: "not_contacted" }),
      makeCustomer({ id: "c3", status: "contacted" }),
    ];

    render(
      <PipelineBoard customers={customers} loading={false} onUpdateStatus={vi.fn()} />
    );

    // Summary bar should show the counts
    expect(screen.getByText("Prospecting: 2")).toBeInTheDocument();
    expect(screen.getByText("Contacted: 1")).toBeInTheDocument();
  });

  it("should toggle lost section when clicked", () => {
    const customers = [
      makeCustomer({ id: "c1", name: "Lost Co", status: "lost" }),
    ];

    render(
      <PipelineBoard customers={customers} loading={false} onUpdateStatus={vi.fn()} />
    );

    // Lost section starts collapsed - customer not visible
    expect(screen.queryByText("Lost Co")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText(/Lost \(1\)/));
    expect(screen.getByText("Lost Co")).toBeInTheDocument();
  });
});
