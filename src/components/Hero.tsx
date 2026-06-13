import { ArrowUpRight, Github, Linkedin, FileText } from "lucide-react";

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center pt-14">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 mb-12">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
            <span
              className="text-xs text-muted-foreground tracking-widest uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Available for select projects
            </span>
          </div>

          {/* Name */}
          <h1
            className="text-5xl md:text-7xl tracking-tight text-foreground mb-4 leading-none"
            style={{ fontWeight: 300, letterSpacing: "-0.03em" }}
          >
            Ashish Sharma
          </h1>

          {/* Role */}
          <p
            className="text-base text-muted-foreground mb-8 tracking-wide"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
          >
            Backend Software Engineer
          </p>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-foreground mb-6 max-w-xl leading-relaxed" style={{ fontWeight: 300 }}>
            Building APIs, developer tools, and internet products.
          </p>

          {/* Subtext */}
          <p className="text-sm text-muted-foreground mb-12 max-w-xl leading-relaxed">
            Currently building products at the intersection of software engineering,
            APIs, automation, and internet infrastructure.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <a
              href="#projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-80 transition-opacity"
            >
              View Projects
              <ArrowUpRight size={14} />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-foreground text-sm hover:bg-muted transition-colors"
            >
              <FileText size={14} />
              Resume
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-foreground text-sm hover:bg-muted transition-colors"
            >
              <Github size={14} />
              GitHub
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-foreground text-sm hover:bg-muted transition-colors"
            >
              <Linkedin size={14} />
              LinkedIn
            </a>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="mt-24 pt-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "3+", label: "Years building" },
            { value: "12+", label: "Projects shipped" },
            { value: "5", label: "Active initiatives" },
            { value: "∞", label: "Ideas in queue" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                className="text-2xl text-foreground mb-1"
                style={{ fontWeight: 300 }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs text-muted-foreground tracking-wide"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
