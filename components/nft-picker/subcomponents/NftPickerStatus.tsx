"use client";

import clsx from "clsx";

interface NftPickerStatusProps {
    helperState: {
        tone: "success" | "error" | "muted";
        text: string;
    };
    helperMessageId: string;
}

export function NftPickerStatus({ helperState, helperMessageId }: NftPickerStatusProps) {
    const helperClassName = clsx("tw-min-h-[1.25rem] tw-text-xs tw-font-medium", {
        "tw-text-emerald-300": helperState.tone === "success",
        "tw-text-red-300": helperState.tone === "error",
        "tw-text-iron-300": helperState.tone === "muted",
    });

    return (
        <output id={helperMessageId} className={helperClassName} aria-live="polite">
            {helperState.text}
        </output>
    );
}
