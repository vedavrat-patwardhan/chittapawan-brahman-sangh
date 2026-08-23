"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

/* ── Shared icons ───────────────────────────────────────────────────────── */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={cn(
        "shrink-0 text-(--muted) transition-transform duration-200",
        open && "rotate-180",
      )}
    >
      <path
        d="M2.5 5l4.5 4.5L11.5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 text-(--muted)"
    >
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg aria-hidden width="11" height="9" viewBox="0 0 11 9" fill="none">
      <path d="M1 4l3.5 3.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Shared click-outside hook ──────────────────────────────────────────── */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

/* ═══════════════════════════════════════════════════════════════════════════
   SearchableSelect — single-value, searchable dropdown
   ═══════════════════════════════════════════════════════════════════════════ */
export interface SearchableSelectProps {
  name: string;
  options: readonly string[];
  placeholder?: string;
  hasError?: boolean;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function SearchableSelect({
  name,
  options,
  placeholder = "Select…",
  hasError = false,
  defaultValue = "",
  onChange,
}: SearchableSelectProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(defaultValue);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useClickOutside(containerRef, () => {
    setOpen(false);
    setSearch("");
  });

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const MAX_VISIBLE = 100;
  const allFiltered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );
  const filtered = allFiltered.slice(0, MAX_VISIBLE);
  const hasMore = allFiltered.length > MAX_VISIBLE;

  function select(opt: string) {
    setSelected(opt);
    setOpen(false);
    setSearch("");
    onChange?.(opt);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); setSearch(""); }
    if (e.key === "Enter" && filtered.length === 1) { select(filtered[0]); }
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected} />

      {/* Trigger — div avoids nested <button> hydration error */}
      <div
        role="combobox"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); }
          if (e.key === "Escape") { setOpen(false); setSearch(""); }
        }}
        className={cn(
          "field-input flex min-h-11.5 w-full cursor-pointer items-center justify-between gap-2",
          hasError && "field-input-error",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center">
          {selected ? (
            <span className="select-chip">
              {selected}
              <button
                type="button"
                aria-label={`Clear ${selected}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected("");
                  onChange?.("");
                }}
                className="select-chip-remove"
              >
                ×
              </button>
            </span>
          ) : (
            <span className="text-(--muted)">{placeholder}</span>
          )}
        </div>
        <ChevronIcon open={open} />
      </div>

      {/* Panel */}
      {open && (
        <div className="select-dropdown" role="dialog" aria-label="Options">
          <div className="select-search-row">
            <SearchIcon />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              className="select-search-input"
              autoComplete="off"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="select-clear-x"
              >
                ×
              </button>
            )}
          </div>

          <ul id={listboxId} role="listbox" className="select-options">
            {allFiltered.length === 0 ? (
              <li className="select-empty">No options match &ldquo;{search}&rdquo;</li>
            ) : (
              <>
                {filtered.map((opt) => (
                  <li
                    key={opt}
                    role="option"
                    aria-selected={selected === opt}
                    onClick={() => select(opt)}
                    className={cn("select-option", selected === opt && "select-option-active")}
                  >
                    <span className="select-option-check">
                      {selected === opt && <TickIcon />}
                    </span>
                    <span className="select-option-text">{opt}</span>
                  </li>
                ))}
                {hasMore && (
                  <li className="select-empty">
                    {allFiltered.length - MAX_VISIBLE} more — type to narrow down
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MultiSelect — multi-value, searchable dropdown with chips
   ═══════════════════════════════════════════════════════════════════════════ */
export interface MultiSelectProps {
  name: string;
  options: readonly string[];
  placeholder?: string;
  hasError?: boolean;
  defaultValue?: string[];
}

export function MultiSelect({
  name,
  options,
  placeholder = "Select options…",
  hasError = false,
  defaultValue = [],
}: MultiSelectProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(defaultValue);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useClickOutside(containerRef, () => {
    setOpen(false);
    setSearch("");
  });

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(opt: string) {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
    );
  }

  function remove(opt: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => prev.filter((o) => o !== opt));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); setSearch(""); }
    if (e.key === "Enter" && filtered.length === 1) toggle(filtered[0]);
  }

  const visibleChips = selected.slice(0, 3);
  const overflow = selected.length - visibleChips.length;

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden inputs for FormData — one per selected value */}
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}

      {/* Trigger */}
      <div
        role="combobox"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
          if (event.key === "Escape") setOpen(false);
        }}
        className={cn(
          "field-input flex min-h-11.5 w-full items-center justify-between gap-2 text-left",
          hasError && "field-input-error",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selected.length === 0 ? (
            <span className="text-(--muted)">{placeholder}</span>
          ) : (
            <>
              {visibleChips.map((v) => (
                <span key={v} className="select-chip">
                  {v}
                  <button
                    type="button"
                    aria-label={`Remove ${v}`}
                    onClick={(e) => remove(v, e)}
                    className="select-chip-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
              {overflow > 0 && (
                <span className="select-chip select-chip-overflow">+{overflow} more</span>
              )}
            </>
          )}
        </div>
        <ChevronIcon open={open} />
      </div>

      {/* Panel */}
      {open && (
        <div className="select-dropdown" role="dialog" aria-label="Options">
          <div className="select-search-row">
            <SearchIcon />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              className="select-search-input"
              autoComplete="off"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="select-clear-x"
              >
                ×
              </button>
            )}
          </div>

          <ul id={listboxId} role="listbox" aria-multiselectable="true" className="select-options">
            {filtered.length === 0 ? (
              <li className="select-empty">No options match &ldquo;{search}&rdquo;</li>
            ) : (
              filtered.map((opt) => {
                const checked = selected.includes(opt);
                return (
                  <li
                    key={opt}
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(opt)}
                    className={cn("select-option", checked && "select-option-active")}
                  >
                    <span
                      className={cn(
                        "select-multi-check",
                        checked && "select-multi-check-filled",
                      )}
                    >
                      {checked && <TickIcon />}
                    </span>
                    <span className="select-option-text">{opt}</span>
                  </li>
                );
              })
            )}
          </ul>

          {selected.length > 0 && (
            <div className="select-footer">
              <span className="text-xs font-semibold text-(--ink-soft)">
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="select-clear-all"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
