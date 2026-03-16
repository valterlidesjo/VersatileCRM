import { useState, useMemo } from "react";
import { BAS_ACCOUNTS } from "@crm/shared";

const ACCOUNT_CLASS_NAMES: Record<number, string> = {
  1: "Assets",
  2: "Equity & liabilities",
  3: "Revenue",
  4: "Materials & goods",
  5: "Premises costs etc.",
  6: "Other external costs",
  7: "Personnel",
  8: "Financial items & tax",
};

export function AccountList() {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return BAS_ACCOUNTS.filter((account) => {
      const matchesSearch =
        !search ||
        account.number.includes(search) ||
        account.name.toLowerCase().includes(search.toLowerCase());
      const matchesClass =
        filterClass === null || account.accountClass === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [search, filterClass]);

  const grouped = useMemo(() => {
    const groups: Record<number, typeof filtered> = {};
    for (const account of filtered) {
      if (!groups[account.accountClass]) {
        groups[account.accountClass] = [];
      }
      groups[account.accountClass].push(account);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search account number or name..."
          className="w-64 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={filterClass ?? ""}
          onChange={(e) =>
            setFilterClass(e.target.value ? Number(e.target.value) : null)
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All account classes</option>
          {Object.entries(ACCOUNT_CLASS_NAMES).map(([cls, name]) => (
            <option key={cls} value={cls}>
              {cls} — {name}
            </option>
          ))}
        </select>
      </div>

      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([cls, accounts]) => (
          <div key={cls}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Class {cls} — {ACCOUNT_CLASS_NAMES[Number(cls)]}
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr className="text-sm font-medium">
                    <th className="px-3 py-2 text-left">Account</th>
                    <th className="px-3 py-2 text-left">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr
                      key={account.number}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2 font-mono text-sm">
                        {account.number}
                      </td>
                      <td className="px-3 py-2 text-sm">{account.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground">No accounts match the search.</p>
      )}
    </div>
  );
}
