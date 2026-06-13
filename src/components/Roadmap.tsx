const roadmap = [
  {
    year: "2026",
    quarters: [
      {
        label: "Q2",
        current: true,
        items: [
          { title: "Personal Website", done: true },
          { title: "API Marketplace MVP", done: false },
          { title: "Provider Onboarding", done: false },
          { title: "Billing System", done: false },
        ],
      },
      {
        label: "Q3",
        current: false,
        items: [
          { title: "Analytics Platform", done: false },
          { title: "Domain Intelligence API v1", done: false },
          { title: "Provider Dashboard", done: false },
          { title: "Public Beta Launch", done: false },
        ],
      },
      {
        label: "Q4",
        current: false,
        items: [
          { title: "API Monitoring MVP", done: false },
          { title: "Revenue Generation", done: false },
          { title: "Performance Hardening", done: false },
          { title: "Enterprise Tier Planning", done: false },
        ],
      },
    ],
  },
  {
    year: "2027",
    quarters: [
      {
        label: "H1",
        current: false,
        items: [
          { title: "SaaS Launch", done: false },
          { title: "Open Source Initiative", done: false },
          { title: "Team Expansion", done: false },
          { title: "API Schema Registry", done: false },
        ],
      },
      {
        label: "H2",
        current: false,
        items: [
          { title: "Scalable Product Ecosystem", done: false },
          { title: "Developer Conference Presence", done: false },
          { title: "Series A Exploration", done: false },
          { title: "International Expansion", done: false },
        ],
      },
    ],
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <p
            className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            05 — Direction
          </p>
          <h2 className="text-3xl md:text-4xl text-foreground" style={{ fontWeight: 300 }}>
            Roadmap
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-md">
            Public goals and milestones. Updated continuously.
          </p>
        </div>

        {/* Roadmap layout */}
        <div className="space-y-16">
          {roadmap.map((yr) => (
            <div key={yr.year}>
              {/* Year marker */}
              <div className="flex items-center gap-4 mb-8">
                <span
                  className="text-xs text-muted-foreground tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {yr.year}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Quarters */}
              <div className="grid md:grid-cols-3 gap-px bg-border">
                {yr.quarters.map((q) => (
                  <div
                    key={q.label}
                    className={`bg-background p-6 ${q.current ? "bg-muted/20" : ""}`}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <span
                        className="text-xs text-foreground"
                        style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
                      >
                        {q.label}
                      </span>
                      {q.current && (
                        <span
                          className="text-xs text-muted-foreground px-1.5 py-0.5 border border-border"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          now
                        </span>
                      )}
                    </div>
                    <ul className="space-y-2.5">
                      {q.items.map((item) => (
                        <li key={item.title} className="flex items-center gap-3">
                          <span
                            className={`w-3 h-3 shrink-0 border ${
                              item.done
                                ? "bg-foreground border-foreground"
                                : "border-border"
                            }`}
                          />
                          <span
                            className={`text-sm leading-snug ${
                              item.done
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {item.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
