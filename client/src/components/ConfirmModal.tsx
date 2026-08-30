import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export type ConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  onConfirm: () => void;
  isPending?: boolean;
};

export default function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  onConfirm,
  isPending = false,
}: ConfirmModalProps) {
  const isDanger = variant === "danger";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="admin-card max-w-md border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl">
        <AlertDialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                isDanger ? "bg-red-50 text-[var(--accent)]" : "bg-[var(--paper)] text-[var(--ink)]"
              }`}
            >
              {isDanger ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />}
            </span>
            <AlertDialogTitle className="admin-display text-2xl tracking-tight text-[var(--ink)]">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 flex flex-row items-center justify-end gap-3 sm:space-x-0">
          <AlertDialogCancel
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="m-0 h-10 rounded-none border border-[var(--line-strong)] bg-white px-4 text-xs font-extrabold text-[var(--ink)] hover:bg-[var(--warm-2)]"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={`m-0 h-10 rounded-none px-5 text-xs font-extrabold text-white transition-colors ${
              isDanger
                ? "bg-[var(--accent)] hover:bg-[var(--purple-60)]"
                : "bg-[var(--ink)] hover:bg-[var(--cool-80)]"
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
