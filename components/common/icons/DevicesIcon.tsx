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
    <path d="M16.9 8.5V6.5a1.8 1.8 0 0 0-1.8-1.8H4.2a1.8 1.8 0 0 0-1.8 1.8v6.4a1.8 1.8 0 0 0 1.8 1.8h7.1" />
    <path d="M9.4 18.7v-3.5" />
    <path d="M6.8 18.7h5.2" />
    <rect x="13.15" y="8.9" width="6" height="10.4" rx="2" />
    <circle
      cx="16.15"
      cy="17.45"
      r="0.45"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

export default DevicesIcon;
