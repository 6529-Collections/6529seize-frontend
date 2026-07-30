import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import type React from "react";
import Button from "@/components/utils/button/Button";

type ButtonRef = React.Ref<HTMLButtonElement>;

interface AllTokensSelectedCardProps {
    readonly onDeselect: () => void;
    readonly buttonRef?: ButtonRef | undefined;
}

export function AllTokensSelectedCard({
    onDeselect,
    buttonRef,
}: AllTokensSelectedCardProps) {
    return (
        <output
            aria-label="All tokens selected status"
            className="tw-flex tw-w-full tw-flex-col tw-gap-3 tw-rounded-lg tw-border-2 tw-border-green-500/60 tw-bg-green-950/30 tw-p-4 tw-transition-all tw-duration-200 tw-ease-in-out @md:tw-flex-row @md:tw-items-center"
        >
            <span className="tw-flex tw-h-10 tw-w-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-green-600">
                <FontAwesomeIcon icon={faCheckCircle} className="tw-h-6 tw-w-6 tw-text-white" aria-hidden="true" />
            </span>

            <span className="tw-flex-1 tw-min-w-0">
                <span className="tw-block tw-text-base tw-font-semibold tw-text-green-400">All tokens selected</span>
                <span className="tw-block tw-text-sm tw-text-iron-400">
                    Click "Deselect All" to add specific tokens
                </span>
            </span>

            <Button
                ref={buttonRef}
                type="button"
                onClick={onDeselect}
                aria-label="Deselect all tokens and return to manual selection"
                variant="action"
                size="md"
                fullWidth
                className="@md:tw-w-auto @md:tw-shrink-0"
            >
                <FontAwesomeIcon icon={faCheckCircle} className="tw-h-5 tw-w-5 tw-text-white" aria-hidden="true" />
                Deselect All
            </Button>
        </output>
    );
}
