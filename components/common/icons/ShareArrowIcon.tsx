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
      d="M12 15.5V3.75m0 0L7.75 8M12 3.75 16.25 8"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.25 11v7.25C6.25 19.22 7.03 20 8 20h8c.97 0 1.75-.78 1.75-1.75V11"
    />
  </svg>
);

export default ShareArrowIcon;
