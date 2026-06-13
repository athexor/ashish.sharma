import { useState, useEffect } from "react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { CurrentlyBuilding } from "./components/CurrentlyBuilding";
import { FeaturedProjects } from "./components/FeaturedProjects";
import { BuildLog } from "./components/BuildLog";
import { IdeasVault } from "./components/IdeasVault";
import { Roadmap } from "./components/Roadmap";
import { EngineeringPrinciples } from "./components/EngineeringPrinciples";
import { TechnicalInterests } from "./components/TechnicalInterests";
import { About } from "./components/About";
import { Contact } from "./components/Contact";

export default function App() {
  {/* MARKER-MAKE-KIT-INVOKED */}
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <div
      className="min-h-screen bg-background text-foreground antialiased"
          >
      <Nav dark={dark} toggleDark={() => setDark((d) => !d)} />

      <main>
        <Hero />
        <CurrentlyBuilding />
        <FeaturedProjects />
        <BuildLog />
        <IdeasVault />
        <Roadmap />
        <EngineeringPrinciples />
        <TechnicalInterests />
        <About />
        <Contact />
      </main>
    </div>
  );
}
