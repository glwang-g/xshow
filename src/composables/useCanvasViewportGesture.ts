import { ref, type Ref } from "vue";

type ViewportSize = { height: number; width: number };
type Point = { x: number; y: number };
type Gesture =
  | { mode: "pan"; lastX: number; lastY: number }
  | { distance: number; mode: "pinch"; zoom: number }
  | null;

type Options = {
  getZoom: () => number;
  isDesktopViewport: () => boolean;
  setZoom: (value: number) => void;
  initialSize: ViewportSize;
};

export function useCanvasViewportGesture(options: Options) {
  const viewportRef = ref<HTMLElement | null>(null);
  const viewportSize = ref({ ...options.initialSize });
  const pointers = new Map<number, Point>();
  const gesture = ref<Gesture>(null);

  function updateViewportSize() {
    if (!viewportRef.value) return;
    const nextSize = {
      height: viewportRef.value.clientHeight,
      width: viewportRef.value.clientWidth,
    };
    if (nextSize.height !== viewportSize.value.height || nextSize.width !== viewportSize.value.width) {
      viewportSize.value = nextSize;
    }
  }

  function setViewportElement(element: HTMLElement | null) {
    viewportRef.value = element;
    updateViewportSize();
  }

  function pointerDistance() {
    const values = Array.from(pointers.values());
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  }

  function isCircuitInteractionTarget(target: EventTarget | null) {
    return target instanceof Element && Boolean(
      target.closest("[data-circuit-interactive='true'], button, a, input, select, textarea"),
    );
  }

  function handlePointerDown(event: PointerEvent) {
    if (options.isDesktopViewport()) return;
    if (pointers.size === 0 && isCircuitInteractionTarget(event.target)) {
      gesture.value = null;
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    if (pointers.size >= 2) {
      gesture.value = { distance: pointerDistance(), mode: "pinch", zoom: options.getZoom() };
      event.preventDefault();
      return;
    }
    gesture.value = { mode: "pan", lastX: event.clientX, lastY: event.clientY };
    event.preventDefault();
  }

  function handlePointerMove(event: PointerEvent) {
    if (options.isDesktopViewport() || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      const current = gesture.value;
      const distance = pointerDistance();
      if (current?.mode === "pinch" && current.distance > 0) {
        options.setZoom(current.zoom * (distance / current.distance));
        event.preventDefault();
      }
      return;
    }
    const current = gesture.value;
    if (current?.mode !== "pan" || !viewportRef.value) return;
    viewportRef.value.scrollLeft -= event.clientX - current.lastX;
    viewportRef.value.scrollTop -= event.clientY - current.lastY;
    gesture.value = { mode: "pan", lastX: event.clientX, lastY: event.clientY };
    event.preventDefault();
  }

  function endPointerGesture(event: PointerEvent) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2 && gesture.value?.mode === "pinch") gesture.value = null;
    if (pointers.size === 0) gesture.value = null;
  }

  return {
    endPointerGesture,
    handlePointerDown,
    handlePointerMove,
    setViewportElement,
    updateViewportSize,
    viewportRef,
    viewportSize,
  };
}
