interface MarketplaceExternalOpenIconProps {
  readonly className: string;
  readonly testId?: string | undefined;
}

export default function MarketplaceExternalOpenIcon({
  className,
  testId,
}: MarketplaceExternalOpenIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      fill="none"
      aria-hidden="true"
      data-testid={testId}
    >
      <path
        d="M13.5 6H18M18 6V10.5M18 6L10.5 13.5M7.5 8.25H6C4.75736 8.25 3.75 9.25736 3.75 10.5V18C3.75 19.2426 4.75736 20.25 6 20.25H13.5C14.7426 20.25 15.75 19.2426 15.75 18V16.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
