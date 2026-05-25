import { defineStore } from "pinia";

export const useBoardStore = defineStore("board", {
  state: () => ({
    zoom: 86,
  }),
  actions: {
    setZoom(value: number) {
      this.zoom = Math.min(160, Math.max(25, value));
    },
  },
});
