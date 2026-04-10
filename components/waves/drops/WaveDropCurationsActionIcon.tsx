export default function WaveDropCurationsActionIcon({
  className,
}: {
  readonly className?: string | undefined;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.75 5.25H20.25L13.5 13.125V19.125L10.5 17.625V13.125L3.75 5.25Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
