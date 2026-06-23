import { ApiDropType } from "@/generated/models/ApiDropType";

export const CHAT_LINK_RESTRICTION_MESSAGE =
  "Links are not allowed in this wave";

export const areHandlesEqual = (
  left: string | null | undefined,
  right: string | null | undefined
): boolean => {
  if (!left || !right) {
    return false;
  }

  return left.toLowerCase() === right.toLowerCase();
};

export const isChatLinkRestrictionApplicable = ({
  dropType,
  isWaveAdmin,
  isWaveCreator,
  linksDisabled,
}: {
  readonly dropType: ApiDropType | null | undefined;
  readonly isWaveAdmin: boolean;
  readonly isWaveCreator: boolean;
  readonly linksDisabled: boolean;
}): boolean =>
  linksDisabled &&
  dropType === ApiDropType.Chat &&
  !isWaveAdmin &&
  !isWaveCreator;
