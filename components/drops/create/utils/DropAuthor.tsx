import Link from "next/link";
import { useRouter } from "next/router";
import { getTimeAgo } from "../../../../helpers/Helpers";

export default function DropAuthor({
  handle,
  timestamp,
}: {
  readonly handle: string;
  readonly timestamp: number;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string)?.toLowerCase();
  const amIAuthor = handle.toLowerCase() === handleOrWallet;
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      {amIAuthor ? (
        <p className="tw-mb-0 tw-text-md tw-leading-none tw-font-semibold tw-text-iron-50">
          {handle}
        </p>
      ) : (
        <p className="tw-mb-0 tw-text-md tw-leading-none tw-font-semibold tw-text-iron-50">
          <Link
            href={`/${handle}`}
            className="tw-no-underline hover:tw-underline hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
          >
            {handle}
          </Link>
        </p>
      )}
      <span className="tw-text-iron-500">&bull;</span>
      <p className="tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-text-md tw-leading-none tw-text-iron-500">
        {getTimeAgo(timestamp)}
      </p>
    </div>
  );
}
