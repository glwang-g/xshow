import { defineStore } from "pinia";

export type Tool = "select" | "wire";

export const useBoardStore = defineStore("board", {
  state: () => ({
    activeTool: "select" as Tool,
    zoom: 86,
    selectedLayer: "hero-card",
  }),
  actions: {
    setTool(tool: Tool) {
      this.activeTool = tool;
    },
    setZoom(value: number) {
      this.zoom = Math.min(160, Math.max(25, value));
    },
    selectLayer(layer: string) {
      this.selectedLayer = layer;
    },
  },
});
