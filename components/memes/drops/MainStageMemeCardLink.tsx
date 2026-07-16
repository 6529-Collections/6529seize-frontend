import Link from "next/link";

interface MainStageMemeCardLinkProps {
  readonly memeCardId: number | null | undefined;
  readonly variant?: "compact" | "prominent";
}

interface MainStageMemeCardPillProps extends MainStageMemeCardLinkProps {
  readonly href?: string | undefined;
}

export function isValidMemeCardId(
  memeCardId: number | null | undefined
): memeCardId is number {
  return (
    typeof memeCardId === "number" &&
    Number.isSafeInteger(memeCardId) &&
    memeCardId >= 1
  );
}

export function MainStageMemeCardPill({
  memeCardId,
  href,
  variant = "compact",
}: MainStageMemeCardPillProps) {
  if (!isValidMemeCardId(memeCardId)) {
    return null;
  }

  const className = `tw-inline-flex tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-font-semibold tw-text-primary-300 ${
    variant === "prominent"
      ? "tw-min-h-9 tw-px-4 tw-py-1.5 tw-text-base tw-leading-5"
      : "tw-px-2.5 tw-py-0.5 tw-text-xs"
  }`;
  const label = `The Memes #${memeCardId}`;

  if (!href) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      scroll={false}
      className={`${className} tw-no-underline tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-primary-300/60 desktop-hover:hover:tw-text-white`}
    >
      {label}
    </Link>
  );
}

export default function MainStageMemeCardLink({
  memeCardId,
  variant = "compact",
}: MainStageMemeCardLinkProps) {
  return (
    <MainStageMemeCardPill
      memeCardId={memeCardId}
      href={
        isValidMemeCardId(memeCardId) ? `/the-memes/${memeCardId}` : undefined
      }
      variant={variant}
    />
  );
}
