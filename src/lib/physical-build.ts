import {
  batteryPositiveTerminal,
  type CircuitPart,
  type PartType,
  type TerminalKey,
  type TerminalRef,
  type Wire,
} from "@/lib/circuit";

export type PhysicalBuildItem = {
  id: string;
  label: string;
  note: string;
  purchaseKeywords: string[];
  quantity: number;
};

export type PhysicalBuildConnection = {
  from: string;
  id: string;
  instruction: string;
  to: string;
};

export type PhysicalBuildWarning = {
  id: string;
  message: string;
  tone: "info" | "warning";
};

export type PhysicalBuildPlan = {
  connections: PhysicalBuildConnection[];
  items: PhysicalBuildItem[];
  ready: boolean;
  summary: string;
  warnings: PhysicalBuildWarning[];
};

const partTypeOrder: PartType[] = [
  "battery",
  "switch",
  "bulb",
  "resistor",
  "led",
  "diode",
  "capacitor",
  "ammeter",
  "voltmeter",
  "buzzer",
  "motor",
];

const partLabels: Record<PartType, string> = {
  ammeter: "电流表模块",
  battery: "9V 电池/电池盒",
  bulb: "小灯泡模块",
  buzzer: "蜂鸣器模块",
  capacitor: "电容模块",
  diode: "二极管模块",
  led: "LED 模块",
  motor: "电机模块",
  resistor: "可变电阻/电位器",
  switch: "开关模块",
  voltmeter: "电压表模块",
};

const partNotes: Record<PartType, string> = {
  ammeter: "串联接入被测支路",
  battery: "建议使用带保护的低压电源",
  bulb: "用于观察亮度变化",
  buzzer: "通电后可作为声音反馈",
  capacitor: "注意耐压和极性标记",
  diode: "注意正向和反向",
  led: "建议搭配限流电阻",
  motor: "通电后观察转速",
  resistor: "用于限流或调节亮度",
  switch: "控制电路通断",
  voltmeter: "并联测量两点电压",
};

const partPurchaseKeywords: Record<PartType, string[]> = {
  ammeter: ["直流电流表模块", "电子积木电流表"],
  battery: ["9V 电池盒", "低压实验电源模块"],
  bulb: ["小灯泡模块", "电子积木灯泡"],
  buzzer: ["有源蜂鸣器模块", "电子积木蜂鸣器"],
  capacitor: ["电容模块", "电子积木电容"],
  diode: ["二极管模块", "1N4148 二极管"],
  led: ["LED 模块", "发光二极管模块"],
  motor: ["小电机模块", "直流电机模块"],
  resistor: ["可调电阻模块", "电位器模块"],
  switch: ["拨动开关模块", "电子积木开关"],
  voltmeter: ["直流电压表模块", "电子积木电压表"],
};

function terminalLabel(part: CircuitPart, terminal: TerminalKey) {
  if (part.type === "battery") {
    return batteryPositiveTerminal(part) === terminal ? "+" : "-";
  }

  if (part.type === "led" || part.type === "diode") {
    return terminal === "b" ? "+" : "-";
  }

  return terminal.toUpperCase();
}

function terminalName(partsById: Map<string, CircuitPart>, ref: TerminalRef) {
  const part = partsById.get(ref.partId);
  if (!part) {
    return `缺失元件 ${ref.partId}:${ref.terminal}`;
  }

  return `${part.name} ${terminalLabel(part, ref.terminal)}端`;
}

function itemNote(type: PartType, parts: CircuitPart[]) {
  if (type === "resistor") {
    const values = parts
      .filter((part) => part.type === "resistor")
      .map((part) => part.resistance)
      .filter((value): value is number => typeof value === "number");
    return values.length ? `当前阻值约 ${values.join(" / ")} Ω` : partNotes[type];
  }

  if (type === "battery") {
    const reversedCount = parts.filter((part) => part.type === "battery" && part.polarity === "reversed").length;
    return reversedCount > 0 ? "有电池在虚拟工作台中已反转极性" : partNotes[type];
  }

  return partNotes[type];
}

export function createPhysicalBuildPlan(parts: CircuitPart[], wires: Wire[]): PhysicalBuildPlan {
  const partsById = new Map(parts.map((part) => [part.id, part]));
  const items = partTypeOrder.reduce<PhysicalBuildItem[]>((result, type) => {
    const quantity = parts.filter((part) => part.type === type).length;
    if (quantity > 0) {
      result.push({
        id: type,
        label: partLabels[type],
        note: itemNote(type, parts),
        purchaseKeywords: partPurchaseKeywords[type],
        quantity,
      });
    }

    return result;
  }, []);

  if (wires.length > 0) {
    items.push({
      id: "wire",
      label: "跳线/导线",
      note: "按接线步骤连接端子",
      purchaseKeywords: ["杜邦线", "鳄鱼夹测试线", "电子积木导线"],
      quantity: wires.length,
    });
  }

  const connections = wires.map((wire, index) => {
    const from = terminalName(partsById, wire.from);
    const to = terminalName(partsById, wire.to);
    return {
      from,
      id: wire.id,
      instruction: `${index + 1}. 连接 ${from} 到 ${to}`,
      to,
    };
  });

  const warnings: PhysicalBuildWarning[] = [];
  const batteryCount = parts.filter((part) => part.type === "battery").length;
  const hasPolaritySensitivePart = parts.some((part) => part.type === "led" || part.type === "diode");
  const hasResistor = parts.some((part) => part.type === "resistor");

  if (batteryCount === 0) {
    warnings.push({
      id: "no-battery",
      message: "当前工作台没有电源，实体搭建前需要补一个安全低压电源。",
      tone: "warning",
    });
  }

  if (batteryCount > 1) {
    warnings.push({
      id: "multiple-batteries",
      message: "当前清单只适合作为入门参考，多电源实体搭建需要额外检查安全和极性。",
      tone: "warning",
    });
  }

  if (wires.length === 0) {
    warnings.push({
      id: "no-wires",
      message: "当前还没有导线，先在工作台上完成连接，再生成更有用的搭建步骤。",
      tone: "info",
    });
  }

  if (hasPolaritySensitivePart && !hasResistor) {
    warnings.push({
      id: "missing-current-limit",
      message: "LED 或二极管实体搭建时建议串联限流电阻，避免电流过大。",
      tone: "warning",
    });
  }

  if (parts.some((part) => part.type === "ammeter")) {
    warnings.push({
      id: "ammeter-placement",
      message: "电流表应串联接入支路，不要直接并在电源两端。",
      tone: "info",
    });
  }

  if (parts.some((part) => part.type === "voltmeter")) {
    warnings.push({
      id: "voltmeter-placement",
      message: "电压表应并联测量两点电压，它不会替代导线闭合回路。",
      tone: "info",
    });
  }

  const ready = batteryCount > 0 && wires.length > 0;

  return {
    connections,
    items,
    ready,
    summary: ready
      ? `已生成 ${items.length} 类物料和 ${connections.length} 条接线步骤。`
      : "可以先把电源和导线补齐，再生成更完整的实体搭建方案。",
    warnings,
  };
}

export function formatPhysicalBuildPlanMarkdown(plan: PhysicalBuildPlan) {
  const lines = [
    "# xshow 实体搭建清单",
    "",
    plan.summary,
    "",
    "## 物料",
    ...plan.items.map(
      (item) =>
        `- ${item.label} x${item.quantity}：${item.note}。采购关键词：${item.purchaseKeywords.join("、")}`,
    ),
    "",
    "## 接线步骤",
    ...(plan.connections.length
      ? plan.connections.map((connection) => `- ${connection.instruction}`)
      : ["- 暂无接线步骤"]),
  ];

  if (plan.warnings.length > 0) {
    lines.push("", "## 注意事项", ...plan.warnings.map((warning) => `- ${warning.message}`));
  }

  return lines.join("\n");
}

type PhysicalBuildSheetOptions = {
  generatedAt?: string;
  title?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatGeneratedAt(generatedAt: string | undefined) {
  if (!generatedAt) {
    return "";
  }

  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function checkboxListItem(content: string) {
  return `<li><span class="box"></span><span>${content}</span></li>`;
}

export function formatPhysicalBuildSheetHtml(plan: PhysicalBuildPlan, options: PhysicalBuildSheetOptions = {}) {
  const title = escapeHtml(options.title?.trim() || "xshow 实体装配单");
  const generatedAt = formatGeneratedAt(options.generatedAt);
  const itemRows = plan.items.length
    ? plan.items
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.label)}</td>
            <td class="qty">x${item.quantity}</td>
            <td>${escapeHtml(item.note)}</td>
            <td>${escapeHtml(item.purchaseKeywords.join(" / "))}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="muted">当前工作台还没有可列出的物料。</td></tr>`;
  const connectionItems = plan.connections.length
    ? plan.connections.map((connection) => checkboxListItem(escapeHtml(connection.instruction))).join("")
    : checkboxListItem("连接元器件后，这里会生成可照着搭的接线步骤。");
  const warningItems = plan.warnings.length
    ? plan.warnings.map((warning) => `<li>${escapeHtml(warning.message)}</li>`).join("")
    : "<li>实体搭建前，请确认电源断开，完成接线检查后再通电。</li>";

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    body {
      margin: 0;
      background: #f8fafc;
    }
    main {
      box-sizing: border-box;
      max-width: 920px;
      min-height: 100vh;
      margin: 0 auto;
      padding: 32px;
      background: #ffffff;
    }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 0;
    }
    h2 {
      margin: 28px 0 10px;
      font-size: 17px;
    }
    .meta {
      color: #475569;
      font-size: 12px;
      text-align: right;
      white-space: nowrap;
    }
    .summary {
      margin: 16px 0 0;
      color: #334155;
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      margin-top: 10px;
      border: 1px solid ${plan.ready ? "#047857" : "#b45309"};
      border-radius: 999px;
      padding: 3px 10px;
      color: ${plan.ready ? "#047857" : "#92400e"};
      font-size: 12px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th,
    td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #e2e8f0;
      font-weight: 700;
    }
    .qty {
      white-space: nowrap;
      text-align: center;
      font-weight: 700;
    }
    ol,
    ul {
      margin: 0;
      padding-left: 22px;
    }
    li {
      margin: 7px 0;
    }
    .checklist {
      list-style: none;
      padding-left: 0;
    }
    .checklist li {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .box {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-top: 4px;
      border: 1.5px solid #334155;
      flex: 0 0 auto;
    }
    .notes {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .note-box {
      min-height: 96px;
      border: 1px solid #cbd5e1;
      padding: 10px;
    }
    .muted {
      color: #64748b;
    }
    @page {
      margin: 14mm;
    }
    @media print {
      body {
        background: #ffffff;
      }
      main {
        max-width: none;
        min-height: auto;
        padding: 0;
      }
      h2 {
        break-after: avoid;
      }
      table,
      .note-box {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>${title}</h1>
        <p class="summary">${escapeHtml(plan.summary)}</p>
        <span class="badge">${plan.ready ? "可搭建" : "待补齐"}</span>
      </div>
      <div class="meta">${generatedAt ? `生成时间<br />${escapeHtml(generatedAt)}` : "xshow circuits"}</div>
    </header>

    <section>
      <h2>物料清单</h2>
      <table>
        <thead>
          <tr>
            <th>物料</th>
            <th>数量</th>
            <th>备注</th>
            <th>采购关键词</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </section>

    <section>
      <h2>接线检查</h2>
      <ol class="checklist">${connectionItems}</ol>
    </section>

    <section>
      <h2>安全和搭建注意</h2>
      <ul>${warningItems}</ul>
    </section>

    <section>
      <h2>通电前检查</h2>
      <ul class="checklist">
        ${checkboxListItem("电源开关处于断开状态。")}
        ${checkboxListItem("极性敏感元件方向已经核对。")}
        ${checkboxListItem("导线没有直接短接电源正负极。")}
        ${checkboxListItem("需要限流的支路已经串联电阻。")}
      </ul>
    </section>

    <section>
      <h2>实验记录</h2>
      <div class="notes">
        <div class="note-box">观察现象：</div>
        <div class="note-box">调整和结论：</div>
      </div>
    </section>
  </main>
</body>
</html>`;
}
