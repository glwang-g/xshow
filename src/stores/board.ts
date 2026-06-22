import { defineStore } from "pinia";

export const defaultBoardZoom = 86;
export const maxBoardZoom = 160;
export const minBoardZoom = 25;

export function clampBoardZoom(value: number, fallback = defaultBoardZoom) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maxBoardZoom, Math.max(minBoardZoom, Math.round(value)));
}

export const useBoardStore = defineStore("board", {
  state: () => ({
    zoom: defaultBoardZoom,
  }),
  actions: {
    setZoom(value: number) {
      this.zoom = clampBoardZoom(value, this.zoom);
    },
  },
});
