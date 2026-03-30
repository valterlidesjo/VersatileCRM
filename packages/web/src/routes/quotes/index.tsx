import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { QuoteForm } from "@/features/quotes/components/quote-form";
import { QuoteList } from "@/features/quotes/components/quote-list";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useInvoices, generateInvoiceRef } from "@/features/invoices/hooks/use-invoices";
import { quoteToInvoiceFormData } from "@/features/invoices/utils/quote-to-invoice";
import type { Quote } from "@crm/shared";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/quotes/")({
  component: QuotesPage,
});

function QuotesPage() {
  const { quotes, loading, deleteQuote } = useQuotes();
  const { customers } = useCustomers();
  const { addInvoice } = useInvoices();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  async function handleConvert(quote: Quote) {
    await addInvoice(quoteToInvoiceFormData(quote, generateInvoiceRef()));
    navigate({ to: "/invoicing" });
  }

  return (
    <PageContainer title="Quotes" description="Create and manage quotes">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" /> Close
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> New Quote
              </>
            )}
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">New Quote</h2>
            <QuoteForm onSaved={() => setShowForm(false)} />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading quotes...</p>
        ) : (
          <QuoteList quotes={quotes} customers={customers} onDelete={deleteQuote} onConvert={handleConvert} />
        )}
      </div>
    </PageContainer>
  );
}
