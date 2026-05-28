// Theme tokens for the Daylight prototype.
// Exposes CSS variables so the Tweaks panel can hot-swap accents/density.

(function (global) {
  // Five curated accents. Each is a 'primary' for the indigo-style ramp.
  const ACCENTS = {
    indigo:   { name: "Indigo",   solid: "#5B5BD6", soft: "#EEF0FF", deep: "#3F3FB3", on: "#FFFFFF" },
    emerald:  { name: "Emerald",  solid: "#0E8F5E", soft: "#E6F4EE", deep: "#0A6E48", on: "#FFFFFF" },
    slate:    { name: "Slate",    solid: "#334155", soft: "#EEF2F7", deep: "#1E293B", on: "#FFFFFF" },
    sunset:   { name: "Sunset",   solid: "#C2410C", soft: "#FCEEDC", deep: "#9A330A", on: "#FFFFFF" },
    teal:     { name: "Teal",     solid: "#0E7490", soft: "#E0F2F4", deep: "#0B5A70", on: "#FFFFFF" },
  };

  const DENSITY = {
    comfortable: { rowH: 48, fs: 13, pad: 16, gap: 16 },
    compact:     { rowH: 36, fs: 12, pad: 12, gap: 12 },
  };

  function applyTheme(t) {
    const a = ACCENTS[t.accent] || ACCENTS.indigo;
    const d = DENSITY[t.density] || DENSITY.comfortable;
    const dark = !!t.dark;
    const root = document.documentElement;
    const vars = {
      // surfaces
      "--bg":      dark ? "#0D0E12" : "#F7F7F8",
      "--panel":   dark ? "#16181E" : "#FFFFFF",
      "--panel-2": dark ? "#1B1E25" : "#FAFAFB",
      "--line":    dark ? "#23262E" : "#ECECEE",
      "--line-2":  dark ? "#2A2E37" : "#E4E4E7",
      // text
      "--text":    dark ? "#E6E7EA" : "#0B0B0F",
      "--muted":   dark ? "#9CA3AF" : "#6B7280",
      "--dim":     dark ? "#6B7280" : "#9CA3AF",
      // accent
      "--accent":      a.solid,
      "--accent-soft": dark ? "rgba(91,91,214,0.18)" : a.soft,
      "--accent-deep": a.deep,
      "--accent-on":   a.on,
      // semantic
      "--up":   dark ? "#4ADE80" : "#0E8F5E",
      "--down": dark ? "#F87171" : "#D14545",
      "--warn": dark ? "#FBBF24" : "#A77D24",
      // chart
      "--chart-line": a.solid,
      "--chart-fill": dark ? `${a.solid}26` : `${a.solid}1A`,
      // density
      "--row-h": d.rowH + "px",
      "--fs":    d.fs + "px",
      "--pad":   d.pad + "px",
      "--gap":   d.gap + "px",
      // state colors (constant)
      "--st-nsw": "#5B5BD6",
      "--st-vic": "#7C3AED",
      "--st-qld": "#0E8F5E",
      "--st-wa":  "#D14545",
      "--st-sa":  "#A77D24",
      "--st-tas": "#0891B2",
      "--st-nt":  "#B45309",
      "--st-act": "#64748B",
    };
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.colorScheme = dark ? "dark" : "light";
  }

  function stateColor(code) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--st-${(code || "").toLowerCase()}`) || "#64748B";
  }

  Object.assign(global, { ACCENTS, DENSITY, applyTheme, stateColor });
})(window);
