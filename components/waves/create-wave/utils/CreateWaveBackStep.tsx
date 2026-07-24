import Button from "@/components/utils/button/Button";

export default function CreateWaveBackStep({
  onPreviousStep,
}: {
  readonly onPreviousStep: () => void;
}) {
  return (
    <Button
      variant="secondary"
      size="md"
      onClick={onPreviousStep}
    >
      <svg
        className="tw-size-4 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 12H4M4 12L10 18M4 12L10 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span>Previous</span>
    </Button>
  );
}
