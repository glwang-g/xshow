import type { ComputedRef, Ref } from "vue";
import type { CircuitPart, Wire } from "@/lib/circuit";
import {
  createPublishedRelayModule,
  loadPublishedRelayModules,
  savePublishedRelayModule,
  verifyRelayPublication,
} from "@/lib/published-modules";

type NextStage = { moduleKind?: string; moduleName?: string };
type Lesson = { id: string; nextStage?: NextStage; title: string };

export function useRelayPublication(options: {
  activeLesson: ComputedRef<Lesson>;
  lessonComplete: ComputedRef<boolean>;
  parts: Ref<CircuitPart[]>;
  wires: Ref<Wire[]>;
  workbenchMode: ComputedRef<"free" | "workshop">;
}) {
  function publish(part: CircuitPart) {
    const spring = part.type === "spring"
      ? part
      : options.parts.value.find((candidate) => candidate.type === "spring" && candidate.controlledBy === part.id);
    if (!spring?.controlledBy) return "请先把弹簧开关绑定到一条线圈，再发布。";
    if (options.workbenchMode.value !== "workshop" || !options.activeLesson.value.nextStage) {
      return "请在器件工坊的发布课程中制作模块。";
    }
    if (!options.lessonComplete.value) {
      return `先完成“${options.activeLesson.value.title}”的全部验证步骤，再发布模块。`;
    }

    const existing = loadPublishedRelayModules();
    const nextStage = options.activeLesson.value.nextStage;
    const verification = verifyRelayPublication(options.parts.value, options.wires.value, nextStage?.moduleName);
    if (!verification.passed) return verification.reason;
    const module = createPublishedRelayModule({
      kind: nextStage?.moduleKind === "logic-gate" ? "logic-gate" : "relay",
      name: nextStage?.moduleName ?? `RelaySwitch ${existing.length + 1}`,
      parts: options.parts.value,
      springId: spring.id,
      verification: { lessonId: options.activeLesson.value.id, truthTable: verification.rows, verifiedAt: new Date().toISOString() },
      wires: options.wires.value,
    });
    if (!module || !savePublishedRelayModule(module)) return "发布未保存。请检查浏览器是否允许本地存储。";
    return `已发布 ${module.name}，现在可以在 Logic Lab 使用并查看来源。`;
  }

  return { publish };
}
