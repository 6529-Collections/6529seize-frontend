import Link from "next/link";
import { useRouter } from "next/router";
import { DropAuthorSize } from "./DropAuthor";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { ProfileMin } from "../../../../../generated/models/ProfileMin";

export default function DropAuthorHandle({
  profile: { handle },
  size,
}: {
  readonly profile: ProfileMin;
  readonly size: DropAuthorSize;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string)?.toLowerCase();
  const amIAuthor = handle.toLowerCase() === handleOrWallet;

  const getTextClasses = (): string => {
    switch (size) {
      case DropAuthorSize.SMALL:
        return "tw-text-sm";
      case DropAuthorSize.MEDIUM:
        return "tw-text-base";
      default:
        assertUnreachable(size);
        return "";
    }
  };

  const textClasses = getTextClasses();

  if (amIAuthor) {
    return (
      <p
        className={`${textClasses} tw-font-semibold tw-mb-0 tw-leading-none tw-text-iron-50`}
      >
        {handle}
      </p>
    );
  }

  return (
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
  );
}
