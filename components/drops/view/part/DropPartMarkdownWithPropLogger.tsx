import React from "react";
import type { DropPartMarkdownProps } from "./DropPartMarkdown";
import DropPartMarkdown from "./DropPartMarkdown";

function areArraysEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (Array.isArray(arr1[i]) && Array.isArray(arr2[i])) {
      if (!areArraysEqual(arr1[i], arr2[i])) return false;
    } else if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

function areLinkPreviewToggleControlsEqual(
  prevControl: DropPartMarkdownProps["linkPreviewToggleControl"],
  nextControl: DropPartMarkdownProps["linkPreviewToggleControl"]
): boolean {
  if (prevControl === nextControl) {
    return true;
  }

  if (!prevControl || !nextControl) {
    return false;
  }

  return (
    prevControl.canToggle === nextControl.canToggle &&
    prevControl.isHidden === nextControl.isHidden &&
    prevControl.isLoading === nextControl.isLoading &&
    prevControl.label === nextControl.label &&
    prevControl.onToggle === nextControl.onToggle
  );
}

function areEqual(
  prevProps: DropPartMarkdownProps,
  nextProps: DropPartMarkdownProps
) {
  const propsToCheck: (keyof DropPartMarkdownProps)[] = [
    "mentionedUsers",
    "mentionedWaves",
    "referencedNfts",
    "partContent",
    "textSize",
    "currentDropId",
    "hideLinkPreviews",
    "marketplaceImageOnly",
    "embedPath",
    "quotePath",
    "embedDepth",
    "maxEmbedDepth",
  ];

  for (const key of propsToCheck) {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    if (prevValue !== nextValue) {
      if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
        if (!areArraysEqual(prevValue, nextValue)) {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  return areLinkPreviewToggleControlsEqual(
    prevProps.linkPreviewToggleControl,
    nextProps.linkPreviewToggleControl
  );
}

const DropPartMarkdownWithPropLogger = React.memo(
  (props: DropPartMarkdownProps) => {
    return <DropPartMarkdown {...props} />;
  },
  areEqual
);

DropPartMarkdownWithPropLogger.displayName = "DropPartMarkdownWithPropLogger";
export default DropPartMarkdownWithPropLogger;
