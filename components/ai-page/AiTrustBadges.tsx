import {
  CheckBadgeIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/20/solid";
import type { ComponentType, SVGProps } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import {
  AI_PUBLISHER,
  type AiReleaseFile,
  type AiSignedBy,
} from "@/lib/ai-page/releaseFeed";
import { describeCodeSignature } from "@/lib/ai-page/releaseFiles";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;
const BADGE =
  "tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-200";

type Badge = {
  readonly key: string;
  readonly text: string;
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** The release standard's words (R62) for how the list vouches for a file. */
export function signedByText(signedBy: AiSignedBy): string {
  switch (signedBy) {
    case "publisher":
      return t(LOCALE, "ai.badge.signed", { signer: AI_PUBLISHER });
    case "apple":
      return t(LOCALE, "ai.badge.apple");
    case "list":
      return t(LOCALE, "ai.badge.list");
  }
}

const SIGNED_BY_ICONS: Readonly<
  Record<AiSignedBy, ComponentType<SVGProps<SVGSVGElement>>>
> = {
  publisher: ShieldCheckIcon,
  apple: CheckBadgeIcon,
  list: DocumentCheckIcon,
};

function badgesOf(file: Pick<AiReleaseFile, "signed" | "signedBy">): Badge[] {
  if (file.signedBy) {
    return [
      {
        key: file.signedBy,
        text: signedByText(file.signedBy),
        Icon: SIGNED_BY_ICONS[file.signedBy],
      },
    ];
  }
  const { signer, notarized } = describeCodeSignature(file.signed);
  return [
    ...(signer
      ? [
          {
            key: "signed",
            text: t(LOCALE, "ai.badge.signed", { signer }),
            Icon: ShieldCheckIcon,
          },
        ]
      : []),
    ...(notarized
      ? [
          {
            key: "notarized",
            text: t(LOCALE, "ai.badge.notarized"),
            Icon: CheckBadgeIcon,
          },
        ]
      : []),
  ];
}

/**
 * Who signed a file and whether Apple notarized it, from the signed list:
 * the Ed25519 feed's `signed` text, or in a list of format 1 the file's
 * type. Nothing for a file the Ed25519 feed gives no code signature.
 */
export default function AiTrustBadges({
  file,
}: {
  readonly file: Pick<AiReleaseFile, "signed" | "signedBy">;
}) {
  const badges = badgesOf(file);
  if (badges.length === 0) {
    return null;
  }
  return (
    <span className="tw-flex tw-flex-wrap tw-gap-1.5">
      {badges.map(({ key, text, Icon }) => (
        <span key={key} className={BADGE}>
          <Icon aria-hidden="true" className="tw-size-3.5 tw-text-success" />
          {text}
        </span>
      ))}
    </span>
  );
}
