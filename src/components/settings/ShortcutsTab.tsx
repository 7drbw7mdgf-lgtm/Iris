import { useState, useMemo } from "react";

export interface ShortcutItem {
  id: string;
  category: "Canvas" | "Workspace" | "Data & Shelves" | "Navigation";
  action: string;
  macKey: string[];
  winKey: string[];
  description: string;
}

export const SHORTCUTS: ShortcutItem[] = [
  {
    id: "rerender",
    category: "Canvas",
    action: "Re-render Figure",
    macKey: ["⌘", "R"],
    winKey: ["Ctrl", "R"],
    description: "Force execution of R (ggplot2) or Python (matplotlib/seaborn) to update plot",
  },
  {
    id: "export",
    category: "Canvas",
    action: "Export Figure Dialog",
    macKey: ["⌘", "E"],
    winKey: ["Ctrl", "E"],
    description: "Open high-resolution raster (PNG/JPEG) or vector (SVG/PDF) export dialog",
  },
  {
    id: "palette",
    category: "Canvas",
    action: "Chart Command Palette",
    macKey: ["⌘", "K"],
    winKey: ["Ctrl", "K"],
    description: "Quickly browse and switch between all 50 scientific chart types",
  },
  {
    id: "save",
    category: "Workspace",
    action: "Save Workspace Project",
    macKey: ["⌘", "S"],
    winKey: ["Ctrl", "S"],
    description: "Save current plots, data, overrides, and sheets into a portable .is file",
  },
  {
    id: "open",
    category: "Workspace",
    action: "Open File or Project",
    macKey: ["⌘", "O"],
    winKey: ["Ctrl", "O"],
    description: "Import tabular data (CSV, TSV, XLSX) or load an existing .is project",
  },
  {
    id: "grid",
    category: "Workspace",
    action: "Arrange Dashboard Grid",
    macKey: ["⌘", "G"],
    winKey: ["Ctrl", "G"],
    description: "Automatically balance and arrange dashboard panel items into a 2-column layout",
  },
  {
    id: "settings",
    category: "Navigation",
    action: "Preferences & Settings",
    macKey: ["⌘", ","],
    winKey: ["Ctrl", ","],
    description: "Open Iris preferences, themes, defaults, and runtime diagnostics",
  },
  {
    id: "swap",
    category: "Data & Shelves",
    action: "Swap Axis Shelves",
    macKey: ["⇄"],
    winKey: ["⇄"],
    description: "Instantly swap X and Y shelf variables or toggle vertical/horizontal orientation",
  },
  {
    id: "dismiss",
    category: "Navigation",
    action: "Dismiss / Close Dialog",
    macKey: ["Esc"],
    winKey: ["Esc"],
    description: "Close open palettes, dialogs, drawers, or floating context menus",
  },
];

export function ShortcutsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [shortcutCategory, setShortcutCategory] = useState<string>("All");

  const filteredShortcuts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SHORTCUTS.filter((s) => {
      const matchCat = shortcutCategory === "All" || s.category === shortcutCategory;
      const matchQuery =
        !q ||
        s.action.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.macKey.join("").toLowerCase().includes(q) ||
        s.winKey.join("").toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [searchQuery, shortcutCategory]);

  return (
    <div className="settings-view-panel">
      <div className="shortcuts-filter-bar">
        <input
          type="text"
          className="shortcuts-search-input"
          placeholder="Filter keyboard shortcuts (e.g. render, export, grid)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        <div className="shortcuts-category-pills">
          {["All", "Canvas", "Workspace", "Data & Shelves", "Navigation"].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`shortcut-cat-pill ${shortcutCategory === cat ? "active" : ""}`}
              onClick={() => setShortcutCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="shortcuts-table-wrap">
        <table className="shortcuts-modern-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Category</th>
              <th>Shortcut</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredShortcuts.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.action}</strong></td>
                <td><span className="shortcut-tag">{s.category}</span></td>
                <td>
                  <div className="keycap-cluster">
                    {s.macKey.map((k, i) => (
                      <kbd key={i} className="keycap">{k}</kbd>
                    ))}
                  </div>
                </td>
                <td className="shortcut-desc">{s.description}</td>
              </tr>
            ))}
            {filteredShortcuts.length === 0 && (
              <tr>
                <td colSpan={4} className="shortcuts-empty">
                  No shortcuts match “{searchQuery}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
