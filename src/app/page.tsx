import Link from "next/link";

const stats = [
  { value: "1", label: "Trusted directory" },
  { value: "1933", label: "Year founded" },
  { value: "16", label: "Business categories" },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-[var(--hero-pad-inline)] pt-14 pb-12 sm:pt-20">
        <div className="max-w-3xl">
          <p className="motion-rise text-[0.7rem] font-semibold tracking-[0.16em] text-[var(--accent-strong)] uppercase">
            Konkanastha Brahmin Community · Nashik
          </p>
          <h1 className="motion-rise-delay-1 mt-4 font-[family-name:var(--font-display)] text-[clamp(2.6rem,7vw,4.2rem)] font-bold leading-[1.07] tracking-tight text-[var(--ink)]">
            A living record of every Sangh trade and profession.
          </h1>
          <p className="motion-rise-delay-2 mt-6 max-w-[60ch] text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
            Since 1933 the Sangh has united Chittapawan families through
            commerce, education, and mutual support. This directory extends that
            mission online — search by sector, city, or keyword; reach anyone in
            the network within seconds.
          </p>
          <div className="motion-rise-delay-3 mt-8 flex flex-wrap gap-3">
            <Link
              href="/directory"
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-7 text-sm font-semibold text-[color-mix(in_oklch,white_97%,var(--accent))] shadow-[0_20px_48px_-28px_var(--accent-strong)] transition-[transform,background-color] duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] focus-visible:ring-focus"
            >
              Browse the directory
            </Link>
            <Link
              href="/join"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface-card)] px-7 text-sm font-semibold text-[var(--ink-soft)] transition-[border-color,color,transform] duration-200 hover:border-[var(--accent)] hover:text-[var(--ink)] focus-visible:ring-focus"
            >
              Submit your business
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-[var(--line)] bg-[var(--surface-inset)]">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-12 gap-y-6 px-[var(--hero-pad-inline)] py-8 sm:gap-x-20">
          {stats.map((s) => (
            <div key={s.value} className="flex flex-col gap-1">
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--accent-strong)] tabular-nums">
                {s.value}
              </span>
              <span className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-[var(--hero-pad-inline)] py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div className="space-y-5">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-4xl">
              Your business, discoverable to the whole community.
            </h2>
            <p className="max-w-[52ch] leading-relaxed text-[var(--ink-soft)]">
              The Sangh&apos;s Business Forum has served entrepreneurs since its
              founding. This directory gives every member a permanent,
              searchable profile — no WhatsApp forwarding, no outdated PDFs.
            </p>
            <Link
              href="/join"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)] focus-visible:ring-focus"
            >
              Apply for a listing →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                n: "01",
                title: "Structured intake",
                body: "Dropdowns and categories keep data consistent — no typo variants collapsing search results.",
              },
              {
                n: "02",
                title: "Keyword discovery",
                body: 'Members tag their trade precisely so anyone can find "wedding catering" or "GST filing" in one search.',
              },
              {
                n: "03",
                title: "Admin verified",
                body: "Every new application stays private until a Sangh administrator checks and approves the details.",
              },
              {
                n: "04",
                title: "Mobile-first reading",
                body: "Profiles are designed for thumb-scroll on phones; every detail fits without horizontal scrolling.",
              },
            ].map((card) => (
              <article
                key={card.n}
                className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-card)] p-6"
              >
                <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--accent-soft)]">
                  {card.n}
                </span>
                <h3 className="mt-3 font-semibold text-[var(--ink)]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
