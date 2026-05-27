import { cn } from "@/lib/utils";

export type Status = "Ativo" | "Inativo" | "Pendente" | "Ativa" | "Inativa";

const styles: Record<Status, string> = {
  Ativo: "bg-success/15 text-success-foreground",
  Ativa: "bg-success/15 text-success-foreground",
  Inativo: "bg-muted text-muted-foreground",
  Inativa: "bg-muted text-muted-foreground",
  Pendente: "bg-warning/20 text-warning-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      <span className="text-[8px]">●</span>
      {status}
    </span>
  );
}
