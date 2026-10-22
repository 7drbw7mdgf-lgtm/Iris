import { ComponentProps } from "react";
import { RibbonHomeTab } from "./RibbonHomeTab";
import { RibbonOtherTabs } from "./RibbonOtherTabs";

type HomeTabProps = ComponentProps<typeof RibbonHomeTab>;
type OtherTabsProps = ComponentProps<typeof RibbonOtherTabs>;

type DataPanelRibbonProps = HomeTabProps & Omit<OtherTabsProps, "activeRibbonTab"> & {
  activeRibbonTab: "home" | "insert" | "formulas" | "data";
  setActiveRibbonTab: (tab: "home" | "insert" | "formulas" | "data") => void;
  ribbonCollapsed: boolean;
  setRibbonCollapsed: (collapsed: boolean) => void;
};

export function DataPanelRibbon(props: DataPanelRibbonProps) {
  const {
    activeRibbonTab,
    setActiveRibbonTab,
    ribbonCollapsed,
    setRibbonCollapsed,
  } = props;

  return (
    <>
      {/* Excel Ribbon Tabs */}
      <div className="excel-ribbon-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeRibbonTab === "home"}
          className={`excel-ribbon-tab ${activeRibbonTab === "home" ? "active" : ""}`}
          onClick={() => setActiveRibbonTab("home")}
        >
          Home
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeRibbonTab === "insert"}
          className={`excel-ribbon-tab ${activeRibbonTab === "insert" ? "active" : ""}`}
          onClick={() => setActiveRibbonTab("insert")}
        >
          Insert
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeRibbonTab === "formulas"}
          className={`excel-ribbon-tab ${activeRibbonTab === "formulas" ? "active" : ""}`}
          onClick={() => setActiveRibbonTab("formulas")}
        >
          Formulas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeRibbonTab === "data"}
          className={`excel-ribbon-tab ${activeRibbonTab === "data" ? "active" : ""}`}
          onClick={() => setActiveRibbonTab("data")}
        >
          Data
        </button>
        <button
          type="button"
          className="excel-ribbon-toggle-btn"
          onClick={() => setRibbonCollapsed(!ribbonCollapsed)}
          title={ribbonCollapsed ? "Expand ribbon toolbar" : "Collapse ribbon toolbar to save space"}
          aria-label={ribbonCollapsed ? "Expand ribbon toolbar" : "Collapse ribbon toolbar"}
        >
          {ribbonCollapsed ? "▾" : "▴"}
        </button>
      </div>

      {/* Excel Ribbon Toolbar Content */}
      {!ribbonCollapsed && (
        <div className="sheet-ribbon excel-ribbon" aria-label="Spreadsheet ribbon toolbar">
          {activeRibbonTab === "home" ? (
            <RibbonHomeTab {...props} />
          ) : (
            <RibbonOtherTabs {...props} activeRibbonTab={activeRibbonTab as "insert" | "formulas" | "data"} />
          )}
        </div>
      )}
    </>
  );
}
