import { useState, useCallback } from "react";
import { Dataset, PlotSpec } from "../../types";

export interface CopilotMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface UseLocalCopilotProps {
  dataset: Dataset;
  activeSpec: PlotSpec;
  onApplySpecUpdate?: (patch: Partial<PlotSpec>) => void;
  onApplyCodeUpdate?: (code: string, language: "python" | "r") => void;
  endpoint?: string;
  model?: string;
}

export function useLocalCopilot(props: UseLocalCopilotProps) {
  const {
    dataset,
    activeSpec,
    onApplySpecUpdate,
    endpoint = "http://127.0.0.1:11434/api/generate",
    model = "llama3.2",
  } = props;

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);

  const checkOllamaHealth = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:11434/api/tags", { method: "GET" });
      setOllamaOnline(res.ok);
      return res.ok;
    } catch {
      setOllamaOnline(false);
      return false;
    }
  }, []);

  const sendPrompt = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    const userMsg: CopilotMessage = { role: "user", content: userPrompt };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    const systemPrompt = `You are Iris Scientific Copilot, an expert scientific visualization and biostatistics assistant.
Active Dataset: ${dataset.name || "Data"} with columns: ${dataset.columns.join(", ")}
Current PlotSpec:
- GraphType: ${activeSpec.graphType}
- X: ${activeSpec.xVar || "none"}
- Y: ${activeSpec.yVar || "none"}
- Group/Color: ${activeSpec.colorVar || "none"}
- Palette: ${activeSpec.palette || "default"}
- Theme: ${activeSpec.theme || "default"}

When suggesting PlotSpec property changes, output a single JSON block formatted as:
\`\`\`json
{
  "patch": {
    "palette": "npg",
    "xLog": true
  }
}
\`\`\`
Answer concisely with actionable guidance.`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `${systemPrompt}\n\nUser Question: ${userPrompt}`,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Local model responded with status ${response.status}`);
      }

      const data = await response.json();
      const reply = data.response || "No response received from local copilot.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Automatically inspect for JSON spec patch
      const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && onApplySpecUpdate) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.patch && typeof parsed.patch === "object") {
            onApplySpecUpdate(parsed.patch);
          }
        } catch {
          // ignore parse error in text
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Local Copilot offline: ${err.message}. Ensure Ollama is running at http://127.0.0.1:11434.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }, [dataset, activeSpec, endpoint, model, onApplySpecUpdate]);

  const clearChat = useCallback(() => setMessages([]), []);

  return {
    messages,
    busy,
    ollamaOnline,
    checkOllamaHealth,
    sendPrompt,
    clearChat,
  };
}
