import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

import type { ValidatorInstallerKind } from "@/lib/validator-page/releaseFiles";
import { SECONDARY_BUTTON } from "./validatorStyles";

type DownloadRowItem = {
  readonly title: string;
  /** One short line: the systems and CPUs it is for. */
  readonly summary: string;
  readonly size: string | null;
  readonly href: string;
  readonly fileName: string;
  /** The system's logo, from /public. */
  readonly image: string;
};

export type ValidatorDownloadOption = DownloadRowItem & {
  readonly kind: ValidatorInstallerKind;
};

/** One file in a list, with the same small button as every other list. */
export default function ValidatorDownloadRow({
  option,
}: {
  readonly option: DownloadRowItem;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3">
      <span className="tw-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
        <Image
          unoptimized
          src={option.image}
          alt=""
          width={22}
          height={22}
          className="tw-size-[22px] tw-object-contain"
        />
      </span>
      <div className="tw-min-w-0 tw-flex-1">
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
          {option.title}
        </p>
        <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
          {option.summary}
          {option.size && ` · ${option.size}`}
        </p>
      </div>
      <a
        href={option.href}
        className={SECONDARY_BUTTON}
        aria-label={`Download ${option.fileName}`}
      >
        <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
        Download
      </a>
    </div>
  );
}
