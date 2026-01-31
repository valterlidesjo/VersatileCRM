import type { ReactNode } from "react";

interface PageContainerProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageContainer({ title, description, children }: PageContainerProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
