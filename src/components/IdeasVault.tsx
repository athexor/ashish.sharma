const ideas = [
  {
    title: "API Monitoring Platform",
    description:
      "Uptime, latency, and correctness monitoring for third-party APIs. Automated alerting when upstream providers degrade or break contracts.",
    status: "Planned",
  },
  {
    title: "Developer Analytics Engine",
    description:
      "SDK-level telemetry for API consumers — latency distributions, error rates, payload sizes, and usage trends. Self-hosted or cloud.",
    status: "Research",
  },
  {
    title: "AI Resume Matching System",
    description:
      "Vector search over job descriptions and resumes to surface best-fit candidates. Built on top of a structured data extraction pipeline.",
    status: "Idea",
  },
  {
    title: "Startup Discovery Platform",
    description:
      "Aggregates signals from AngelList, LinkedIn, and product launches to identify early-stage companies in a given technical domain.",
    status: "Idea",
  },
  {
    title: "API Schema Registry",
    description:
      "Version-controlled OpenAPI schema storage and diffing. Detect breaking changes automatically before they hit consumers.",
    status: "Research",
  },
  {
    title: "Multi-Cloud Cost Auditor",
    description:
      "Identifies unused resources and cost anomalies across AWS, GCP, and Azure accounts with actionable recommendations.",
    status: "Idea",
  },
  {
    title: "Internal Developer Portal",
    description:
      "Self-serve catalog for engineering teams — services, runbooks, data contracts, and on-call rotations in one searchable interface.",
    status: "Planned",
  },
];

const statusStyle: Record<string, string> = {
  Idea: "border border-border text-muted-foreground",
  Research: "border border-border text-foreground",
  Planned: "border border-border text-foreground",
  Building: "bg-foreground text-background",
};

export function IdeasVault() {
  return (
    <section id="ideas" className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <p
              className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              04 — Backlog
            </p>
            <h2 className="text-3xl md:text-4xl text-foreground" style={{ fontWeight: 300 }}>
              Ideas Vault
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
            {["Idea", "Research", "Planned", "Building"].map((s) => (
              <span key={s} className={`px-2 py-0.5 ${statusStyle[s]}`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Ideas grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {ideas.map((idea) => (
            <div
              key={idea.title}
              className="bg-background p-6 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3
                  className="text-foreground pr-4"
                  style={{ fontSize: "0.925rem", fontWeight: 500 }}
                >
                  {idea.title}
                </h3>
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 text-xs ${statusStyle[idea.status]}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {idea.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {idea.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
