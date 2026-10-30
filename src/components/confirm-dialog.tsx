'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open, pending]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#24151a]/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <section
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-left shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
              Please confirm
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-bold text-foreground">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-md p-1 text-secondary hover:bg-soft hover:text-foreground disabled:opacity-50"
            aria-label="Close confirmation dialog"
          >
            <X size={18} />
          </button>
        </div>
        <p
          id={descriptionId}
          className="mt-4 text-sm leading-relaxed text-secondary"
        >
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-secondary hover:bg-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-md bg-[#a91230] px-3 py-2 text-xs font-semibold text-white hover:bg-[#8f0f29] disabled:opacity-60"
          >
            {pending ? 'Working...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
