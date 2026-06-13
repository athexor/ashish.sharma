const principles = [
  {
    number: "01",
    title: "Build before perfecting",
    body: "A working system with known tradeoffs beats an unbuilt system designed to perfection. Ship, observe, iterate.",
  },
  {
    number: "02",
    title: "Simplicity scales",
    body: "Complexity is a liability. The best architecture is the one that handles today's requirements with the least moving parts.",
  },
  {
    number: "03",
    title: "APIs are products",
    body: "An API is a user interface for developers. Design for the consumer's mental model, not the implementation's convenience.",
  },
  {
    number: "04",
    title: "Reliability over hype",
    body: "Boring technology that runs reliably beats exciting technology that fails unpredictably. Choose proven primitives under pressure.",
  },
  {
    number: "05",
    title: "Measure before optimizing",
    body: "Premature optimization hides real bottlenecks. Profile first, then act on evidence — not intuition.",
  },
  {
    number: "06",
    title: "Developer experience matters",
    body: "Fast feedback loops, clear error messages, and good defaults compound over time. DX is a competitive advantage.",
  },
];

export function EngineeringPrinciples() {
  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <p
            className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            06 — Thinking
          </p>
          <h2 className="text-3xl md:text-4xl text-foreground" style={{ fontWeight: 300 }}>
            Engineering Principles
          </h2>
        </div>

        {/* Principles grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {principles.map((p) => (
            <div key={p.number} className="bg-background p-8 hover:bg-muted/20 transition-colors">
              <span
                className="block text-xs text-muted-foreground mb-5"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {p.number}
              </span>
              <h3
                className="text-foreground mb-3"
                style={{ fontSize: "0.95rem", fontWeight: 500 }}
              >
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
