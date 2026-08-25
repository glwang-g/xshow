import { nextTick, type Ref } from "vue";

type Size = { height: number; width: number };
type Viewport = { clientHeight: number; clientWidth: number; scrollTo: (options: ScrollToOptions) => void };

export function useMobileWorkbenchViewport(options: {
  boardZoom: () => number;
  canvasViewportRef: Ref<Viewport | null>;
  defaultSize: () => Size;
  fitZoom: () => number;
  isDesktopViewport: () => boolean;
  mobileContentBounds: () => { bottom: number; height: number; left: number; right: number; top: number; width: number };
  mobileVisibleWorkbenchSize: () => Size;
  setBoardZoom: (value: number) => void;
  setViewportSize: () => void;
  size: Ref<Size>;
}) {
  let fitFrame: number | null = null;
  let scrollFrame: number | null = null;

  function expandMobileWorkbenchTo(x: number, y: number, padding = 280) {
    if (options.isDesktopViewport()) return;
    const chunk = 400;
    const nextWidth = Math.max(options.size.value.width, Math.ceil((x + padding) / chunk) * chunk);
    const nextHeight = Math.max(options.size.value.height, Math.ceil((y + padding) / chunk) * chunk);
    if (nextWidth !== options.size.value.width || nextHeight !== options.size.value.height) {
      options.size.value = { height: nextHeight, width: nextWidth };
    }
  }

  function resetMobileWorkbenchSize() {
    if (!options.isDesktopViewport()) options.size.value = options.defaultSize();
  }

  function fitMobileWorkbench(behavior: ScrollBehavior = "auto", resetLayout = false) {
    if (typeof window === "undefined" || options.isDesktopViewport() || !options.canvasViewportRef.value) return;
    options.setViewportSize();
    if (resetLayout) resetMobileWorkbenchSize();
    const nextZoom = options.fitZoom();
    if (nextZoom !== options.boardZoom()) options.setBoardZoom(nextZoom);
    if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = null;
      const viewport = options.canvasViewportRef.value;
      if (!viewport) return;
      const visible = options.mobileVisibleWorkbenchSize();
      const content = options.mobileContentBounds();
      const scale = options.boardZoom() / 100;
      const centeredLeft = content.left * scale - Math.max(0, (viewport.clientWidth - content.width * scale) / 2);
      const centeredTop = content.top * scale - Math.max(16, (visible.height - content.height * scale) / 2);
      viewport.scrollTo({ behavior, left: Math.max(0, centeredLeft), top: Math.max(0, centeredTop) });
    });
  }

  function fitMobileWorkbenchAfterRender(behavior: ScrollBehavior = "auto", resetLayout = false) {
    if (typeof window === "undefined" || options.isDesktopViewport()) return;
    nextTick(() => {
      if (fitFrame !== null) window.cancelAnimationFrame(fitFrame);
      fitFrame = window.requestAnimationFrame(() => {
        fitFrame = null;
        fitMobileWorkbench(behavior, resetLayout);
      });
    });
  }

  function resetMobileView() {
    if (options.isDesktopViewport()) options.setBoardZoom(86);
    else fitMobileWorkbench("smooth", true);
  }

  function dispose() {
    if (typeof window !== "undefined") {
      if (fitFrame !== null) window.cancelAnimationFrame(fitFrame);
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
    }
    fitFrame = null;
    scrollFrame = null;
  }

  return { dispose, expandMobileWorkbenchTo, fitMobileWorkbench, fitMobileWorkbenchAfterRender, resetMobileView, resetMobileWorkbenchSize };
}
