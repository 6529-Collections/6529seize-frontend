const ShareArrowIcon = ({
  className,
}: {
  readonly className?: string | undefined;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 512 512"
    fill="none"
    stroke="currentColor"
    strokeWidth="32"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M278 42v102h-34C121 144 32 238 20 370c-3 34 2 67 14 98 30-91 104-154 210-154h34v102l214-187L278 42Z" />
  </svg>
);

export default ShareArrowIcon;
