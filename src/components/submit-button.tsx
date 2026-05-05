"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function SubmitButton({ label, pendingLabel = "Saving…", className }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-sm font-semibold text-[color-mix(in_oklch,white_96%,var(--accent))] shadow-[0_16px_40px_-22px_var(--accent-strong)] transition-[transform,background-color,opacity] duration-200 ease-[var(--ease-out-expo)] hover:bg-[var(--accent-strong)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-focus",
        className,
      )}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
