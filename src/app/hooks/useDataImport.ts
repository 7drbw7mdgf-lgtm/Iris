import { useState, RefObject } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Dataset } from "../../types";
import { DataImportPreview } from "../types";
import { parseTableText, parseWorkbook } from "../../sampleData";
import { readBinaryFileBase64, readTextFile } from "../../tauri";
import { isTauriRuntime, base64ToArrayBuffer } from "../exportUtils";

export interface UseDataImportProps {
  loadDataset: (ds: Dataset) => void;
  openTextDocument: (fileName: string, text: string) => Promise<void>;
  setLoadedScriptDir: (dir: string) => void;
  openInputRef: RefObject<HTMLInputElement | null>;
  notify: (msg: string) => void;
}

export function useDataImport(props: UseDataImportProps) {
  const { loadDataset, openTextDocument, setLoadedScriptDir, openInputRef, notify } = props;
  const [dataImportPreview, setDataImportPreview] = useState<DataImportPreview | null>(null);

  const loadDataFile = (file: File) => {
    const name = file.name.replace(/\.[^.]+$/, "");
    const isExcel = /\.(xlsx|xls|xlsm|xlsb)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const ds = isExcel
          ? parseWorkbook(name, reader.result as ArrayBuffer)
          : parseTableText(name, String(reader.result));
        if (ds.columns.length === 0 || ds.rows.length === 0) {
          setDataImportPreview({
            name: file.name,
            source: file.name,
            dataset: ds,
            error:
              "Could not recognise a table in that file. Try a CSV, TSV, TXT table, or Excel workbook with a header/data rows.",
          });
          return;
        }
        setDataImportPreview({ name: file.name, source: file.name, dataset: ds });
      } catch (e) {
        setDataImportPreview({
          name: file.name,
          source: file.name,
          dataset: { name, columns: [], rows: [], types: {} },
          error: "Failed to read file: " + e,
        });
      }
    };
    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const openFileFromPicker = (file: File) => {
    if (/\.(csv|tsv|txt|xls|xlsx|xlsm|xlsb)$/i.test(file.name)) {
      loadDataFile(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => void openTextDocument(file.name, String(reader.result ?? ""));
    reader.onerror = () => alert("Failed to read file.");
    reader.readAsText(file);
  };

  const openProject = async () => {
    if (!isTauriRuntime()) {
      openInputRef.current?.click();
      return;
    }
    try {
      const selected = await open({
        title: "Open Iris project, data table, or graph script",
        multiple: false,
        filters: [
          { name: "Iris project", extensions: ["is", "iris"] },
          {
            name: "Data table",
            extensions: ["csv", "tsv", "txt", "xls", "xlsx", "xlsm", "xlsb"],
          },
          { name: "Python script", extensions: ["py"] },
          { name: "R script", extensions: ["r", "R", "rscript", "Rscript"] },
        ],
      });
      const path = Array.isArray(selected) ? selected[0] : selected;
      if (!path) return;
      const fileName = path.split(/[\\/]/).pop() || "Iris document";
      const dataName = fileName.replace(/\.[^.]+$/, "");
      if (/\.(xls|xlsx|xlsm|xlsb)$/i.test(fileName)) {
        const result = await readBinaryFileBase64(path);
        if (!result.success) {
          alert(result.error);
          return;
        }
        const ds = parseWorkbook(dataName, base64ToArrayBuffer(result.data));
        if (!ds.columns.length || !ds.rows.length) {
          alert("Could not recognise a table in that workbook.");
          return;
        }
        setDataImportPreview({ name: fileName, source: path, dataset: ds });
        return;
      }
      const result = await readTextFile(path);
      if (!result.success) {
        alert(result.error);
        return;
      }
      if (/\.(csv|tsv|txt)$/i.test(fileName)) {
        const ds = parseTableText(dataName, result.data);
        if (!ds.columns.length || !ds.rows.length) {
          alert("Could not recognise a table in that file.");
          return;
        }
        setDataImportPreview({ name: fileName, source: path, dataset: ds });
        return;
      }
      const dir = path.replace(/[\\/][^\\/]*$/, "");
      if (dir && /\.(py|r|rscript)$/i.test(fileName)) setLoadedScriptDir(dir);
      await openTextDocument(fileName, result.data);
    } catch {
      openInputRef.current?.click();
    }
  };

  const confirmDataImportPreview = () => {
    if (!dataImportPreview || dataImportPreview.error) return;
    loadDataset(dataImportPreview.dataset);
    notify(
      `Imported ${dataImportPreview.dataset.rows.length} rows from ${dataImportPreview.name}.`
    );
    setDataImportPreview(null);
  };

  const updateDataImportColumnType = (
    column: string,
    type: Dataset["types"][string]
  ) => {
    setDataImportPreview((preview) => {
      if (!preview || preview.error || !preview.dataset.columns.includes(column))
        return preview;
      return {
        ...preview,
        dataset: {
          ...preview.dataset,
          types: { ...preview.dataset.types, [column]: type },
        },
      };
    });
  };

  return {
    dataImportPreview,
    setDataImportPreview,
    loadDataFile,
    openFileFromPicker,
    openProject,
    confirmDataImportPreview,
    updateDataImportColumnType,
  };
}
