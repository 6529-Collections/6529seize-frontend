const WatchTowerIcon = ({
  className,
}: {
  readonly className?: string | undefined;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M0 0C2 26 2 54 7 76C11 92 24 98 50 100C76 98 89 92 93 76C98 54 98 26 100 0L91 42C87 62 81 78 70 88C64 93 57 96 50 98C43 96 36 93 30 88C19 78 13 62 9 42Z"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M8 39C20 27 34 23 50 23C66 23 80 27 92 39C80 51 66 55 50 55C34 55 20 51 8 39ZM50 27C46.5 34 46.5 44 50 51C53.5 44 53.5 34 50 27Z"
    />
  </svg>
);

export default WatchTowerIcon;
