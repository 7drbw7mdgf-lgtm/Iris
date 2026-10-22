import { DataPanelProps } from "./dataPanel/types";
import { BridgeBar } from "./dataPanel/BridgeBar";
import { DataPanelRibbon } from "./dataPanel/DataPanelRibbon";
import { DataPanelFormulaBar } from "./dataPanel/DataPanelFormulaBar";
import { DataPanelEmptyState } from "./dataPanel/DataPanelEmptyState";
import { DataPanelGrid } from "./dataPanel/DataPanelGrid";
import { DataPanelStatusBar } from "./dataPanel/DataPanelStatusBar";
import { FieldsPanel } from "./dataPanel/FieldsPanel";
import { DataPanelModals } from "./dataPanel/DataPanelModals";
import { useDataPanelController } from "./dataPanel/useDataPanelController";

export type { LinkedGraphInfo } from "./dataPanel/types";

export default function DataPanel(props: DataPanelProps) {
  const {
    dataset,
    onCreateGraphFromCode,
    collapsed,
    showAllRows = false,
    showFields = true,
    linkedGraphs,
    activeGraphId,
    onOpenGraph,
    onAssignColumnToShelf,
  } = props;

  const ctrl = useDataPanelController(props);

  const tableTitle = dataset.name?.trim() || "Table of data";
  const tableViewLabel =
    ctrl.activeTableView === "table"
      ? "Table of data"
      : ctrl.activeTableView === "curve"
      ? "Curve"
      : ctrl.activeTableView === "residual"
      ? "Residual plot"
      : "Outliers";

  return (
    <div
      className={`data-panel ${collapsed ? "collapsed" : ""} ${ctrl.dropOver ? "drop-over" : ""}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          ctrl.setDropOver(true);
        }
      }}
      onDragLeave={() => ctrl.setDropOver(false)}
      onDrop={ctrl.handleDrop}
    >
      <div className="data-head">
        {!collapsed && (
          <div>
            <div className="data-name">{dataset.name}</div>
            <div className="muted small">{dataset.rows.length} rows · {dataset.columns.length} cols</div>
          </div>
        )}
      </div>

      {!collapsed && (
        <BridgeBar
          linkedGraphs={linkedGraphs}
          activeGraphId={activeGraphId}
          onOpenGraph={onOpenGraph}
          selectedColumn={ctrl.selectedColumn}
          onAssignColumnToShelf={onAssignColumnToShelf}
          selectedCols={ctrl.selOps.selectedCols}
          dataset={dataset}
          handleQuickPlot={ctrl.handleQuickPlot}
        />
      )}

      {!collapsed && (
        <div className="sheet-shell">
          <DataPanelRibbon
            activeRibbonTab={ctrl.activeRibbonTab}
            setActiveRibbonTab={ctrl.setActiveRibbonTab}
            ribbonCollapsed={ctrl.ribbonCollapsed}
            setRibbonCollapsed={ctrl.setRibbonCollapsed}
            hasGrid={ctrl.hasGrid}
            hasSelection={ctrl.selOps.hasSelection}
            selected={ctrl.selOps.selected}
            cellFormats={ctrl.cellFormats}
            formatKey={ctrl.selOps.formatKey}
            pasteFromClipboard={ctrl.clipboardOps.pasteFromClipboard}
            cutSelectedCells={ctrl.clipboardOps.cutSelectedCells}
            copySelectedCells={ctrl.clipboardOps.copySelectedCells}
            toggleSelectionFormat={ctrl.formattingOps.toggleSelectionFormat}
            applyAlignment={ctrl.formattingOps.applyAlignment}
            applyNumberFormat={ctrl.formattingOps.applyNumberFormat}
            adjustDecimals={ctrl.formattingOps.adjustDecimals}
            addRow={ctrl.tableOps.addRow}
            addColumn={ctrl.tableOps.addColumn}
            deleteRow={ctrl.tableOps.deleteRow}
            deleteColumn={ctrl.tableOps.deleteColumn}
            selectedColumn={ctrl.selectedColumn}
            dataset={dataset}
            applyAutoSum={ctrl.formattingOps.applyAutoSum}
            fillSelection={ctrl.fillDragOps.fillSelection}
            selectionRange={ctrl.selOps.selectionRange}
            clearSelection={ctrl.formattingOps.clearSelection}
            sortColumn={ctrl.tableOps.sortColumn}
            fillColorPickerOpen={ctrl.fillColorPickerOpen}
            setFillColorPickerOpen={ctrl.setFillColorPickerOpen}
            textColorPickerOpen={ctrl.textColorPickerOpen}
            setTextColorPickerOpen={ctrl.setTextColorPickerOpen}
            handleQuickPlot={ctrl.handleQuickPlot}
            insertRowAbove={ctrl.tableOps.insertRowAbove}
            setFxModalOpen={ctrl.fxOps.setFxModalOpen}
            insertFunctionTemplate={ctrl.formattingOps.insertFunctionTemplate}
            applyFormulaValue={ctrl.editOps.applyFormulaValue}
            sort={ctrl.tableOps.sort}
            setSort={ctrl.tableOps.setSort}
            fillMissing={ctrl.formattingOps.fillMissing}
            setColumnType={ctrl.tableOps.setColumnType}
            autoFitColumn={ctrl.tableOps.autoFitColumn}
          />

          {dataset.columns.length > 0 && (
            <DataPanelFormulaBar
              selectedRangeAddress={ctrl.selOps.selectedRangeAddress}
              formulaFocused={ctrl.editOps.formulaFocused}
              editing={ctrl.editOps.editing}
              activeCellValue={ctrl.selOps.activeCellValue}
              setFormulaDraft={ctrl.editOps.setFormulaDraft}
              setFormulaFocused={ctrl.editOps.setFormulaFocused}
              setEditing={ctrl.editOps.setEditing}
              focusGrid={() => ctrl.gridRef.current?.focus()}
              applyFormulaValue={ctrl.editOps.applyFormulaValue}
              hasSelection={ctrl.selOps.hasSelection}
              setFxModalOpen={ctrl.fxOps.setFxModalOpen}
              formulaDraft={ctrl.editOps.formulaDraft}
              selectionSummary={ctrl.selOps.selectionSummary}
              activeFunctionHint={ctrl.fxOps.activeFunctionHint}
            />
          )}

          {dataset.columns.length === 0 ? (
            <DataPanelEmptyState
              startMode={ctrl.startMode}
              setStartMode={ctrl.setStartMode}
              createStarterTable={ctrl.tableOps.createStarterTable}
              pasteFromClipboard={ctrl.clipboardOps.pasteFromClipboard}
              codeText={ctrl.codeText}
              setCodeText={ctrl.setCodeText}
              codeError={ctrl.codeError}
              setCodeError={ctrl.setCodeError}
              onCreateGraphFromCode={onCreateGraphFromCode}
              applyCodeData={ctrl.tableOps.applyCodeData}
            />
          ) : (
            <DataPanelGrid
              gridRef={ctrl.gridRef}
              tableRef={ctrl.tableRef}
              handleGridKeyDown={ctrl.keyboardOps.handleGridKeyDown}
              handlePaste={ctrl.clipboardOps.handlePaste}
              setDragSelecting={ctrl.selOps.setDragSelecting}
              completeFillDrag={ctrl.fillDragOps.completeFillDrag}
              activeTableView={ctrl.activeTableView}
              setActiveTableView={ctrl.setActiveTableView}
              tableTitle={tableTitle}
              tableViewLabel={tableViewLabel}
              tableWidth={ctrl.tableOps.tableWidth}
              tableZoom={ctrl.tableZoom}
              dataset={dataset}
              columnWidth={ctrl.tableOps.columnWidth}
              selectAllCells={ctrl.selOps.selectAllCells}
              setContextMenu={ctrl.setContextMenu}
              selectionRange={ctrl.selOps.selectionRange}
              selectWholeColumn={ctrl.selOps.selectWholeColumn}
              selectWholeRow={ctrl.selOps.selectWholeRow}
              resizeDragRef={ctrl.tableOps.resizeDragRef}
              setDragCol={ctrl.tableOps.setDragCol}
              setOverCol={ctrl.tableOps.setOverCol}
              dragCol={ctrl.tableOps.dragCol}
              overCol={ctrl.tableOps.overCol}
              reorderColumn={ctrl.tableOps.reorderColumn}
              columnDrafts={ctrl.tableOps.columnDrafts}
              setColumnDrafts={ctrl.tableOps.setColumnDrafts}
              selectCell={ctrl.selOps.selectCell}
              selected={ctrl.selOps.selected}
              renameColumn={ctrl.tableOps.renameColumn}
              sort={ctrl.tableOps.sort}
              toggleSort={ctrl.tableOps.toggleSort}
              startColumnResize={ctrl.tableOps.startColumnResize}
              autoFitColumn={ctrl.tableOps.autoFitColumn}
              displayRows={ctrl.displayRows}
              cellFormats={ctrl.cellFormats}
              formatKey={ctrl.selOps.formatKey}
              isInRange={ctrl.selOps.isInRange}
              isInCopiedRange={ctrl.clipboardOps.isInCopiedRange}
              copiedRange={ctrl.clipboardOps.copiedRange}
              isInFillPreview={ctrl.fillDragOps.isInFillPreview}
              isInvalidCell={ctrl.formattingOps.isInvalidCell}
              fillDrag={ctrl.fillDragOps.fillDrag}
              updateFillTarget={ctrl.fillDragOps.updateFillTarget}
              dragSelecting={ctrl.selOps.dragSelecting}
              startEdit={ctrl.editOps.startEdit}
              editing={ctrl.editOps.editing}
              draft={ctrl.editOps.draft}
              setDraft={ctrl.editOps.setDraft}
              setFormulaDraft={ctrl.editOps.setFormulaDraft}
              commitEdit={ctrl.editOps.commitEdit}
              setEditing={ctrl.editOps.setEditing}
              applyClipboardMatrix={ctrl.clipboardOps.applyClipboardMatrix}
              startFillHandleDrag={ctrl.fillDragOps.startFillHandleDrag}
              preview={ctrl.preview}
            />
          )}

          <DataPanelStatusBar
            editing={ctrl.editOps.editing}
            selectedRangeAddress={ctrl.selOps.selectedRangeAddress}
            selectedCellCount={ctrl.selOps.selectedCellCount}
            selectionAverage={ctrl.selOps.selectionAverage}
            selectionFilledCount={ctrl.selOps.selectionFilledCount}
            selectedMissingCount={ctrl.selOps.selectedMissingCount}
            selectionNumericValues={ctrl.selOps.selectionNumericValues}
            selectionMin={ctrl.selOps.selectionMin}
            selectionMax={ctrl.selOps.selectionMax}
            selectionSum={ctrl.selOps.selectionSum}
            tableZoom={ctrl.tableZoom}
            setTableZoom={ctrl.setTableZoom}
          />
        </div>
      )}

      {!collapsed && showFields && !showAllRows && dataset.columns.length > 0 && (
        <FieldsPanel
          dataset={dataset}
          dragCol={ctrl.tableOps.dragCol}
          setDragCol={ctrl.tableOps.setDragCol}
          overCol={ctrl.tableOps.overCol}
          setOverCol={ctrl.tableOps.setOverCol}
          reorderColumn={ctrl.tableOps.reorderColumn}
        />
      )}

      <DataPanelModals
        contextMenu={ctrl.contextMenu}
        setContextMenu={ctrl.setContextMenu}
        dataset={dataset}
        handleQuickPlot={ctrl.handleQuickPlot}
        onAssignColumnToShelf={onAssignColumnToShelf}
        copySelectedCells={ctrl.clipboardOps.copySelectedCells}
        cutSelectedCells={ctrl.clipboardOps.cutSelectedCells}
        selectionRange={ctrl.selOps.selectionRange}
        pasteFromClipboard={ctrl.clipboardOps.pasteFromClipboard}
        insertRowAbove={ctrl.tableOps.insertRowAbove}
        addRow={ctrl.tableOps.addRow}
        deleteRow={ctrl.tableOps.deleteRow}
        insertColumnAt={ctrl.tableOps.insertColumnAt}
        autoFitColumn={ctrl.tableOps.autoFitColumn}
        deleteColumn={ctrl.tableOps.deleteColumn}
        setColumnType={ctrl.tableOps.setColumnType}
        toggleSelectionFormat={ctrl.formattingOps.toggleSelectionFormat}
        fillMissing={ctrl.formattingOps.fillMissing}
        clearSelectedCells={ctrl.clipboardOps.clearSelectedCells}
        pasteDialog={ctrl.clipboardOps.pasteDialog}
        setPasteDialog={ctrl.clipboardOps.setPasteDialog}
        submitPasteDialog={ctrl.clipboardOps.submitPasteDialog}
        fxModalOpen={ctrl.fxOps.fxModalOpen}
        setFxModalOpen={ctrl.fxOps.setFxModalOpen}
        fxSearchTerm={ctrl.fxOps.fxSearchTerm}
        setFxSearchTerm={ctrl.fxOps.setFxSearchTerm}
        fxCategory={ctrl.fxOps.fxCategory}
        setFxCategory={ctrl.fxOps.setFxCategory}
        filteredFunctions={ctrl.fxOps.filteredFunctions}
        selectedFx={ctrl.fxOps.selectedFx}
        setSelectedFx={ctrl.fxOps.setSelectedFx}
        insertFunctionTemplate={ctrl.formattingOps.insertFunctionTemplate}
      />
    </div>
  );
}
