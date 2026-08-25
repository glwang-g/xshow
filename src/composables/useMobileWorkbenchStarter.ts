import type { Ref } from "vue";
import type { LessonWorkspace } from "@/data/lessons";
import type { PartType } from "@/lib/circuit";
import type { PartSpec } from "@/lib/workbench-ui";

type Point = { x: number; y: number };
type Viewport = { clientHeight: number; clientWidth: number };

export function useMobileWorkbenchStarter(options: {
  getSpec: (part: PartType) => PartSpec;
  isDesktopViewport: () => boolean;
  viewportRef: Ref<Viewport | null>;
}) {
  function isMobilePortraitViewport() {
    if (typeof window === "undefined" || options.isDesktopViewport()) return false;
    const viewport = options.viewportRef.value;
    const width = viewport?.clientWidth ?? window.innerWidth;
    const height = viewport?.clientHeight ?? window.innerHeight;
    return height > width * 1.12;
  }

  function centeredMobilePartX(partType: PartType, centerX = 360) {
    return Math.round(centerX - options.getSpec(partType).width / 2);
  }

  function mobilePortraitLayoutFromRows(
    workspace: LessonWorkspace,
    rows: Record<string, { centerX?: number; y: number }>,
  ) {
    const layout: Record<string, Point> = {};
    for (const part of workspace.parts) {
      const row = rows[part.id];
      if (row) layout[part.id] = { x: centeredMobilePartX(part.type, row.centerX), y: row.y };
    }
    return layout;
  }

  function mobilePortraitStarterLayout(workspace: LessonWorkspace) {
    const hasPart = (partId: string) => workspace.parts.some((part) => part.id === partId);
    const hasParallelWires = workspace.wires.some((wire) => wire.id.includes("parallel"));
    if (hasPart("led-1")) {
      return mobilePortraitLayoutFromRows(workspace, {
        "battery-1": { y: 80 }, "switch-1": { y: 245 }, "resistor-1": { y: 420 }, "led-1": { y: 625 },
      });
    }
    if (hasPart("bulb-2") && hasParallelWires) {
      return mobilePortraitLayoutFromRows(workspace, {
        "battery-1": { y: 70 }, "switch-1": { y: 226 },
        "bulb-1": { centerX: 230, y: 420 }, "bulb-2": { centerX: 500, y: 420 }, "resistor-1": { y: 682 },
      });
    }
    if (hasPart("bulb-2")) {
      return mobilePortraitLayoutFromRows(workspace, {
        "battery-1": { y: 64 }, "switch-1": { y: 220 }, "bulb-1": { y: 382 }, "bulb-2": { y: 590 }, "resistor-1": { y: 812 },
      });
    }
    return mobilePortraitLayoutFromRows(workspace, {
      "battery-1": { y: 80 }, "switch-1": { y: 245 }, "bulb-1": { y: 430 }, "resistor-1": { y: 650 },
    });
  }

  function mobileStarterWorkspace(workspace: LessonWorkspace) {
    if (!isMobilePortraitViewport()) return workspace;
    const layout = mobilePortraitStarterLayout(workspace);
    return {
      ...workspace,
      parts: workspace.parts.map((part) => ({ ...part, ...(layout[part.id] ?? {}) })),
    };
  }

  return { isMobilePortraitViewport, mobileStarterWorkspace };
}
