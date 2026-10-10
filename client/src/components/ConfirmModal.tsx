import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useT } from "@/admin/i18n";
import { Tile, btn } from "@/studio/ui";

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

/** Confirmation dialog in the NUSAKARYA HQ modal pattern: tinted icon, title, body, and a footer with the decision. */
export default function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  onConfirm,
  isPending = false,
}: ConfirmModalProps) {
  const t = useT();
  const tile =
    variant === "danger"
      ? { icon: TriangleAlert, hue: "red" as const }
      : variant === "warning"
        ? { icon: ShieldAlert, hue: "amber" as const }
        : { icon: ShieldCheck, hue: "blue" as const };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="hq-modal">
        <div className="hq-modal-head">
          <Tile icon={tile.icon} hue={tile.hue} />
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </div>
        <AlertDialogDescription className="hq-modal-body">{description}</AlertDialogDescription>
        <div className="hq-modal-foot">
          <AlertDialogCancel disabled={isPending} onClick={() => onOpenChange(false)} className={btn("default", "md", "m-0")}>
            {cancelLabel ?? t("Batal")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={btn(variant === "danger" ? "danger" : "primary", "md", "m-0")}
          >
            {isPending && <Loader2 className="hq-spin" aria-hidden="true" />}
            {confirmLabel ?? t("Konfirmasi")}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
