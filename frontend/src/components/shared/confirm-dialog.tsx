import * as React from "react";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from "../ui/modal";
import { Button } from "../ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "danger", loading = false, icon,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const busy = loading || internalLoading;
  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };
  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} size="sm" closeOnBackdrop={!busy} closeOnEscape={!busy}>
      <ModalHeader>
        <div className="flex items-start gap-3">
          {icon && <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${variant === "danger" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"} [&>svg]:size-5`}>{icon}</div>}
          <div><ModalTitle>{title}</ModalTitle>{description && <ModalDescription>{description}</ModalDescription>}</div>
        </div>
      </ModalHeader>
      <ModalContent><p className="text-sm leading-6 text-slate-600">{description ?? "Are you sure you want to continue? This action may not be reversible."}</p></ModalContent>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
        <Button variant={variant === "danger" ? "danger" : "primary"} onClick={handleConfirm} loading={busy}>{confirmLabel}</Button>
      </ModalFooter>
    </Modal>
  );
}
