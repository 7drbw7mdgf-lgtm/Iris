import { useIrisState } from "./app/hooks/useIrisState";
import { useIrisProps } from "./app/hooks/useIrisProps";
import { TopMenuBar } from "./app/components/TopMenuBar";
import { LeftRail } from "./app/components/LeftRail";
import { WorkspaceMainView } from "./app/components/WorkspaceMainView";
import { RightInspectorRail } from "./app/components/RightInspectorRail";
import { AppModals } from "./app/modals/AppModals";
import { ChartTypePaletteModal } from "./app/modals/ChartTypePaletteModal";

export default function App() {
  const state = useIrisState();
  const props = useIrisProps(state);

  return (
    <div
      className="app iris-shell"
      data-theme={state.theme}
      data-paper-canvas={state.settings.paperCanvas ? "true" : "false"}
      data-paper-tone={state.settings.paperCanvasTone || "white"}
      data-canvas-shadow={state.settings.canvasShadow || "soft"}
      data-ui-density={state.settings.uiDensity}
    >
      <TopMenuBar {...props.topMenuBarProps} />
      <div className="app-body">
        <LeftRail {...props.leftRailProps} />
        <WorkspaceMainView {...props.workspaceMainViewProps} />
        <RightInspectorRail {...props.rightInspectorRailProps} />
      </div>
      <AppModals {...props.appModalsProps} />
      <ChartTypePaletteModal {...props.chartPaletteModalProps} />
      {state.actionNotice && <div className="action-toast">{state.actionNotice}</div>}
    </div>
  );
}
