"use client";

import ProfileCollectedReturnLink from "@/components/user/collected/ProfileCollectedReturnLink";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import { formatAddress, isNullAddress } from "@/helpers/Helpers";
import { getProfileCollectedReturnContext } from "@/helpers/profile-collected-navigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import { faArrowCircleLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { NextGenBackToCollectionPageLink } from "../collectionParts/NextGenCollectionHeader";

const getTrimmedIdentity = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export default function NextGenTokenCollectionLinks({
  collection,
  token,
  returnTo,
}: {
  readonly collection: NextGenCollection;
  readonly token: NextGenToken;
  readonly returnTo?: string | null | undefined;
}) {
  const locale = useBrowserLocale();
  const { isCapacitor } = useCapacitor();
  const returnContext = getProfileCollectedReturnContext(returnTo);
  const normalisedHandle = getTrimmedIdentity(token.normalised_handle);
  const handle = getTrimmedIdentity(token.handle);
  const owner = getTrimmedIdentity(token.owner);
  const ownerRouteSegment =
    [normalisedHandle, handle, owner].find((value) => value.length > 0) ?? "";
  const canLinkToOwner =
    !token.burnt && !isNullAddress(token.owner) && ownerRouteSegment.length > 0;
  const ownerCollectedHref = canLinkToOwner
    ? `/${encodeURIComponent(ownerRouteSegment)}/collected?collection=nextgen`
    : null;
  const collectedProfile =
    [handle, normalisedHandle].find((value) => value.length > 0) ??
    formatAddress(token.owner);
  const ownerCollectedLinkLabel = t(
    locale,
    "nextgen.token.navigation.viewOwnerCollected",
    { profile: collectedProfile }
  );

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
      {returnContext ? (
        <ProfileCollectedReturnLink
          locale={locale}
          returnTo={returnContext.href}
        />
      ) : (
        ownerCollectedHref && (
          <Link
            href={ownerCollectedHref}
            data-testid="view-owner-collected"
            className="tw-text-primary-200 desktop-hover:hover:tw-text-primary-100 tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-px-2 tw-text-sm tw-font-medium tw-no-underline tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            <FontAwesomeIcon
              icon={faArrowCircleLeft}
              className="tw-h-[18px] tw-w-[18px]"
              aria-hidden="true"
            />
            {ownerCollectedLinkLabel}
          </Link>
        )
      )}
      <div
        className={
          returnContext && !isCapacitor ? "tw-hidden md:tw-block" : undefined
        }
      >
        <NextGenBackToCollectionPageLink collection={collection} />
      </div>
    </div>
  );
}
