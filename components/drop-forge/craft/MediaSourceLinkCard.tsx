import DropForgeLinkCard from "@/components/drop-forge/DropForgeLinkCard";
import {
  getOpenableMediaUrl,
  MEDIA_SOURCE_CARD_CLASS,
} from "@/components/drop-forge/craft/craft-claim-helpers";

export default function MediaSourceLinkCard({
  label,
  url,
  emptyText = "—",
}: Readonly<{
  label: string;
  url: string | null | undefined;
  emptyText?: string;
}>) {
  const trimmedUrl = url?.trim() ?? "";
  const openableUrl = getOpenableMediaUrl(trimmedUrl || undefined);

  return (
    <DropForgeLinkCard
      label={label}
      displayValue={trimmedUrl}
      emptyText={emptyText}
      copyValue={trimmedUrl}
      openUrl={openableUrl}
      copyLabel={`Copy ${label}`}
      openLabel={`Open ${label} in new tab`}
      cardClassName={MEDIA_SOURCE_CARD_CLASS}
    />
  );
}
