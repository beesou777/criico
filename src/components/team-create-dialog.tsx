'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { TeamForm } from './team-form';

export function TeamCreateDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="button button-primary inline-flex min-h-[47px] items-center justify-center gap-2 rounded bg-accent px-[22px] text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        <Plus size={18} /> Add a team
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#24151a]/45 p-4"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setOpen(false)
          }
        >
          <section
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-team-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
                  Team management
                </p>
                <h2
                  id="create-team-title"
                  className="mt-1 text-xl font-bold text-foreground"
                >
                  Create a team
                </h2>
                <p className="mt-1 text-xs text-secondary">
                  Add a club to your organization.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-secondary hover:bg-soft hover:text-foreground"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6">
              <TeamForm onCreated={() => setOpen(false)} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
