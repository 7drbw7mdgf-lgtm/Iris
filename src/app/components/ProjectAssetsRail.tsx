import { ProjectAssetCard } from "../types";
import { assetKindGlyph } from "../graphStateUtils";

export interface ProjectAssetsRailProps {
  projectAssetsOpen: boolean;
  setProjectAssetsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  projectAssetCards: ProjectAssetCard[];
  filteredProjectAssetCards: ProjectAssetCard[];
  projectAssetSearch: string;
  setProjectAssetSearch: (val: string) => void;
}

export function ProjectAssetsRail({
  projectAssetsOpen,
  setProjectAssetsOpen,
  projectAssetCards,
  filteredProjectAssetCards,
  projectAssetSearch,
  setProjectAssetSearch,
}: ProjectAssetsRailProps) {
  const backendOrder = [
    "Data tables",
    "Visual figures",
    "Code figures",
    "Stats sheets",
    "Stats results",
    "Dashboard collections",
    "Dashboard-only items",
  ];

  const backendGroups = Array.from(
    filteredProjectAssetCards.reduce((map, card) => {
      const cards = map.get(card.backend) || [];
      cards.push(card);
      map.set(card.backend, cards);
      return map;
    }, new Map<string, ProjectAssetCard[]>())
  ).sort(([a], [b]) => {
    const aIndex = backendOrder.indexOf(a);
    const bIndex = backendOrder.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1)
      return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
    return a.localeCompare(b);
  });

  return (
    <div className={`rail-card rail-assets ${projectAssetsOpen ? "" : "collapsed"}`}>
      <button
        className="rail-card-head rail-card-toggle"
        type="button"
        onClick={() => setProjectAssetsOpen((open) => !open)}
        aria-expanded={projectAssetsOpen}
      >
        <span>
          <span className="rail-collapse-chev" aria-hidden="true">
            {projectAssetsOpen ? "⌄" : "›"}
          </span>{" "}
          Project items
        </span>
        <em>{projectAssetCards.length}</em>
      </button>
      {projectAssetsOpen && (
        <div className="rail-assets-body">
          <label className="rail-asset-search">
            <span>Find anything</span>
            <input
              value={projectAssetSearch}
              onChange={(e) => setProjectAssetSearch(e.target.value)}
              placeholder="Search data, figures, stats, files..."
            />
          </label>
          <div className="rail-assets-summary">
            <strong>{projectAssetCards.length}</strong>
            <span>
              searchable project item{projectAssetCards.length === 1 ? "" : "s"} across data, figures, stats, and dashboard content
            </span>
          </div>
          {backendGroups.map(([backend, cards]) => {
            return (
              <div className="rail-asset-group" key={backend}>
                <div className="rail-asset-group-title">
                  <span>{backend}</span>
                  <em>{cards.length}</em>
                </div>
                {cards.map((card) => (
                  <article className={`rail-asset-card ${card.hidden ? "hidden-asset" : ""}`} key={card.id}>
                    <button type="button" className="rail-asset-main" onClick={card.open}>
                      <span className={`rail-asset-kind kind-${card.kind}`} aria-hidden="true">
                        {assetKindGlyph(card.kind)}
                      </span>
                      <span>
                        <strong>{card.title}</strong>
                        <em>{card.meta}</em>
                        <small>{card.source}</small>
                      </span>
                    </button>
                    <div className="rail-asset-actions">
                      {card.addToDashboard && <button type="button" onClick={card.addToDashboard}>Place</button>}
                      {card.copy && <button type="button" onClick={card.copy}>Copy</button>}
                    </div>
                  </article>
                ))}
              </div>
            );
          })}
          {filteredProjectAssetCards.length === 0 && <p className="muted small">No project items match that search.</p>}
        </div>
      )}
    </div>
  );
}
