import { Dataset } from "../types";

export interface LargeDatasetProfile {
  totalRows: number;
  totalColumns: number;
  estimatedMemoryBytes: number;
  isHighVolume: boolean;
  recommendedSampleSize: number;
}

export function profileDatasetVolume(ds: Dataset): LargeDatasetProfile {
  const totalRows = ds.rows.length;
  const totalColumns = ds.columns.length;
  const approxBytesPerRow = totalColumns * 24;
  const estimatedMemoryBytes = totalRows * approxBytesPerRow;
  const isHighVolume = totalRows > 15000;
  const recommendedSampleSize = isHighVolume ? Math.min(10000, totalRows) : totalRows;

  return {
    totalRows,
    totalColumns,
    estimatedMemoryBytes,
    isHighVolume,
    recommendedSampleSize,
  };
}

export function createPreviewSample(ds: Dataset, maxRows = 10000): Dataset {
  if (ds.rows.length <= maxRows) return ds;
  return {
    ...ds,
    name: `${ds.name} (Sampled ${maxRows} / ${ds.rows.length})`,
    rows: ds.rows.slice(0, maxRows),
  };
}

export function isParquetFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".parquet") || fileName.toLowerCase().endsWith(".pq");
}

export function generateParquetLoaderPython(filePath: string): string {
  return `import pandas as pd
df = pd.read_parquet(${JSON.stringify(filePath)})
print(f"Loaded Parquet: {df.shape[0]} rows, {df.shape[1]} columns")
`;
}

export function generateParquetLoaderR(filePath: string): string {
  return `if (!requireNamespace("arrow", quietly = TRUE)) {
  stop("The 'arrow' R package is required to read Parquet files. Run install.packages('arrow').")
}
df <- arrow::read_parquet(${JSON.stringify(filePath)})
cat(sprintf("Loaded Parquet: %d rows, %d columns\\n", nrow(df), ncol(df)))
`;
}
