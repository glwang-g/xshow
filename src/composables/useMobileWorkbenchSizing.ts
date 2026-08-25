import type { Ref } from "vue";
import type { CircuitPart } from "@/lib/circuit";
import type { PartSpec } from "@/lib/workbench-ui";

type WorkbenchBounds = { bottom: number; height: number; left: number; right: number; top: number; width: number };
type Size = { height: number; width: number };

export function useMobileWorkbenchSizing(options: {
  getSpec: (part: CircuitPart) => PartSpec;
  isDesktopViewport: () => boolean;
  isPortraitViewport: () => boolean;
  parts: Ref<CircuitPart[]>;
  viewportRef: Ref<{ clientHeight: number; clientWidth: number } | null>;
  workbench: Size;
  padding: { bottomControls: number; horizontal: number };
}) {
  function mobileContentBounds(padding = options.isPortraitViewport() ? 160 : 72): WorkbenchBounds {
    if (options.parts.value.length === 0) {
      return { bottom: options.workbench.height, height: options.workbench.height, left: 0, right: options.workbench.width, top: 0, width: options.workbench.width };
    }
    const bounds = options.parts.value.reduce((next, part) => {
      const spec = options.getSpec(part);
      return {
        bottom: Math.max(next.bottom, part.y + spec.height),
        left: Math.min(next.left, part.x),
        right: Math.max(next.right, part.x + spec.width),
        top: Math.min(next.top, part.y),
      };
    }, { bottom: Number.NEGATIVE_INFINITY, left: Number.POSITIVE_INFINITY, right: Number.NEGATIVE_INFINITY, top: Number.POSITIVE_INFINITY });
    const left = Math.max(0, bounds.left - padding);
    const top = Math.max(0, bounds.top - padding);
    const right = bounds.right + padding;
    const bottom = bounds.bottom + padding;
    return { bottom, height: Math.max(240, bottom - top), left, right, top, width: Math.max(240, right - left) };
  }

  function mobileVisibleWorkbenchSize(): Size {
    const viewport = options.viewportRef.value;
    if (!viewport) return { height: options.workbench.height, width: options.workbench.width };
    return {
      height: Math.max(260, viewport.clientHeight - options.padding.bottomControls),
      width: Math.max(280, viewport.clientWidth - options.padding.horizontal),
    };
  }

  function mobileFitZoom() {
    const visible = mobileVisibleWorkbenchSize();
    const content = mobileContentBounds();
    return Math.floor(Math.min(visible.width / content.width, visible.height / content.height) * 92);
  }

  function mobileDefaultWorkbenchSize(): Size {
    const visible = mobileVisibleWorkbenchSize();
    const content = mobileContentBounds();
    const fitScale = Math.max(25, Math.min(160, mobileFitZoom())) / 100;
    return {
      height: Math.ceil(Math.max(options.workbench.height, content.bottom, visible.height / fitScale)),
      width: Math.ceil(Math.max(options.workbench.width, content.right, visible.width / fitScale)),
    };
  }

  return { mobileContentBounds, mobileDefaultWorkbenchSize, mobileFitZoom, mobileVisibleWorkbenchSize };
}
