import { ArrowUpRight } from "lucide-react";
import { FaGithub as Github} from "react-icons/fa6";
import { useState } from "react";

const projects = [
  {
    id: "01",
    name: "API Gateway Engine",
    tagline: "High-performance request routing and rate limiting for distributed APIs",
    description:
      "Built a custom API gateway supporting multi-tenant routing, JWT authentication, per-key rate limiting, and real-time usage analytics. Handles thousands of concurrent connections with sub-10ms overhead.",
    features: [
      "Multi-tenant request routing with namespace isolation",
      "Sliding window rate limiting with Redis",
      "JWT + API key dual authentication",
      "Real-time usage dashboards via WebSocket",
    ],
    stack: ["Node.js", "Redis", "PostgreSQL", "Docker", "Nginx"],
    challenge:
      "Achieving consistent sub-10ms latency under burst traffic while maintaining accurate per-tenant rate limiting across distributed nodes.",
    github: "#",
    live: "#",
  },
  {
    id: "03",
    name: "Dev Environment CLI",
    tagline: "One-command local service orchestration for development teams",
    description:
      "A CLI tool that reads a declarative YAML config to spin up, configure, and connect local services — databases, queues, mock APIs — into a consistent dev environment across machines.",
    features: [
      "YAML-first declarative environment definition",
      "Automatic port conflict resolution",
      "Health checks and dependency ordering",
      "Cross-platform Docker Compose generation",
    ],
    stack: ["Go", "Docker", "YAML", "Shell"],
    challenge:
      "Handling dependency ordering and circular service dependencies while keeping the configuration schema simple enough for non-DevOps engineers.",
    github: "#",
    live: null,
  },
];

export function FeaturedProjects() {
  const [expanded, setExpanded] = useState<string | null>("01");

  return (
    <section id="projects" className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <p
            className="text-xs text-muted-foreground tracking-widest uppercase mb-3 font-mono">
            02 — Work
          </p>
          <h2 className="text-3xl md:text-4xl text-foreground" style={{ fontWeight: 300 }}>
            Featured Projects
          </h2>
        </div>

        {/* Project list */}
        <div className="space-y-px bg-border">
          {projects.map((project) => {
            const isOpen = expanded === project.id;
            return (
              <div key={project.id} className="bg-background">
                {/* Project header — always visible */}
                <button
                  className="w-full text-left p-8 flex items-start justify-between gap-4 hover:bg-muted/20 transition-colors group"
                  onClick={() => setExpanded(isOpen ? null : project.id)}
                >
                  <div className="flex items-start gap-6 flex-1 min-w-0">
                    <span
                      className="text-xs text-muted-foreground mt-1 shrink-0"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {project.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-foreground mb-1"
                        style={{ fontSize: "1.1rem", fontWeight: 400 }}
                      >
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {project.tagline}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden md:flex gap-2">
                      {project.stack.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-xs text-muted-foreground"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span
                      className="text-muted-foreground transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-8 pb-8 border-t border-border">
                    <div className="pl-12 pt-8 grid md:grid-cols-3 gap-8">
                      {/* Left: description + features */}
                      <div className="md:col-span-2 space-y-6">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {project.description}
                        </p>

                        <div>
                          <p
                            className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            Key Features
                          </p>
                          <ul className="space-y-2">
                            {project.features.map((f) => (
                              <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                                <span className="text-muted-foreground mt-0.5">—</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p
                            className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            Challenge Solved
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {project.challenge}
                          </p>
                        </div>
                      </div>

                      {/* Right: stack + links */}
                      <div className="space-y-6">
                        <div>
                          <p
                            className="text-xs text-muted-foreground tracking-widest uppercase mb-3 font-mono">
                            Stack
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {project.stack.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-1 border border-border text-xs text-muted-foreground"
                                style={{ fontFamily: "var(--font-mono)" }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p
                            className="text-xs text-muted-foreground tracking-widest uppercase mb-3"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            Links
                          </p>
                          <div className="flex flex-col gap-2">
                            <a
                              href={project.github}
                              className="inline-flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
                            >
                              <Github size={14} />
                              View Source
                            </a>
                            {project.live && (
                              <a
                                href={project.live}
                                className="inline-flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
                              >
                                <ArrowUpRight size={14} />
                                Live Demo
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
