"use client";

import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useArtworkDocumentationAccess } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

type Props = {
  readonly drop: ApiDrop;
  readonly onSelected: () => void;
  readonly mobile?: boolean;
};

function AvailableDocumentationAction({ drop, onSelected, mobile }: Props) {
  const { enabled, profiles, selfServiceEnabled } =
    useArtworkDocumentationAccess();
  const locale = useBrowserLocale();
  const waveEnabled = profiles.some(
    (profile) => profile.wave_id === drop.wave.id
  );

  if (!enabled || (!selfServiceEnabled && !waveEnabled)) return null;

  return (
    <Link
      href={`/artwork-documentation?sourceDropId=${encodeURIComponent(drop.id)}`}
      prefetch={false}
      onClick={(event) => {
        event.stopPropagation();
        onSelected();
      }}
      className={
        mobile
          ? "tw-flex tw-min-h-11 tw-items-center tw-gap-x-4 tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-text-base tw-font-semibold tw-text-iron-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-bg-iron-800"
          : "tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      }
    >
      <DocumentTextIcon className="tw-size-5 tw-shrink-0" aria-hidden="true" />
      <span>{t(locale, "artworkDocumentation.title")}</span>
    </Link>
  );
}

export default function WaveDropDocumentationAction(props: Props) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { drop } = props;
  if (
    !connectedProfile?.id ||
    connectedProfile.id !== drop.author.id ||
    activeProfileProxy ||
    drop.id.startsWith("temp-") ||
    ![ApiDropType.Participatory, ApiDropType.Winner].includes(drop.drop_type)
  )
    return null;

  return <AvailableDocumentationAction {...props} />;
}
