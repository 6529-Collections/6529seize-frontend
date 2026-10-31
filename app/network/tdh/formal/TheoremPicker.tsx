"use client";

import { useState, type ReactNode } from "react";
import { Seg } from "@/components/explained/lens/controls";

/**
 * Pick a claim, read its theorem (How sure §04): one claim's main theorem at
 * a time, in words beside Lean. Every panel is rendered on the server; the
 * buttons only choose which one shows, so the page reads the same without
 * script (the first claim). The panel shown is named after its claim.
 */
export interface TheoremPanel {
  /** The claim's section id in the manifest: "1", "5a", "stack". */
  readonly value: string;
  /** The button's words: "Netting". */
  readonly label: string;
  readonly panel: ReactNode;
}

export default function TheoremPicker({
  label,
  panels,
}: {
  /** The buttons' accessible name: "Pick a claim". */
  readonly label: string;
  readonly panels: readonly TheoremPanel[];
}) {
  const [value, setValue] = useState(panels[0]?.value ?? "");
  return (
    <div data-theorems="" data-state={value}>
      <Seg
        label={label}
        options={panels.map((panel) => ({
          value: panel.value,
          label: panel.label,
        }))}
        value={value}
        onChange={setValue}
        attr="claim"
      />
      <div className="tw-mt-6">
        {panels.map((panel) => (
          <div
            key={panel.value}
            hidden={panel.value !== value}
            data-theorem={panel.value}
            role="group"
            aria-label={panel.label}
          >
            {panel.panel}
          </div>
        ))}
      </div>
    </div>
  );
}
