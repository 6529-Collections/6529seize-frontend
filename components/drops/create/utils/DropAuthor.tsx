import Link from "next/link";
import { useRouter } from "next/router";
import { getTimeAgo } from "../../../../helpers/Helpers";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";

export enum DropAuthorSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

export default function DropAuthor({
  handle,
  timestamp,
  size = DropAuthorSize.MEDIUM,
}: {
  readonly handle: string;
  readonly timestamp: number;
  readonly size?: DropAuthorSize;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string)?.toLowerCase();
  const amIAuthor = handle.toLowerCase() === handleOrWallet;

  const getTextClasses = (): string => {
    switch (size) {
      case DropAuthorSize.SMALL:
        return "tw-text-sm";
      case DropAuthorSize.MEDIUM:
        return "tw-text-md";
      default:
        assertUnreachable(size);
        return "";
    }
  };

  const textClasses = getTextClasses();
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      {amIAuthor ? (
        <p
          className={`${textClasses} tw-font-semibold tw-mb-0 tw-leading-none tw-text-iron-50`}
        >
          {handle}
        </p>
      ) : (
        <p
          className={`${textClasses} tw-mb-0 tw-leading-none tw-font-semibold tw-text-iron-50`}
        >
          <Link
            href={`/${handle}`}
            className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
          >
            {handle}
          </Link>
        </p>
      )}
      <span className="tw-text-iron-500">&bull;</span>
      <p
        className={`${textClasses} tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500`}
      >
        {getTimeAgo(timestamp)}
      </p>
    </div>
  );
}
