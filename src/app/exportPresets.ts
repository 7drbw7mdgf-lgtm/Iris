export interface JournalPreset {
  id: string;
  label: string;
  journal: string;
  widthIn: number;
  heightIn: number;
  dpi: number;
  description: string;
  recommendedFontPt: number;
}

export const JOURNAL_EXPORT_PRESETS: JournalPreset[] = [
  {
    id: "custom",
    label: "Custom",
    journal: "Default",
    widthIn: 7.0,
    heightIn: 5.0,
    dpi: 300,
    description: "Standard editable dimensions for interactive exploration.",
    recommendedFontPt: 10,
  },
  {
    id: "nature_single",
    label: "Nature / Science — 1 column (89 mm)",
    journal: "Nature Publishing Group / AAAS",
    widthIn: 3.5,
    heightIn: 3.0,
    dpi: 300,
    description: "Standard 89 mm single column figure width. Recommended text 6–8 pt Arial/Helvetica.",
    recommendedFontPt: 7,
  },
  {
    id: "nature_intermediate",
    label: "Nature / Science — 1.5 column (120 mm)",
    journal: "Nature Publishing Group / AAAS",
    widthIn: 4.72,
    heightIn: 3.5,
    dpi: 300,
    description: "Standard 120 mm intermediate width figure. Recommended text 7 pt Arial/Helvetica.",
    recommendedFontPt: 7,
  },
  {
    id: "nature_double",
    label: "Nature / Science — 2 column full page (183 mm)",
    journal: "Nature Publishing Group / AAAS",
    widthIn: 7.2,
    heightIn: 5.0,
    dpi: 300,
    description: "Standard 183 mm full page width for multi-panel composite figures.",
    recommendedFontPt: 8,
  },
  {
    id: "cell_single",
    label: "Cell Press — 1 column (85 mm)",
    journal: "Cell Press",
    widthIn: 3.35,
    heightIn: 3.0,
    dpi: 300,
    description: "Cell Press single column width (85 mm). Maximum height 235 mm.",
    recommendedFontPt: 7,
  },
  {
    id: "cell_1_5",
    label: "Cell Press — 1.5 column (114 mm)",
    journal: "Cell Press",
    widthIn: 4.49,
    heightIn: 3.5,
    dpi: 300,
    description: "Cell Press 1.5 column width (114 mm).",
    recommendedFontPt: 7,
  },
  {
    id: "cell_double",
    label: "Cell Press — Full width (174 mm)",
    journal: "Cell Press",
    widthIn: 6.85,
    heightIn: 5.0,
    dpi: 300,
    description: "Cell Press full page width (174 mm).",
    recommendedFontPt: 8,
  },
  {
    id: "plos_single",
    label: "PLOS / PNAS — 1 column (83 mm)",
    journal: "PLOS / PNAS",
    widthIn: 3.27,
    heightIn: 3.0,
    dpi: 300,
    description: "PLOS single column width (83 mm). Minimum resolution 300 DPI.",
    recommendedFontPt: 7,
  },
  {
    id: "plos_double",
    label: "PLOS / PNAS — 2 column (173 mm)",
    journal: "PLOS / PNAS",
    widthIn: 6.81,
    heightIn: 5.0,
    dpi: 300,
    description: "PLOS double column width (173 mm). Maximum height 222 mm.",
    recommendedFontPt: 8,
  },
  {
    id: "slide_16_9",
    label: "Slide Deck / Presentation — 16:9",
    journal: "Presentation",
    widthIn: 10.0,
    heightIn: 5.625,
    dpi: 300,
    description: "Standard widescreen presentation slide aspect ratio (16:9).",
    recommendedFontPt: 14,
  },
  {
    id: "slide_4_3",
    label: "Slide Deck / Presentation — 4:3",
    journal: "Presentation",
    widthIn: 8.0,
    heightIn: 6.0,
    dpi: 300,
    description: "Standard presentation slide aspect ratio (4:3).",
    recommendedFontPt: 13,
  },
];

export function findPreset(id: string): JournalPreset | undefined {
  return JOURNAL_EXPORT_PRESETS.find((p) => p.id === id);
}
