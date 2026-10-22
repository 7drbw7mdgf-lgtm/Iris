import { useState, useMemo } from "react";
import { EXCEL_FUNCTION_CATALOG, ExcelFunctionDef } from "../../excelFormula";

export function useFunctionCatalogModal(formulaDraft: string) {
  const [fxModalOpen, setFxModalOpen] = useState(false);
  const [fxSearchTerm, setFxSearchTerm] = useState("");
  const [fxCategory, setFxCategory] = useState<string>("All");
  const [selectedFx, setSelectedFx] = useState<ExcelFunctionDef>(EXCEL_FUNCTION_CATALOG[0]);

  const filteredFunctions = useMemo(() => {
    return EXCEL_FUNCTION_CATALOG.filter((fn) => {
      const matchCat = fxCategory === "All" || fn.category === fxCategory;
      const term = fxSearchTerm.trim().toLowerCase();
      const matchSearch =
        !term || fn.name.toLowerCase().includes(term) || fn.description.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });
  }, [fxCategory, fxSearchTerm]);

  const activeFunctionHint = useMemo(() => {
    if (!formulaDraft.startsWith("=")) return null;
    const match = formulaDraft.match(/^=([A-Za-z0-9_]+)\s*\(/);
    if (!match) return null;
    const fnName = match[1].toUpperCase();
    return EXCEL_FUNCTION_CATALOG.find((f) => f.name === fnName) || null;
  }, [formulaDraft]);

  return {
    fxModalOpen,
    setFxModalOpen,
    fxSearchTerm,
    setFxSearchTerm,
    fxCategory,
    setFxCategory,
    selectedFx,
    setSelectedFx,
    filteredFunctions,
    activeFunctionHint,
  };
}
