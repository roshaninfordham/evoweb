"use client";

import * as React from "react";
import { useMemo } from "react";
import { transform } from "sucrase";
import * as SlotKit from "./slot-kit";

const KIT_NAMES = Object.keys(SlotKit);
const KIT_VALUES = Object.values(SlotKit);

function compile(code: string): React.ComponentType<Record<string, unknown>> | null {
  try {
    const { code: js } = transform(code, { transforms: ["jsx", "typescript"] });
    const factory = new Function("React", ...KIT_NAMES, `${js}\nreturn Component;`);
    const fn = factory(React, ...KIT_VALUES);
    return typeof fn === "function" ? fn : null;
  } catch (err) {
    console.error("[evo] slot failed to compile", err);
    return null;
  }
}

class SlotErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error("[evo] slot failed at runtime", err);
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function DynamicSlot({
  code,
  slotProps,
}: {
  code: string;
  slotProps: Record<string, unknown>;
}) {
  const Comp = useMemo(() => compile(code), [code]);
  if (!Comp) return null;
  return (
    <SlotErrorBoundary>
      <Comp {...slotProps} />
    </SlotErrorBoundary>
  );
}
