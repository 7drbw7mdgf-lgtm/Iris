import { useState, useRef, PointerEvent } from "react";
import { Dataset } from "../../types";
import {
  AssetState,
  AssetControlKind,
  AssetControl,
  AssetPanelPosition,
  WorkspaceTab,
  GraphState,
} from "../types";
import {
  normalizeAsset,
  makeAssetState,
} from "../graphStateUtils";
import {
  defaultAssetPanelPosition,
  snapAssetPanelValue,
  saneAssetPanelScale,
} from "../dashboardUtils";
import { numericExtent, makeGraphContextControl } from "../graphMetaUtils";

export interface UseAssetWorkspaceProps {
  dataset: Dataset;
  workspaceTabs: WorkspaceTab[];
  graphStates: Record<string, GraphState>;
  notify?: (msg: string) => void;
}

export function useAssetWorkspace(props: UseAssetWorkspaceProps) {
  const { dataset, workspaceTabs, graphStates, notify } = props;

  const [assetStates, setAssetStates] = useState<Record<string, AssetState>>({});
  const assetPanelDragRef = useRef<{
    assetId: string;
    graphId: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);

  const updateAsset = (id: string, update: Partial<AssetState>) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[id] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === id)?.title ?? "Asset"
          )
      );
      return { ...states, [id]: { ...current, ...update } };
    });
  };

  const toggleGraphInAsset = (assetId: string, graphId: string) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      const graphIds = current.graphIds.includes(graphId)
        ? current.graphIds.filter((id) => id !== graphId)
        : [...current.graphIds, graphId];
      return { ...states, [assetId]: { ...current, graphIds } };
    });
  };

  const addGraphToAsset = (assetId: string, graphId: string) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      if (current.graphIds.includes(graphId)) return states;
      return {
        ...states,
        [assetId]: { ...current, graphIds: [...current.graphIds, graphId] },
      };
    });
  };

  const moveAssetGraph = (
    assetId: string,
    graphId: string,
    direction: -1 | 1
  ) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      const index = current.graphIds.indexOf(graphId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.graphIds.length)
        return states;
      const graphIds = [...current.graphIds];
      [graphIds[index], graphIds[nextIndex]] = [
        graphIds[nextIndex],
        graphIds[index],
      ];
      return { ...states, [assetId]: { ...current, graphIds } };
    });
  };

  const updateAssetPanelPosition = (
    assetId: string,
    graphId: string,
    position: AssetPanelPosition
  ) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      const previous =
        current.panelPositions[graphId] ??
        defaultAssetPanelPosition(
          Math.max(0, current.graphIds.indexOf(graphId)),
          false,
          current.panelGap
        );
      return {
        ...states,
        [assetId]: {
          ...current,
          layout: "freeform",
          panelPositions: {
            ...current.panelPositions,
            [graphId]: {
              x: snapAssetPanelValue(position.x),
              y: snapAssetPanelValue(position.y),
              scale: saneAssetPanelScale(position.scale ?? previous.scale),
            },
          },
        },
      };
    });
  };

  const updateAssetPanelScale = (
    assetId: string,
    graphId: string,
    scale: number,
    index: number,
    compact = false
  ) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      const previous =
        current.panelPositions[graphId] ??
        defaultAssetPanelPosition(index, compact, current.panelGap);
      return {
        ...states,
        [assetId]: {
          ...current,
          panelPositions: {
            ...current.panelPositions,
            [graphId]: {
              ...previous,
              scale: saneAssetPanelScale(scale),
            },
          },
        },
      };
    });
  };

  const startAssetPanelDrag = (
    e: PointerEvent<HTMLElement>,
    assetId: string,
    graphId: string,
    index: number,
    compact = false
  ) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, select, textarea, a")) return;
    e.stopPropagation();
    const asset = normalizeAsset(
      assetStates[assetId] ??
        makeAssetState(
          workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
        )
    );
    const position =
      asset.panelPositions[graphId] ??
      defaultAssetPanelPosition(index, compact, asset.panelGap);
    assetPanelDragRef.current = {
      assetId,
      graphId,
      startX: e.clientX,
      startY: e.clientY,
      x: position.x,
      y: position.y,
    };
    updateAssetPanelPosition(assetId, graphId, position);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveAssetPanelDrag = (e: PointerEvent<HTMLElement>) => {
    const drag = assetPanelDragRef.current;
    if (!drag) return;
    updateAssetPanelPosition(drag.assetId, drag.graphId, {
      x: drag.x + e.clientX - drag.startX,
      y: drag.y + e.clientY - drag.startY,
    });
  };

  const endAssetPanelDrag = () => {
    assetPanelDragRef.current = null;
  };

  const updateAssetControl = (
    assetId: string,
    controlId: string,
    update: Partial<AssetControl>
  ) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      const controls = current.controls.map((control) => {
        if (control.id !== controlId) return control;
        const fieldChanged = update.field && update.field !== control.field;
        const extent = fieldChanged
          ? numericExtent(dataset, update.field || control.field)
          : { min: control.min, max: control.max };
        return {
          ...control,
          ...update,
          label: fieldChanged
            ? update.field || control.label
            : update.label ?? control.label,
          selectedValues: fieldChanged
            ? []
            : update.selectedValues ?? control.selectedValues,
          min: fieldChanged ? extent.min : update.min ?? control.min,
          max: fieldChanged ? extent.max : update.max ?? control.max,
          value: fieldChanged ? extent.max : update.value ?? control.value,
        };
      });
      return { ...states, [assetId]: { ...current, controls } };
    });
  };

  const removeAssetControl = (assetId: string, controlId: string) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      const control = current.controls.find((item) => item.id === controlId);
      if (control) notify?.(`Removed ${control.label}.`);
      return {
        ...states,
        [assetId]: {
          ...current,
          controls: current.controls.filter(
            (control) => control.id !== controlId
          ),
        },
      };
    });
  };

  const toggleAssetControlValue = (
    assetId: string,
    controlId: string,
    value: string
  ) => {
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      const controls = current.controls.map((control) => {
        if (control.id !== controlId) return control;
        const selectedValues = control.selectedValues.includes(value)
          ? control.selectedValues.filter((item) => item !== value)
          : [...control.selectedValues, value];
        notify?.(
          `${control.field}: ${
            selectedValues.length
              ? `${selectedValues.length} selected`
              : "all values"
          }.`
        );
        return { ...control, selectedValues };
      });
      return { ...states, [assetId]: { ...current, controls } };
    });
  };

  const addGraphContextControl = (
    assetId: string,
    graphId: string,
    kind: AssetControlKind
  ) => {
    const graph = graphStates[graphId];
    if (!graph) return;
    const control = makeGraphContextControl(dataset, graphId, graph, kind);
    if (!control) {
      alert(
        kind === "slider"
          ? "This graph does not have a numeric Y variable for a slider."
          : "This graph does not have a categorical group/X variable for buttons."
      );
      return;
    }
    setAssetStates((states) => {
      const current = normalizeAsset(
        states[assetId] ??
          makeAssetState(
            workspaceTabs.find((tab) => tab.id === assetId)?.title ?? "Asset"
          )
      );
      const alreadyExists = current.controls.some(
        (item) =>
          item.sourceGraphId === graphId &&
          item.kind === kind &&
          item.field === control.field
      );
      if (alreadyExists) {
        notify?.(
          `${
            kind === "slider" ? "Y slider" : "Button control"
          } already exists for ${control.field}.`
        );
        return states;
      }
      notify?.(
        `Added ${kind === "slider" ? "Y slider" : "buttons"} for ${
          control.field
        }.`
      );
      return {
        ...states,
        [assetId]: { ...current, controls: [...current.controls, control] },
      };
    });
  };

  return {
    assetStates,
    setAssetStates,
    updateAsset,
    toggleGraphInAsset,
    addGraphToAsset,
    moveAssetGraph,
    updateAssetPanelPosition,
    updateAssetPanelScale,
    startAssetPanelDrag,
    moveAssetPanelDrag,
    endAssetPanelDrag,
    updateAssetControl,
    removeAssetControl,
    toggleAssetControlValue,
    addGraphContextControl,
  };
}
