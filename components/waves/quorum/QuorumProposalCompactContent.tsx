"use client";

import DropPartMarkdownWithPropLogger from "@/components/drops/view/part/DropPartMarkdownWithPropLogger";
import type { DropPartMarkdownProps } from "@/components/drops/view/part/DropPartMarkdown";
import ProposalCardContextLabel from "@/components/waves/drops/proposal/ProposalCardContextLabel";
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
  | "bodyGalleryKeyPrefix"
>;

interface QuorumProposalCompactContentProps extends CompactMarkdownProps {
  readonly proposal: ParsedQuorumProposalMarkdown;
  readonly areDetailsVisible?: boolean | undefined;
  readonly onDetailsVisibleChange?:
    | ((areDetailsVisible: boolean) => void)
    | undefined;
  readonly openSectionKeys?: readonly string[] | undefined;
  readonly onSectionOpenChange?:
    | ((sectionKey: string, isOpen: boolean) => void)
    | undefined;
}

function stopPropagation(event: { stopPropagation: () => void }): void {
  event.stopPropagation();
}

export const QUORUM_PROPOSAL_COMPACT_SUMMARY_KEY = "summary";

export const getQuorumProposalCompactSectionKey = (
  section: ParsedQuorumProposalSection,
  index: number
): string => `section:${index}:${section.heading}`;

export const getQuorumProposalCompactBodyGalleryKeyPrefix = (
  blockKey: string
): string => `quorum-compact:${blockKey}`;

const getMarkdownBodyGalleryKeyPrefix = (
  markdownProps: CompactMarkdownProps,
  blockKey: string
): string => {
  const blockPrefix = getQuorumProposalCompactBodyGalleryKeyPrefix(blockKey);
  return markdownProps.bodyGalleryKeyPrefix
    ? `${markdownProps.bodyGalleryKeyPrefix}:${blockPrefix}`
    : blockPrefix;
};

function ProposalMarkdownBlock({
  bodyGalleryBlockKey,
  markdown,
  markdownProps,
}: Readonly<{
  bodyGalleryBlockKey: string;
  markdown: string;
  markdownProps: CompactMarkdownProps;
}>) {
  return (
    <DropPartMarkdownWithPropLogger
      {...markdownProps}
      bodyGalleryKeyPrefix={getMarkdownBodyGalleryKeyPrefix(
        markdownProps,
        bodyGalleryBlockKey
      )}
      partContent={markdown}
    />
  );
}

function ProposalSectionCard({
  isOpen,
  onOpenChange,
  section,
  sectionKey,
  markdownProps,
}: Readonly<{
  isOpen: boolean;
  onOpenChange: (sectionKey: string, isOpen: boolean) => void;
  section: ParsedQuorumProposalSection;
  sectionKey: string;
  markdownProps: CompactMarkdownProps;
}>) {
  return (
    <details
      open={isOpen}
      onToggle={(event) => onOpenChange(sectionKey, event.currentTarget.open)}
      className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/70"
    >
      <summary
        onClick={stopPropagation}
        onKeyDown={stopPropagation}
        className="tw-group tw-flex tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-900/80 motion-reduce:tw-transition-none [&::-webkit-details-marker]:tw-hidden"
      >
        <span className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors tw-duration-200 group-focus-visible:tw-text-iron-50 desktop-hover:group-hover:tw-text-iron-50 motion-reduce:tw-transition-none">
          {section.heading}
        </span>
        <ChevronRightIcon
          className={`tw-size-5 tw-flex-shrink-0 tw-text-iron-400 tw-transition-[color,transform] tw-duration-200 group-focus-visible:tw-text-primary-300 desktop-hover:group-hover:tw-text-primary-300 motion-reduce:tw-transition-none ${
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
            bodyGalleryBlockKey={sectionKey}
            markdown={section.markdown}
            markdownProps={markdownProps}
          />
        </div>
      )}
    </details>
  );
}

export default function QuorumProposalCompactContent({
  areDetailsVisible,
  onDetailsVisibleChange,
  onSectionOpenChange,
  openSectionKeys,
  proposal,
  ...markdownProps
}: QuorumProposalCompactContentProps) {
  const [internalAreDetailsVisible, setInternalAreDetailsVisible] =
    useState(false);
  const [internalOpenSectionKeys, setInternalOpenSectionKeys] = useState<
    readonly string[]
  >([]);
  const resolvedAreDetailsVisible =
    areDetailsVisible ?? internalAreDetailsVisible;
  const resolvedOpenSectionKeys = openSectionKeys ?? internalOpenSectionKeys;
  const detailsContainerId = useId();
  const sectionCount = proposal.sections.length;
  const detailsToggleLabel = resolvedAreDetailsVisible
    ? "Hide details"
    : `Show details (${sectionCount})`;
  const setDetailsVisible = (nextAreDetailsVisible: boolean) => {
    if (onDetailsVisibleChange) {
      onDetailsVisibleChange(nextAreDetailsVisible);
    }

    if (areDetailsVisible === undefined) {
      setInternalAreDetailsVisible(nextAreDetailsVisible);
    }

    if (!nextAreDetailsVisible && openSectionKeys === undefined) {
      setInternalOpenSectionKeys([]);
    }
  };
  const setSectionOpen = (sectionKey: string, isOpen: boolean) => {
    if (onSectionOpenChange) {
      onSectionOpenChange(sectionKey, isOpen);
    }

    if (openSectionKeys !== undefined) {
      return;
    }

    setInternalOpenSectionKeys((currentKeys) => {
      if (isOpen) {
        return currentKeys.includes(sectionKey)
          ? currentKeys
          : [...currentKeys, sectionKey];
      }

      return currentKeys.filter((key) => key !== sectionKey);
    });
  };

  return (
    <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-y-3">
      <div className="tw-group/proposal-card tw-rounded-2xl tw-border tw-border-solid tw-border-primary-400/20 tw-bg-primary-500/5 tw-px-4 tw-pb-4 tw-pt-3">
        <ProposalCardContextLabel />
        <h2 className="tw-[overflow-wrap:anywhere] tw-m-0 tw-mb-3 tw-text-pretty tw-break-words tw-text-base tw-font-semibold !tw-leading-[1.3] tw-tracking-tight tw-text-iron-50 tw-transition-colors tw-duration-200 desktop-hover:group-hover/proposal-card:tw-text-primary-300 sm:tw-text-lg">
          {proposal.title}
        </h2>
        <div className="tw-rounded-xl tw-bg-iron-950/80 tw-px-4 tw-py-3">
          <p className="tw-mb-2 tw-text-[10px] tw-font-bold tw-uppercase tw-leading-none tw-tracking-[0.14em] tw-text-iron-400">
            Summary
          </p>
          <div className="[&_li]:!tw-text-sm [&_li]:!tw-leading-[1.6] [&_li]:!tw-text-iron-300 [&_p]:!tw-text-sm [&_p]:!tw-leading-[1.6] [&_p]:!tw-text-iron-300">
            <ProposalMarkdownBlock
              bodyGalleryBlockKey={QUORUM_PROPOSAL_COMPACT_SUMMARY_KEY}
              markdown={proposal.summaryMarkdown}
              markdownProps={markdownProps}
            />
          </div>
        </div>
        {sectionCount > 0 && (
          <div className="tw-mt-3 tw-flex tw-justify-start">
            <button
              type="button"
              aria-expanded={resolvedAreDetailsVisible}
              aria-controls={detailsContainerId}
              onClick={(event) => {
                stopPropagation(event);
                setDetailsVisible(!resolvedAreDetailsVisible);
              }}
              onKeyDown={stopPropagation}
              className="tw-inline-flex tw-min-h-8 tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/60 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-leading-5 tw-text-primary-300 tw-transition-colors hover:tw-border-primary-400/40 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            >
              <span>{detailsToggleLabel}</span>
              <ChevronRightIcon
                className={`tw-size-4 tw-flex-shrink-0 tw-transition-transform ${
                  resolvedAreDetailsVisible ? "tw-rotate-90" : ""
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {resolvedAreDetailsVisible && (
        <div id={detailsContainerId} className="tw-flex tw-flex-col tw-gap-y-2">
          {proposal.sections.map((section, index) => {
            const sectionKey = getQuorumProposalCompactSectionKey(
              section,
              index
            );

            return (
              <ProposalSectionCard
                key={sectionKey}
                isOpen={resolvedOpenSectionKeys.includes(sectionKey)}
                onOpenChange={setSectionOpen}
                section={section}
                sectionKey={sectionKey}
                markdownProps={markdownProps}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
