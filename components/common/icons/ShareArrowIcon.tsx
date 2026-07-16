const ShareArrowIcon = ({
  className,
}: {
  readonly className?: string | undefined;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.6"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m15 5.75 6.25 6.25L15 18.25"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.5 12H11a8.25 8.25 0 0 0-8.25 8.25v.5A10 10 0 0 1 11 16.5h3"
    />
  </svg>
);

export default ShareArrowIcon;
