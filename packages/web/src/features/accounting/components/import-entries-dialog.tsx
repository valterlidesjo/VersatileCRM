import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  parseEntriesCsv,
  parseVerifikationCsv,
  detectCsvFormat,
  CSV_TEMPLATE,
  CATEGORY_REFERENCE,
  type ParsedImportEntry,
} from "../utils/csv-import";
import { formatAmount } from "../utils/format";

interface ImportEntriesDialogProps {
  onClose: () => void;
  onImport: (
    entries: ParsedImportEntry[]
  ) => Promise<{ successCount: number; errors: string[] }>;
}

type Step = "upload" | "preview" | "importing" | "done";

export function ImportEntriesDialog({
  onClose,
  onImport,
}: ImportEntriesDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parsedEntries, setParsedEntries] = useState<ParsedImportEntry[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<
    "verifikation" | "internal" | null
  >(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const blob = new Blob(["\uFEFF" + CSV_TEMPLATE], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "journal-entry-import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setParseErrors(["Please upload a .csv file."]);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const format = detectCsvFormat(text);

      if (format === "unknown") {
        setParseErrors([
          "Okänt CSV-format. Ladda upp en CRM-exportfil eller en verifikationsjournal (Visma/Fortnox).",
        ]);
        return;
      }

      setDetectedFormat(format);
      const result =
        format === "verifikation"
          ? parseVerifikationCsv(text)
          : parseEntriesCsv(text);

      setParseErrors(result.errors);
      setParseWarnings(result.warnings);
      setParsedEntries(result.entries);
      if (result.errors.length === 0 && result.entries.length > 0) {
        setStep("preview");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleImport() {
    setStep("importing");
    setImportTotal(parsedEntries.length);
    setImportProgress(0);
    setImportErrors([]);

    // Simulate progress while importing in batch
    const progressInterval = setInterval(() => {
      setImportProgress((p) => Math.min(p + 1, parsedEntries.length - 1));
    }, 80);

    try {
      const result = await onImport(parsedEntries);
      clearInterval(progressInterval);
      setImportProgress(parsedEntries.length);
      setImportErrors(result.errors);
    } catch (err) {
      clearInterval(progressInterval);
      setImportErrors([
        `Import failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      ]);
    }

    setStep("done");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={step === "importing" ? undefined : onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-3xl rounded-xl border border-border bg-background shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <h2 className="text-lg font-semibold">
            Import journal entries from CSV
          </h2>
          {step !== "importing" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Step: Upload */}
          {step === "upload" && (
            <>
              {/* Template download */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
                <Download className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Supported formats</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Two formats are accepted and detected automatically:
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-muted-foreground list-disc list-inside">
                    <li>
                      <span className="text-foreground font-medium">
                        CRM-format
                      </span>{" "}
                      — one row per journal entry with category, transactionType,
                      totalAmount, vatRate
                    </li>
                    <li>
                      <span className="text-foreground font-medium">
                        Verifikationsjournal
                      </span>{" "}
                      — export from Visma, Fortnox, or similar Swedish
                      bookkeeping software (Datum, Verifikationsnummer, Konto,
                      Debet, Kredit)
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    Download CRM-format template
                  </button>
                </div>
              </div>

              {/* Column reference */}
              <div className="rounded-lg border border-border overflow-x-auto text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Column
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Required
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Format / example
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["date", "Yes", "YYYY-MM-DD  e.g. 2024-01-15"],
                      [
                        "transactionType",
                        "Yes",
                        '"cost" or "income"',
                      ],
                      [
                        "category",
                        "Yes",
                        "Category ID from the list below, e.g. office_supplies",
                      ],
                      [
                        "totalAmount",
                        "Yes",
                        "Amount incl. VAT  e.g. 1250.00",
                      ],
                      ["description", "No", "Free text description"],
                      [
                        "vatRate",
                        "No",
                        "0 | 6 | 12 | 25  (default: category's default)",
                      ],
                    ].map(([col, req, fmt]) => (
                      <tr
                        key={col}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-3 py-2 font-mono">{col}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {req}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {fmt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Category reference toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCategories((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {showCategories
                    ? "Hide available categories"
                    : "Show available category IDs"}
                </button>

                {showCategories && (
                  <div className="mt-2 rounded-lg border border-border overflow-x-auto text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            ID (used in CSV)
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Type
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Default VAT
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {CATEGORY_REFERENCE.map((cat) => (
                          <tr
                            key={cat.id}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-3 py-2 font-mono">{cat.id}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {cat.name}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  cat.type === "cost"
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {cat.type === "cost" ? "Cost" : "Income"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {cat.defaultVatRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-10 flex flex-col items-center gap-3 transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/20"
                }`}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drag and drop CSV file here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to select a file
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>

              {/* Parse errors */}
              {parseErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-1">
                  <p className="text-sm font-medium text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Errors in CSV file
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {parseErrors.map((e, i) => (
                      <li key={i} className="text-sm text-red-600">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {parsedEntries.length}
                    </span>{" "}
                    journal entr{parsedEntries.length !== 1 ? "ies" : "y"} found
                    in file
                  </p>
                  {detectedFormat && (
                    <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                      {detectedFormat === "verifikation"
                        ? "Verifikationsjournal"
                        : "CRM-format"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("upload");
                    setParsedEntries([]);
                    setParseErrors([]);
                    setParseWarnings([]);
                    setDetectedFormat(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Change file
                </button>
              </div>

              {/* Warnings */}
              {parseWarnings.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-1">
                  <p className="text-sm font-medium text-yellow-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Warnings
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {parseWarnings.map((w, i) => (
                      <li key={i} className="text-sm text-yellow-700">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              <div className="overflow-x-auto rounded-lg border border-border text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                        Amount incl.
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                        VAT
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                        VAT rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEntries.map((entry, i) => (
                      <tr
                        key={i}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-3 py-2 text-muted-foreground">
                          {entry.date}
                        </td>
                        <td className="px-3 py-2 max-w-[180px] truncate">
                          {entry.description}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              entry.transactionType === "cost"
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {entry.transactionType === "cost"
                              ? "Cost"
                              : "Income"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs font-mono">
                          {entry.category}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {formatAmount(entry.totalAmount)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {formatAmount(entry.vatAmount)}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {entry.vatRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {parsedEntries.length > 0 && (
                    <tfoot>
                      <tr className="bg-muted/30 border-t border-border">
                        <td
                          colSpan={4}
                          className="px-3 py-2 text-sm font-medium text-muted-foreground"
                        >
                          Total
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {formatAmount(
                            parsedEntries.reduce(
                              (s, e) => s + e.totalAmount,
                              0
                            )
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium text-muted-foreground">
                          {formatAmount(
                            parsedEntries.reduce((s, e) => s + e.vatAmount, 0)
                          )}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">
                Importing entry {importProgress} of {importTotal}…
              </p>
              <div className="w-full max-w-xs rounded-full bg-muted h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <p className="text-base font-semibold">
                {importTotal - importErrors.length} of {importTotal}{" "}
                journal entries imported!
              </p>
              {importErrors.length > 0 && (
                <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4 space-y-1">
                  <p className="text-sm font-medium text-red-700">
                    Errors during import:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {importErrors.map((e, i) => (
                      <li key={i} className="text-sm text-red-600">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex justify-end gap-3 shrink-0">
          {step === "upload" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          )}
          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Import {parsedEntries.length} journal entr{parsedEntries.length !== 1 ? "ies" : "y"}
              </button>
            </>
          )}
          {step === "done" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
