import {
  batteryPositiveTerminal,
  type AmmeterState,
  type BuzzerState,
  type CapacitorState,
  type CircuitPart,
  type CircuitSimulation,
  type DiodeState,
  type LedState,
  type MotorState,
  type TerminalKey,
  type VoltmeterState,
  type Wire,
} from "@/lib/circuit";
import { getSpec, workbench } from "@/lib/workbench-ui";

type ExportWorkbenchImageOptions = {
  activeLessonTitle: string;
  ammeterStatus: (part: CircuitPart) => AmmeterState;
  buzzerStatus: (part: CircuitPart) => BuzzerState;
  capacitorStatus: (part: CircuitPart) => CapacitorState;
  diodeStatus: (part: CircuitPart) => DiodeState;
  ledStatus: (part: CircuitPart) => LedState;
  motorStatus: (part: CircuitPart) => MotorState;
  voltmeterStatus: (part: CircuitPart) => VoltmeterState;
  parts: CircuitPart[];
  selectedPartId: string;
  simulation: CircuitSimulation;
  wirePath: (wire: Wire) => string;
  wireStroke: (wire: Wire) => string;
  wireStrokeWidth: (wire: Wire) => number;
  wires: Wire[];
};

const terminalKeys: TerminalKey[] = ["a", "b"];

function roundedRectPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 8) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

function partExportColors(part: CircuitPart) {
  if (part.type === "battery") {
    return { background: "#0f172a", foreground: "#ffffff", muted: "#67e8f9" };
  }

  if (part.type === "bulb") {
    return { background: "#fffbeb", foreground: "#78350f", muted: "#f59e0b" };
  }

  if (part.type === "resistor") {
    return { background: "#ecfeff", foreground: "#164e63", muted: "#0e7490" };
  }

  if (part.type === "led") {
    return { background: "#fff1f2", foreground: "#881337", muted: "#e11d48" };
  }

  if (part.type === "diode") {
    return { background: "#fdf4ff", foreground: "#701a75", muted: "#c026d3" };
  }

  if (part.type === "capacitor") {
    return { background: "#f5f3ff", foreground: "#4c1d95", muted: "#7c3aed" };
  }

  if (part.type === "ammeter") {
    return { background: "#fff7ed", foreground: "#7c2d12", muted: "#ea580c" };
  }

  if (part.type === "voltmeter") {
    return { background: "#eef2ff", foreground: "#312e81", muted: "#4f46e5" };
  }

  if (part.type === "buzzer") {
    return { background: "#f0f9ff", foreground: "#0c4a6e", muted: "#0284c7" };
  }

  if (part.type === "motor") {
    return { background: "#f0fdf4", foreground: "#14532d", muted: "#16a34a" };
  }

  return { background: "#ffffff", foreground: "#0f172a", muted: part.closed ? "#10b981" : "#f43f5e" };
}

function drawExportPart(context: CanvasRenderingContext2D, part: CircuitPart, options: ExportWorkbenchImageOptions) {
  const spec = getSpec(part);
  const colors = partExportColors(part);

  context.save();
  roundedRectPath(context, part.x, part.y, spec.width, spec.height, 8);
  context.fillStyle = colors.background;
  context.fill();
  context.lineWidth = options.selectedPartId === part.id ? 4 : 2;
  context.strokeStyle = options.selectedPartId === part.id ? "#0f172a" : "#cbd5e1";
  context.stroke();

  context.fillStyle = colors.foreground;
  context.font = "600 18px Inter, sans-serif";
  context.fillText(part.name, part.x + 18, part.y + 30);

  context.font = "12px Inter, sans-serif";
  context.fillStyle = colors.muted;

  if (part.type === "battery") {
    context.fillText(`9V power - ${batteryPositiveTerminal(part) === "a" ? "+ left" : "+ right"}`, part.x + 18, part.y + 52);
    context.fillRect(part.x + 18, part.y + 70, 26, 12);
    context.fillRect(part.x + 50, part.y + 66, 32, 20);
  } else if (part.type === "switch") {
    context.fillText(part.closed ? "closed" : "open", part.x + 18, part.y + 52);
    context.strokeStyle = colors.muted;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(part.x + 24, part.y + 72);
    context.lineTo(part.x + (part.closed ? 136 : 92), part.y + (part.closed ? 72 : 52));
    context.stroke();
  } else if (part.type === "bulb") {
    const brightness = options.simulation.bulbs[part.id]?.brightness ?? 0;
    context.fillText(`${Math.round(brightness * 100)}% brightness`, part.x + 18, part.y + spec.height - 20);
    context.beginPath();
    context.arc(part.x + spec.width / 2, part.y + 78, 34, 0, Math.PI * 2);
    context.fillStyle = `rgba(245, 158, 11, ${0.18 + brightness * 0.72})`;
    context.fill();
    context.strokeStyle = "#f59e0b";
    context.stroke();
  } else if (part.type === "resistor") {
    context.fillText(`${part.resistance ?? 0} ohm`, part.x + 18, part.y + 52);
    context.strokeStyle = colors.muted;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(part.x + 20, part.y + 76);
    context.lineTo(part.x + spec.width - 20, part.y + 76);
    context.stroke();
  } else if (part.type === "led") {
    const state = options.ledStatus(part);
    context.fillText(`${state.brightnessPercent}% LED`, part.x + 18, part.y + spec.height - 18);
    context.beginPath();
    context.arc(part.x + spec.width / 2, part.y + 62, 30, 0, Math.PI * 2);
    context.fillStyle = `rgba(244, 63, 94, ${0.14 + state.brightness * 0.78})`;
    context.fill();
    context.strokeStyle = state.reversed ? "#64748b" : "#e11d48";
    context.stroke();
    context.fillStyle = colors.foreground;
    context.fillText(state.reversed ? "reversed" : "+ to -", part.x + 18, part.y + 52);
  } else if (part.type === "diode") {
    const state = options.diodeStatus(part);
    context.fillText(state.reversed ? "blocked" : state.conducting ? "conducting" : "idle", part.x + 18, part.y + spec.height - 18);
    context.strokeStyle = colors.muted;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(part.x + 44, part.y + 58);
    context.lineTo(part.x + 96, part.y + 58);
    context.moveTo(part.x + 78, part.y + 36);
    context.lineTo(part.x + 112, part.y + 58);
    context.lineTo(part.x + 78, part.y + 80);
    context.closePath();
    context.stroke();
  } else if (part.type === "capacitor") {
    const state = options.capacitorStatus(part);
    context.fillText(`${state.chargePercent}% charge`, part.x + 18, part.y + spec.height - 18);
    context.strokeStyle = colors.muted;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(part.x + 68, part.y + 36);
    context.lineTo(part.x + 68, part.y + 80);
    context.moveTo(part.x + 88, part.y + 36);
    context.lineTo(part.x + 88, part.y + 80);
    context.stroke();
  } else if (part.type === "ammeter") {
    const state = options.ammeterStatus(part);
    context.fillText(`${state.currentMilliAmps} mA`, part.x + 18, part.y + spec.height - 18);
    context.beginPath();
    context.arc(part.x + spec.width / 2, part.y + 58, 30, 0, Math.PI * 2);
    context.strokeStyle = colors.muted;
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = colors.foreground;
    context.fillText("A", part.x + spec.width / 2 - 6, part.y + 64);
  } else if (part.type === "voltmeter") {
    const state = options.voltmeterStatus(part);
    context.fillText(`${state.voltage.toFixed(1)} V`, part.x + 18, part.y + spec.height - 18);
    context.beginPath();
    context.arc(part.x + spec.width / 2, part.y + 58, 30, 0, Math.PI * 2);
    context.strokeStyle = colors.muted;
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = colors.foreground;
    context.fillText("V", part.x + spec.width / 2 - 6, part.y + 64);
  } else if (part.type === "buzzer") {
    const state = options.buzzerStatus(part);
    context.fillText(state.active ? `${state.volumePercent}% buzzing` : "silent", part.x + 18, part.y + spec.height - 18);
    context.strokeStyle = colors.muted;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(part.x + spec.width / 2 - 10, part.y + 64, 24, Math.PI * 0.3, Math.PI * 1.7);
    context.stroke();
    context.beginPath();
    context.arc(part.x + spec.width / 2 + 8, part.y + 64, 36, Math.PI * 0.22, Math.PI * 1.78);
    context.globalAlpha = 0.35 + state.volume * 0.55;
    context.stroke();
    context.globalAlpha = 1;
  } else if (part.type === "motor") {
    const state = options.motorStatus(part);
    context.fillText(state.active ? `${state.speedPercent}% motor` : "stopped", part.x + 18, part.y + spec.height - 18);
    context.strokeStyle = colors.muted;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(part.x + spec.width / 2, part.y + 64, 30, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(part.x + spec.width / 2, part.y + 64);
    context.lineTo(part.x + spec.width / 2 + 28, part.y + 64);
    context.moveTo(part.x + spec.width / 2, part.y + 64);
    context.lineTo(part.x + spec.width / 2 - 14, part.y + 40);
    context.moveTo(part.x + spec.width / 2, part.y + 64);
    context.lineTo(part.x + spec.width / 2 - 14, part.y + 88);
    context.globalAlpha = 0.45 + state.speed * 0.45;
    context.stroke();
    context.globalAlpha = 1;
  }

  for (const terminal of terminalKeys) {
    const offset = spec.terminals[terminal];
    context.beginPath();
    context.arc(part.x + offset.x, part.y + offset.y, 9, 0, Math.PI * 2);
    context.fillStyle = "#0f172a";
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = "#ffffff";
    context.stroke();
  }

  context.restore();
}

export function exportWorkbenchImage(options: ExportWorkbenchImageOptions) {
  if (typeof document === "undefined") {
    return;
  }

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = workbench.width * scale;
  canvas.height = workbench.height * scale;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.scale(scale, scale);
  context.fillStyle = "#f8faf7";
  context.fillRect(0, 0, workbench.width, workbench.height);

  context.strokeStyle = "rgba(148, 163, 184, 0.45)";
  context.lineWidth = 1;
  for (let x = 0; x <= workbench.width; x += 28) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, workbench.height);
    context.stroke();
  }
  for (let y = 0; y <= workbench.height; y += 28) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(workbench.width, y);
    context.stroke();
  }

  context.lineCap = "round";
  context.lineJoin = "round";
  for (const wire of options.wires) {
    context.strokeStyle = options.wireStroke(wire);
    context.lineWidth = options.wireStrokeWidth(wire);
    context.stroke(new Path2D(options.wirePath(wire)));
  }

  for (const part of options.parts) {
    drawExportPart(context, part, options);
  }

  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  roundedRectPath(context, 18, 18, 330, 72, 8);
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.stroke();
  context.fillStyle = "#0f172a";
  context.font = "600 16px Inter, sans-serif";
  context.fillText("xshow circuits", 34, 42);
  context.font = "13px Inter, sans-serif";
  context.fillStyle = "#475569";
  context.fillText(options.activeLessonTitle, 34, 62);
  context.fillText(
    `${options.simulation.closed ? "回路闭合" : "回路断开"} - ${options.simulation.currentMilliAmps} mA`,
    34,
    80,
  );

  const link = document.createElement("a");
  link.download = `xshow-circuit-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
