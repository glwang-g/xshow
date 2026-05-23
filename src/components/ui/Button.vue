<script setup lang="ts">
import { computed } from "vue";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "icon";

const props = withDefaults(
  defineProps<{
    class?: string;
    disabled?: boolean;
    size?: Size;
    variant?: Variant;
  }>(),
  {
    class: "",
    disabled: false,
    size: "md",
    variant: "default",
  },
);

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        outline: "border-border bg-card hover:bg-muted",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-4",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

const classes = computed(() =>
  cn(buttonVariants({ size: props.size, variant: props.variant }), props.class),
);
</script>

<template>
  <button :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>
