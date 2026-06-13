const log: { month: string; year: string; entries: string[] }[] = [
  {
    month: "June",
    year: "2026",
    entries: [
      "Implemented provider onboarding flow with multi-step form validation",
      "Built API key authentication system with scoped permissions",
      "Improved query performance on analytics endpoints by 60% via index optimization",
      "Shipped rate limiting middleware with sliding window algorithm",
      "Started domain intelligence data aggregation pipeline",
    ],
  },
  {
    month: "May",
    year: "2026",
    entries: [
      "Added real-time analytics dashboard with WebSocket updates",
      "Designed and implemented pricing architecture for tiered plans",
      "Integrated Stripe billing with webhook-based status reconciliation",
      "Refactored API router for better multi-tenant isolation",
      "Set up CI/CD pipeline with automated integration tests",
    ],
  },
  {
    month: "March",
    year: "2026",
    entries: [
      "Started personal website — engineering lab concept",
      "Launched API marketplace project — defined architecture and tech stack",
      "Wrote technical spec for API gateway engine",
      "Explored developer tooling space — identified pain points in local dev",
    ],
  },
  {
    month: "February",
    year: "2026",
    entries: [
      "Open sourced a small CLI utility for env file management",
      "Deep-dive into API design patterns and REST best practices",
    ],
  },
];

export function BuildLog() {
  return (
    <section id="buildlog" className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <p
            className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            03 — Progress
          </p>
          <h2 className="text-3xl md:text-4xl text-foreground" style={{ fontWeight: 300 }}>
            Build Log
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-md">
            A running record of engineering progress, decisions, and milestones.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-12">
            {log.map((entry, i) => (
              <div key={i} className="pl-8 relative">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 w-px h-full" />
                <div className="absolute -left-1 top-1 w-2.5 h-2.5 border border-foreground bg-background" />

                {/* Month label */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span
                    className="text-sm text-foreground"
                    style={{ fontWeight: 500 }}
                  >
                    {entry.month}
                  </span>
                  <span
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {entry.year}
                  </span>
                </div>

                {/* Entries */}
                <ul className="space-y-2.5">
                  {entry.entries.map((e, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="text-muted-foreground mt-0.5 shrink-0 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                        →
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        {e}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
