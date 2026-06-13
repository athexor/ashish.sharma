const interests = [
  {
    title: "Backend Engineering",
    description:
      "API design, service architecture, database modeling, and the craft of building systems that stay fast and correct under load.",
  },
  {
    title: "Distributed Systems",
    description:
      "Consistency models, consensus algorithms, partition tolerance, and the engineering tradeoffs that define how systems behave at scale.",
  },
  {
    title: "System Design",
    description:
      "Breaking down product requirements into composable technical primitives — a discipline that bridges engineering and product thinking.",
  },
  {
    title: "Cloud Architecture",
    description:
      "Infrastructure as code, serverless primitives, managed data services, and cost-performance tradeoffs across AWS, GCP, and Azure.",
  },
  {
    title: "AI Infrastructure",
    description:
      "The plumbing beneath LLMs — vector stores, embedding pipelines, retrieval architectures, and inference cost optimization.",
  },
  {
    title: "Developer Platforms",
    description:
      "Building the tools, APIs, and surfaces that other engineers build on top of. SDKs, documentation, and developer experience.",
  },
  {
    title: "Internet Infrastructure",
    description:
      "DNS, CDN, TLS, BGP routing — the physical and logical protocols that make the internet reliable and fast.",
  },
  {
    title: "API Economics",
    description:
      "How APIs are priced, monetized, and discovered. The business model behind developer platforms and infrastructure companies.",
  },
];

export function TechnicalInterests() {
  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <p
            className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            07 — Focus
          </p>
          <h2 className="text-3xl md:text-4xl text-foreground" style={{ fontWeight: 300 }}>
            Technical Interests
          </h2>
        </div>

        {/* Interests grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {interests.map((interest) => (
            <div
              key={interest.title}
              className="bg-background p-6 hover:bg-muted/20 transition-colors"
            >
              <h3
                className="text-foreground mb-3"
                style={{ fontSize: "0.9rem", fontWeight: 500 }}
              >
                {interest.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {interest.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
