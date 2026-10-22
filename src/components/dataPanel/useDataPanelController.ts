import { useState, useRef, useMemo, useEffect } from "react";
import { Dataset } from "../../types";
import { inferType } from "../../sampleData";
import { CellFormat, SheetContextMenu, DataPanelProps } from "./types";
import { computeDisplayRows } from "./matrixUtils";
import { useDataPanelHistory } from "./useDataPanelHistory";
import { useFunctionCatalogModal } from "./useFunctionCatalogModal";
import { useSheetSelection } from "./useSheetSelection";
import { useSheetEditing } from "./useSheetEditing";
import { useSheetTableOps } from "./useSheetTableOps";
import { useSheetFormatting } from "./useSheetFormatting";
import { useSheetFillDrag } from "./useSheetFillDrag";
import { useSheetClipboard } from "./useSheetClipboard";
import { useSheetKeyboard } from "./useSheetKeyboard";

export function useDataPanelController({
  dataset,
  onImportFile,
  onEdit,
  onCreateGraphFromColumns,
  showAllRows = false,
}: Pick<DataPanelProps, "dataset" | "onImportFile" | "onEdit" | "onCreateGraphFromColumns" | "showAllRows">) {
  const [dropOver, setDropOver] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [cellFormats, setCellFormats] = useState<Record<string, CellFormat>>({});
  const [contextMenu, setContextMenu] = useState<SheetContextMenu>(null);

  const [activeTableView, setActiveTableView] = useState<"table" | "curve" | "residual" | "outliers">("table");
  const [startMode, setStartMode] = useState<"choose" | "code">("choose");
  const [codeText, setCodeText] = useState("");
  const [codeError, setCodeError] = useState("");
  const [activeRibbonTab, setActiveRibbonTab] = useState<"home" | "insert" | "formulas" | "data">("home");
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [tableZoom, setTableZoom] = useState(100);
  const [fillColorPickerOpen, setFillColorPickerOpen] = useState(false);
  const [textColorPickerOpen, setTextColorPickerOpen] = useState(false);

  const hasGrid = dataset.columns.length > 0;
  const preview = showAllRows ? dataset.rows : dataset.rows.slice(0, 30);

  const historyOps = useDataPanelHistory({
    dataset,
    onEdit,
    gridRef,
  });

  const recalcTypes = (rows: Dataset["rows"], columns = dataset.columns) => {
    const types: Dataset["types"] = {};
    columns.forEach((c) => {
      types[c] = inferType(rows.map((r) => r[c]));
    });
    return types;
  };

  const selOps = useSheetSelection({
    dataset,
    hasGrid,
    selectedColumn: dataset.columns[0] ?? "",
  });

  const selectedColumn = dataset.columns[selOps.selected.c] ?? "";

  const tableOps = useSheetTableOps({
    dataset,
    applyDatasetEdit: historyOps.applyDatasetEdit,
    recalcTypes,
    selected: selOps.selected,
    setSelected: selOps.setSelected,
    setSelectionAnchor: selOps.setSelectionAnchor,
    selectedColumn,
    codeText,
    setCodeError,
  });

  const editOps = useSheetEditing({
    dataset,
    applyDatasetEdit: historyOps.applyDatasetEdit,
    recalcTypes,
    selected: selOps.selected,
    setSelected: selOps.setSelected,
    setSelectionAnchor: selOps.setSelectionAnchor,
    selectCell: selOps.selectCell,
    selectionRange: selOps.selectionRange,
    hasSelection: selOps.hasSelection,
    selectedColumn,
    gridRef,
  });

  const fillDragOps = useSheetFillDrag({
    dataset,
    selectionRange: selOps.selectionRange,
    applyDatasetEdit: historyOps.applyDatasetEdit,
    recalcTypes,
    selectRange: selOps.selectRange,
  });

  const clipboardOps = useSheetClipboard({
    dataset,
    hasGrid,
    selectionRange: selOps.selectionRange,
    selected: selOps.selected,
    applyDatasetEdit: historyOps.applyDatasetEdit,
    recalcTypes,
    setSelected: selOps.setSelected,
    setSelectionAnchor: selOps.setSelectionAnchor,
    nextColumnNameFrom: tableOps.nextColumnNameFrom,
  });

  const formattingOps = useSheetFormatting({
    dataset,
    selectionRange: selOps.selectionRange,
    selectedColumn,
    selected: selOps.selected,
    applyDatasetEdit: historyOps.applyDatasetEdit,
    recalcTypes,
    cellFormats,
    setCellFormats,
    formatKey: selOps.formatKey,
    clearSelectedCells: clipboardOps.clearSelectedCells,
    selectCell: selOps.selectCell,
    setFormulaDraft: editOps.setFormulaDraft,
    hasSelection: selOps.hasSelection,
  });

  const keyboardOps = useSheetKeyboard({
    hasGrid,
    dataset,
    selected: selOps.selected,
    editing: editOps.editing,
    selectCell: selOps.selectCell,
    selectAllCells: selOps.selectAllCells,
    addRow: tableOps.addRow,
    startEdit: editOps.startEdit,
    clearSelectedCells: clipboardOps.clearSelectedCells,
    copySelectedCells: clipboardOps.copySelectedCells,
    cutSelectedCells: clipboardOps.cutSelectedCells,
    undoCellOperation: historyOps.undoCellOperation,
    redoCellOperation: historyOps.redoCellOperation,
    setEditing: editOps.setEditing,
    setDraft: editOps.setDraft,
  });

  const fxOps = useFunctionCatalogModal(editOps.formulaDraft);

  const handleQuickPlot = (colOverride?: string) => {
    const col1 = colOverride || selectedColumn || dataset.columns[0];
    if (!col1) return;
    const col2 = !colOverride && selOps.selectedCols.length >= 2 ? selOps.selectedCols.find((c) => c !== col1) : undefined;
    onCreateGraphFromColumns?.(col1, col2);
  };

  useEffect(() => {
    if (!editOps.formulaFocused && !editOps.editing) {
      editOps.setFormulaDraft(selOps.activeCellValue == null ? "" : String(selOps.activeCellValue));
    }
  }, [selOps.activeCellValue, editOps.editing, editOps.formulaFocused, selOps.selected.r, selOps.selected.c]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  const displayRows = useMemo(() => {
    return computeDisplayRows(preview, tableOps.sort, dataset.types);
  }, [dataset.types, preview, tableOps.sort]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onImportFile(file);
  };

  return {
    dropOver,
    setDropOver,
    handleDrop,
    tableRef,
    gridRef,
    cellFormats,
    contextMenu,
    setContextMenu,
    activeTableView,
    setActiveTableView,
    startMode,
    setStartMode,
    codeText,
    setCodeText,
    codeError,
    setCodeError,
    activeRibbonTab,
    setActiveRibbonTab,
    ribbonCollapsed,
    setRibbonCollapsed,
    tableZoom,
    setTableZoom,
    fillColorPickerOpen,
    setFillColorPickerOpen,
    textColorPickerOpen,
    setTextColorPickerOpen,
    hasGrid,
    preview,
    selOps,
    selectedColumn,
    tableOps,
    editOps,
    fillDragOps,
    clipboardOps,
    formattingOps,
    keyboardOps,
    fxOps,
    handleQuickPlot,
    displayRows,
  };
}
