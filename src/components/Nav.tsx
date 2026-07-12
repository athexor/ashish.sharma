import { useState, useEffect } from "react";
import { Sun, Moon, Menu, X } from "lucide-react";

const sections = [
  { label: "Building", href: "#building" },
  { label: "Projects", href: "#projects" },
  { label: "Build Log", href: "#buildlog" },
  { label: "Ideas", href: "#ideas" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "About", href: "#about" },
];

interface NavProps {
  dark: boolean;
  toggleDark: () => void;
}

export function Nav({ dark, toggleDark }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/95 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a
          href="#"
          className="font-mono text-sm tracking-tight text-foreground hover:text-muted-foreground transition-colors font-mono">
          ashish.sharma
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {sections.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <a
            href="#contact"
            className="hidden md:inline-flex items-center px-3 py-1.5 text-xs border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-200"
          >
            Contact
          </a>
          <button
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4">
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {s.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-foreground"
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
