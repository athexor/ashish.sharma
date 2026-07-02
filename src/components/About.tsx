export function About() {
  return (
    <section id="about" className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <p
            className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            08 — Background
          </p>
          <h2 className="text-3xl md:text-4xl text-foreground" style={{ fontWeight: 300 }}>
            About
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-16">
          {/* Main narrative */}
          <div className="md:col-span-2 space-y-5">
            <p className="text-base text-foreground leading-relaxed" style={{ fontWeight: 300 }}>
              I'm a backend software engineer who builds products for the internet. My work centers
              on APIs, developer infrastructure, and the systems that make software interoperable
              at scale.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I started writing code because I wanted to build things — and that instinct has never
              changed. Over the years, I've moved from writing scripts to designing distributed
              systems, but the goal is always the same: take a technical problem and reduce it to
              something reliable, observable, and maintainable.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Right now, I'm directing most of my energy toward the API economy — specifically, the
              infrastructure that makes APIs discoverable, usable, and monetizable. I believe APIs
              are one of the most underrated product categories in software, and there's a
              significant gap between what the market needs and what exists today.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              My approach to engineering is shaped by a product mindset. I think about who uses
              a system, what they're trying to accomplish, and how the technical decisions I make
              either enable or constrain them. Good engineering isn't just about correctness —
              it's about building systems that other people can reason about, extend, and trust.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Outside of my primary initiatives, I stay close to adjacent domains: distributed
              systems research, internet infrastructure, developer tooling, and the early stages
              of AI infrastructure. I read broadly and build continuously.
            </p>
          </div>

          {/* Sidebar facts */}
          <div className="space-y-8">
            <div>
              <p
                className="text-xs text-muted-foreground tracking-widest uppercase mb-4 font-mono">
                Currently
              </p>
              <ul className="space-y-2">
                {[
                  "Building API Marketplace",
                  "Exploring developer tooling",
                  "Writing in public",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-foreground shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p
                className="text-xs text-muted-foreground tracking-widest uppercase mb-4"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Technologies
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Node.js", "Python", "Go", "PostgreSQL",
                  "Redis", "Docker", "AWS", "TypeScript",
                  "REST APIs", "GraphQL",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="text-xs text-muted-foreground border border-border px-2 py-1 font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p
                className="text-xs text-muted-foreground tracking-widest uppercase mb-4"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Reading
              </p>
              <ul className="space-y-2">
                {[
                  "Designing Data-Intensive Applications",
                  "The Art of Doing Science & Engineering",
                  "Zero to One",
                ].map((book) => (
                  <li key={book} className="text-sm text-muted-foreground leading-snug">
                    {book}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
