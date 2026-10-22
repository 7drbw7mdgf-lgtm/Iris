import React from "react";
import { Dataset, FriendlyRenderIssue, UserSettings } from "../../types";
import { RendererStatus } from "../../tauri";
import {
  CodePostDialogState,
  ExportDialogState,
  DashboardExportDialogState,
  DataImportPreview,
  ExportSuccessState,
  WorkspaceTab,
  GraphState,
  DashboardItem,
} from "../types";
import SettingsModal from "../../components/SettingsModal";
import { CodePostDialog } from "./CodePostDialog";
import { ExportModal } from "./ExportModal";
import { DashboardExportModal } from "./DashboardExportModal";
import { SaveProjectDialog } from "./SaveProjectDialog";
import { DataImportPreviewModal } from "./DataImportPreviewModal";
import { ExportSuccessModal } from "./ExportSuccessModal";
import { RendererStatusModal } from "./RendererStatusModal";

export interface AppModalsProps {
  codePostDialog: CodePostDialogState;
  setCodePostDialog: React.Dispatch<React.SetStateAction<CodePostDialogState>>;
  createGraphFromPostedCode: () => void;

  exportDialog: ExportDialogState;
  setExportDialog: React.Dispatch<React.SetStateAction<ExportDialogState>>;
  activeGraph: GraphState;
  dataset: Dataset;
  isPlotlyLibrary: boolean;
  renderExportPreview: (settings: ExportDialogState) => void;
  confirmExportFigure: () => void;

  dashboardExportDialog: DashboardExportDialogState;
  setDashboardExportDialog: React.Dispatch<React.SetStateAction<DashboardExportDialogState>>;
  beginDashboardExportSelection: () => void;
  renderDashboardExportPreview: (settings: DashboardExportDialogState) => void;
  confirmDashboardExport: () => void;

  saveProjectDialogOpen: boolean;
  setSaveProjectDialogOpen: (open: boolean) => void;
  workspaceTabs: WorkspaceTab[];
  graphStates: Record<string, GraphState>;
  dashboardItems: DashboardItem[];
  confirmSaveProject: () => void;

  dataImportPreview: DataImportPreview | null;
  setDataImportPreview: (preview: DataImportPreview | null) => void;
  updateDataImportColumnType: (column: string, type: Dataset["types"][string]) => void;
  confirmDataImportPreview: () => void;

  exportSuccess: ExportSuccessState;
  setExportSuccess: (state: ExportSuccessState) => void;
  openSavedExportLocation: () => void;
  notify: (msg: string) => void;

  rendererPanelOpen: boolean;
  setRendererPanelOpen: (open: boolean) => void;
  rendererInfo: RendererStatus | null;
  rendererError: string;
  renderError: FriendlyRenderIssue | null;
  rendererBusy: string;
  refreshRendererStatus: () => void;
  runRendererRepair: (which: "python" | "svglite") => void;

  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  settings: UserSettings;
  handleSaveSettings: (patch: Partial<UserSettings>) => void;
  handleResetSettings: () => void;
}

export function AppModals(props: AppModalsProps) {
  return (
    <>
      <CodePostDialog
        dialog={props.codePostDialog}
        setDialog={props.setCodePostDialog}
        onCreateGraph={props.createGraphFromPostedCode}
      />

      <ExportModal
        exportDialog={props.exportDialog}
        setExportDialog={props.setExportDialog}
        activeGraph={props.activeGraph}
        dataset={props.dataset}
        isPlotlyLibrary={props.isPlotlyLibrary}
        onRenderPreview={props.renderExportPreview}
        onConfirmExport={props.confirmExportFigure}
      />

      <DashboardExportModal
        dashboardExportDialog={props.dashboardExportDialog}
        setDashboardExportDialog={props.setDashboardExportDialog}
        dataset={props.dataset}
        onBeginSelection={props.beginDashboardExportSelection}
        onRenderPreview={props.renderDashboardExportPreview}
        onConfirmExport={props.confirmDashboardExport}
      />

      <SaveProjectDialog
        open={props.saveProjectDialogOpen}
        onClose={() => props.setSaveProjectDialogOpen(false)}
        dataset={props.dataset}
        workspaceTabs={props.workspaceTabs}
        graphStates={props.graphStates}
        dashboardItems={props.dashboardItems}
        onConfirmSave={props.confirmSaveProject}
      />

      <DataImportPreviewModal
        dataImportPreview={props.dataImportPreview}
        onClose={() => props.setDataImportPreview(null)}
        updateDataImportColumnType={props.updateDataImportColumnType}
        confirmDataImportPreview={props.confirmDataImportPreview}
      />

      <ExportSuccessModal
        exportSuccess={props.exportSuccess}
        onClose={() => props.setExportSuccess({ open: false, path: "" })}
        onOpenFolder={props.openSavedExportLocation}
        notify={props.notify}
      />

      <RendererStatusModal
        open={props.rendererPanelOpen}
        onClose={() => props.setRendererPanelOpen(false)}
        rendererInfo={props.rendererInfo}
        rendererError={props.rendererError}
        renderError={props.renderError}
        rendererBusy={props.rendererBusy}
        onRefreshRenderer={props.refreshRendererStatus}
        onRepair={props.runRendererRepair}
      />

      <SettingsModal
        open={props.settingsModalOpen}
        onClose={() => props.setSettingsModalOpen(false)}
        settings={props.settings}
        onSaveSettings={props.handleSaveSettings}
        onResetSettings={props.handleResetSettings}
        rendererInfo={props.rendererInfo}
        onRefreshRenderer={() => void props.refreshRendererStatus()}
        onRepairPython={() => props.runRendererRepair("python")}
      />
    </>
  );
}
