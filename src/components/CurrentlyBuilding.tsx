import { ArrowUpRight } from "lucide-react";

const initiatives = [
  {
    title: "API Marketplace",
    status: "Active Development",
    statusType: "active",
    description:
      "A platform where developers can discover, consume, and publish APIs. Building the infrastructure for API distribution at scale — from onboarding to monetization.",
    progress: 65,
    tags: ["Node.js", "PostgreSQL", "REST", "Stripe"],
  },
  {
    title: "Developer Tooling Experiments",
    status: "Research",
    statusType: "research",
    description:
      "Exploring tools that improve developer productivity. Current focus: local API mocking, environment orchestration, and automated schema validation pipelines.",
    progress: 15,
    tags: ["CLI", "TypeScript", "DX", "Automation"],
  },
  {
    title: "Provider Dashboard",
    status: "Planned",
    statusType: "planned",
    description:
      "Self-serve onboarding and analytics for API providers on the marketplace. Real-time usage metrics, billing controls, and developer documentation management.",
    progress: 5,
    tags: ["React", "Analytics", "SaaS"],
  },
];

const statusColors: Record<string, string> = {
  active: "bg-foreground text-background",
  research: "border border-border text-muted-foreground",
  planned: "border border-border text-muted-foreground",
};

export function CurrentlyBuilding() {
  return (
    <section id="building" className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <p
              className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              01 — Current Work
            </p>
            <h2 className="text-3xl md:text-4xl text-foreground" style={{ fontWeight: 300 }}>
              Currently Building
            </h2>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground max-w-xs text-right leading-relaxed">
            Active initiatives across product development and research
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-px bg-border">
          {initiatives.map((item) => (
            <div
              key={item.title}
              className="bg-background p-8 group hover:bg-muted/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className="text-foreground mb-2"
                    style={{ fontSize: "1rem", fontWeight: 500 }}
                  >
                    {item.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs ${statusColors[item.statusType]} font-mono`} >
                    {item.status}
                  </span>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                />
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {item.description}
              </p>

              {/* Progress */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-xs text-muted-foreground font-mono">
                    Progress
                  </span>
                  <span
                    className="text-xs text-muted-foreground font-mono">
                    {item.progress}%
                  </span>
                </div>
                <div className="h-px bg-border w-full">
                  <div
                    className="h-px bg-foreground transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-muted-foreground font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
