const DevicesIcon = ({
  className,
}: {
  readonly className?: string | undefined;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="1 2 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M17.7 8.3V6.3a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
    <path d="M10 19v-3.66 2.85" />
    <path d="M7 19h5" />
    <rect x="13.35" y="9.6" width="6" height="10" rx="2" />
    <circle cx="16.35" cy="17.5" r="0.45" fill="currentColor" stroke="none" />
  </svg>
);

export default DevicesIcon;
