import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import DropForgeCraftIcon from "@/components/common/icons/DropForgeCraftIcon";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import {
  BACK_LINK_CLASS,
  CRAFT_CLAIMS_LIST_PATH,
  HEADER_ACTION_LINK_CLASS,
} from "@/components/drop-forge/craft/craft-claim-helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";

export default function DropForgeCraftClaimHeader({
  pageTitle,
  dropHref,
}: Readonly<{
  pageTitle: string;
  dropHref?: string;
}>) {
  const { isApp } = useDeviceInfo();

  return (
    <div className="tw-mb-4 sm:tw-mb-6">
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4">
        <Link href={CRAFT_CLAIMS_LIST_PATH} className={BACK_LINK_CLASS}>
          <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          Back to Craft list
        </Link>
        {dropHref ? (
          <Link
            href={dropHref}
            className={HEADER_ACTION_LINK_CLASS}
            target={isApp ? undefined : "_blank"}
            rel={isApp ? undefined : "noopener noreferrer"}
          >
            Go to Drop
            <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          </Link>
        ) : null}
      </div>
      <div className="tw-mt-2 tw-flex tw-flex-col tw-items-center tw-gap-3 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <h1 className="tw-mb-0 tw-inline-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-2 tw-text-center tw-text-2xl tw-font-semibold tw-text-iron-50 sm:tw-w-auto sm:tw-justify-start sm:tw-gap-3 sm:tw-text-left sm:tw-text-3xl">
          <DropForgeCraftIcon className="tw-h-7 tw-w-7 tw-flex-shrink-0 sm:tw-h-8 sm:tw-w-8" />
          <span className="tw-break-words">{pageTitle}</span>
        </h1>
        <div className="tw-flex tw-w-full tw-justify-center sm:tw-w-auto sm:tw-justify-end">
          <DropForgeTestnetIndicator className="tw-flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
