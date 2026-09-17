"use client";

import { useEffect, useState } from "react";

type Palette = "oxblood" | "orange";

const palettes: { name: Palette; label: string }[] = [
  { name: "oxblood", label: "Oxblood" },
  { name: "orange", label: "Orange" },
];

export function V2PalettePicker() {
  const [selected, setSelected] = useState<Palette>("oxblood");

  useEffect(() => {
    const root = document.documentElement;
    const syncPalette = () => setSelected(root.dataset.v2Palette === "orange" ? "orange" : "oxblood");

    try {
      root.dataset.v2Palette = localStorage.getItem("portfolio-v2-palette") === "orange" ? "orange" : "oxblood";
    } catch {
      root.dataset.v2Palette = "oxblood";
    }
    syncPalette();

    const observer = new MutationObserver(syncPalette);
    observer.observe(root, { attributes: true, attributeFilter: ["data-v2-palette"] });
    return () => observer.disconnect();
  }, []);

  const selectPalette = (palette: Palette) => {
    document.documentElement.setAttribute("data-v2-palette", palette);
    setSelected(palette);
    try {
      localStorage.setItem("portfolio-v2-palette", palette);
    } catch { /* Keep the current-session palette. */ }
  };

  return (
    <div className="v2-palette-picker" role="group" aria-label="Version 2 color palette">
      <span className="v2-palette-picker__label">Palette</span>
      <div className="v2-palette-picker__options">
        {palettes.map(({ name, label }) => (
          <button
            key={name}
            type="button"
            className={`v2-palette-picker__option v2-palette-picker__option--${name}`}
            aria-pressed={selected === name}
            onClick={() => selectPalette(name)}
          >
            <span className="v2-palette-picker__swatch" aria-hidden="true" />{label}
          </button>
        ))}
      </div>
    </div>
  );
}
