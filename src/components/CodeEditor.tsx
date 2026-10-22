import CodeMirror from "@uiw/react-codemirror";
import { useRef } from "react";
import { python } from "@codemirror/lang-python";
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { r } from "@codemirror/legacy-modes/mode/r";
import { Decoration, EditorView, ViewPlugin, ViewUpdate, type DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { tags } from "@lezer/highlight";

interface Props {
  value: string;
  language: "python" | "r";
  onChange: (value: string) => void;
  className?: string;
  linkedFeature?: string | null;
  onHoverFeature?: (feature: string | null) => void;
}

function codeFeatureForLine(text: string): string | null {
  const line = text.toLowerCase();
  if (/legend|colorbar|colourbar|hue\s*=|color\s*=|colour\s*=/.test(line)) return "legend";
  if (/suptitle|set_title|title\s*=|ggtitle/.test(line)) return "title";
  if (/xlabel|x_label|x label|xaxis.*title|labs\s*\([^)]*x/.test(line)) return "x-axis";
  if (/ylabel|y_label|y label|yaxis.*title|labs\s*\([^)]*y/.test(line)) return "y-axis";
  if (/grid|style\s*=\s*["']whitegrid/.test(line)) return "grid";
  if (/scatter|plot\s*\(|lineplot|barplot|bar\s*\(|hist|boxplot|violin|heatmap|imshow|geom_|mark_/.test(line)) return "trace";
  return null;
}

const irisHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#7c3aed", fontWeight: "700" },
  { tag: [tags.function(tags.variableName), tags.definition(tags.function(tags.variableName))], color: "#0f766e", fontWeight: "650" },
  { tag: tags.string, color: "#b45309" },
  { tag: tags.number, color: "#1d4ed8" },
  { tag: tags.comment, color: "#7b8794", fontStyle: "italic" },
  { tag: tags.variableName, color: "#253043" },
]);

const commentHeadingPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
      let pos = from;
      while (pos <= to) {
        const line = view.state.doc.lineAt(pos);
        const text = line.text.trimStart();
        const isHeading = /^#{1,3}\s+\S/.test(text) || /^#\s*(?:PANEL|Panel)\s+[A-Z0-9]/.test(text);
        if (isHeading) {
          const level = text.startsWith("###") ? "h3" : text.startsWith("##") ? "h2" : "h1";
          builder.add(line.from, line.from, Decoration.line({ class: `cm-iris-comment-heading cm-iris-comment-${level}` }));
        }
        if (line.to + 1 > to) break;
        pos = line.to + 1;
      }
    }
    return builder.finish();
  }
}, {
  decorations: (value) => value.decorations,
});

function linkedFeaturePlugin(feature: string) {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) { this.decorations = this.build(view); }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) this.decorations = this.build(update.view);
    }
    build(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      for (const { from, to } of view.visibleRanges) {
        let pos = from;
        while (pos <= to) {
          const line = view.state.doc.lineAt(pos);
          if (codeFeatureForLine(line.text) === feature) builder.add(line.from, line.from, Decoration.line({ class: "cm-iris-linked-line" }));
          if (line.to + 1 > to) break;
          pos = line.to + 1;
        }
      }
      return builder.finish();
    }
  }, { decorations: (value) => value.decorations });
}

export default function CodeEditor({ value, language, onChange, className = "", linkedFeature = null, onHoverFeature }: Props) {
  const languageExtension = language === "python" ? python() : StreamLanguage.define(r);
  const editorRef = useRef<EditorView | null>(null);
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const view = editorRef.current;
    if (!view || !onHoverFeature) return;
    const position = view.posAtCoords({ x: event.clientX, y: event.clientY });
    const feature = position == null ? null : codeFeatureForLine(view.state.doc.lineAt(position).text);
    onHoverFeature(feature);
  };
  return (
    <div className="iris-code-editor-surface" onMouseMove={handleMouseMove} onMouseLeave={() => onHoverFeature?.(null)}>
      <CodeMirror
        className={`iris-code-editor ${className}`}
        value={value}
        extensions={[languageExtension, syntaxHighlighting(irisHighlightStyle), commentHeadingPlugin, ...(linkedFeature ? [linkedFeaturePlugin(linkedFeature)] : [])]}
        basicSetup={{
          autocompletion: true,
          bracketMatching: true,
          closeBrackets: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          lineNumbers: true,
        }}
        height="100%"
        theme="light"
        onCreateEditor={(view) => { editorRef.current = view; }}
        onChange={(next) => onChange(next)}
      />
    </div>
  );
}
