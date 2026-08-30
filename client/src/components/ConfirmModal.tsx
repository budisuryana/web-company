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
      <AlertDialogContent className="max-w-md rounded-none border-2 border-[#102239] bg-[#fffdf8] p-6 shadow-2xl">
        <AlertDialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                isDanger ? "bg-red-50 text-[#f05a43]" : "bg-[#f6f0e6] text-[#102239]"
              }`}
            >
              {isDanger ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />}
            </span>
            <AlertDialogTitle className="font-[DM_Serif_Display] text-2xl tracking-tight text-[#102239]">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-3 text-sm leading-6 text-slate-600">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 flex flex-row items-center justify-end gap-3 sm:space-x-0">
          <AlertDialogCancel
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="m-0 h-10 rounded-none border border-slate-300 bg-white px-4 text-xs font-extrabold text-[#102239] hover:bg-slate-50"
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
                ? "bg-[#f05a43] hover:bg-[#d94833]"
                : "bg-[#102239] hover:bg-[#1b3457]"
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
