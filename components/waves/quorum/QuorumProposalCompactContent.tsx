"use client";

import DropPartMarkdownWithPropLogger from "@/components/drops/view/part/DropPartMarkdownWithPropLogger";
import type { DropPartMarkdownProps } from "@/components/drops/view/part/DropPartMarkdown";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useId, useState } from "react";
import type {
  ParsedQuorumProposalMarkdown,
  ParsedQuorumProposalSection,
} from "./quorumProposalMarkdown";

type CompactMarkdownProps = Pick<
  DropPartMarkdownProps,
  | "mentionedUsers"
  | "mentionedGroups"
  | "mentionedWaves"
  | "referencedNfts"
  | "nftLinks"
  | "onQuoteClick"
  | "currentDropId"
  | "hideLinkPreviews"
  | "embedPath"
  | "quotePath"
  | "embedDepth"
  | "maxEmbedDepth"
  | "linkPreviewToggleControl"
  | "onLinkCardActionsActiveChange"
  | "fullWidthLinkPreviews"
>;

interface QuorumProposalCompactContentProps extends CompactMarkdownProps {
  readonly proposal: ParsedQuorumProposalMarkdown;
}

function stopPropagation(event: { stopPropagation: () => void }): void {
  event.stopPropagation();
}

function ProposalMarkdownBlock({
  markdown,
  markdownProps,
}: Readonly<{
  markdown: string;
  markdownProps: CompactMarkdownProps;
}>) {
  return (
    <DropPartMarkdownWithPropLogger {...markdownProps} partContent={markdown} />
  );
}

function ProposalSectionCard({
  section,
  markdownProps,
}: Readonly<{
  section: ParsedQuorumProposalSection;
  markdownProps: CompactMarkdownProps;
}>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/70"
    >
      <summary
        onClick={stopPropagation}
        onKeyDown={stopPropagation}
        className="tw-flex tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 [&::-webkit-details-marker]:tw-hidden"
      >
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
          {section.heading}
        </span>
        <ChevronRightIcon
          className={`tw-size-5 tw-flex-shrink-0 tw-text-iron-400 tw-transition-transform ${
            isOpen ? "tw-rotate-90" : ""
          }`}
        />
      </summary>
      {isOpen && (
        <div
          role="presentation"
          onClick={stopPropagation}
          onKeyDown={stopPropagation}
          className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-pb-4 tw-pt-3"
        >
          <ProposalMarkdownBlock
            markdown={section.markdown}
            markdownProps={markdownProps}
          />
        </div>
      )}
    </details>
  );
}

export default function QuorumProposalCompactContent({
  proposal,
  ...markdownProps
}: QuorumProposalCompactContentProps) {
  const [areDetailsVisible, setAreDetailsVisible] = useState(false);
  const detailsContainerId = useId();
  const sectionCount = proposal.sections.length;
  const detailsToggleLabel = areDetailsVisible
    ? "Hide details"
    : `Show details (${sectionCount})`;

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-3">
      <div className="tw-rounded-2xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-500/5 tw-px-4 tw-py-4">
        <p className="tw-mb-1 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-primary-300">
          Proposal
        </p>
        <h2 className="tw-mb-3 tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-50">
          {proposal.title}
        </h2>
        <div className="tw-rounded-xl tw-bg-iron-950/80 tw-px-4 tw-py-3">
          <p className="tw-mb-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-iron-400">
            Summary
          </p>
          <ProposalMarkdownBlock
            markdown={proposal.summaryMarkdown}
            markdownProps={markdownProps}
          />
        </div>
        {sectionCount > 0 && (
          <div className="tw-mt-3 tw-flex tw-justify-start">
            <button
              type="button"
              aria-expanded={areDetailsVisible}
              aria-controls={detailsContainerId}
              onClick={(event) => {
                stopPropagation(event);
                setAreDetailsVisible((previousValue) => !previousValue);
              }}
              onKeyDown={stopPropagation}
              className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/60 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition-colors hover:tw-border-iron-700 hover:tw-text-iron-50"
            >
              <span>{detailsToggleLabel}</span>
              <ChevronRightIcon
                className={`tw-size-4 tw-flex-shrink-0 tw-text-iron-400 tw-transition-transform ${
                  areDetailsVisible ? "tw-rotate-90" : ""
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {areDetailsVisible && (
        <div id={detailsContainerId} className="tw-flex tw-flex-col tw-gap-y-2">
          {proposal.sections.map((section) => (
            <ProposalSectionCard
              key={section.heading}
              section={section}
              markdownProps={markdownProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
