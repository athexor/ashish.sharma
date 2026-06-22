import { Mail, FileText, ArrowUpRight } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { mockContactData } from "../data/mockContactData";

const iconMap = {
  Github: FaGithub,
  Linkedin: FaLinkedin,
  Mail,
  FileText,
};

const links = mockContactData.map(link => ({
  ...link,
  icon: iconMap[link.icon as keyof typeof iconMap] || FaGithub,
}));

export function Contact() {
  return (
    <section id="contact" className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3 font-mono">
            09 — Connect
          </p>
          <h2 className="text-3xl md:text-4xl text-foreground font-light">
            Contact
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
            Open to conversations about APIs, developer tools, infrastructure, and
            early-stage product ideas. Reach out if you're building something interesting.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid md:grid-cols-2 gap-px bg-border mb-16">
          {links.map(({ label, handle, href, icon: Icon, description }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="bg-background p-8 flex items-start gap-5 group hover:bg-muted/20 transition-colors"
            >
              <div className="mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground" style={{ fontWeight: 500 }}>
                    {label}
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <p
                  className="text-xs text-muted-foreground mb-2"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {handle}
                </p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-border">
          <span
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Ashish Sharma — Backend Software Engineer
          </span>
          <span
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Building in public · {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </section>
  );
}