export default function CreateWaveDatesEndDateHeader({
  endDateIsOptional,
}: {
  readonly endDateIsOptional: boolean;
}) {
  return (
    <p className="tw-mb-0 tw-text-lg  sm:tw-text-xl tw-font-semibold tw-text-iron-50">
      Period{" "}
      {endDateIsOptional && (
        <span className="tw-text-base tw-font-medium tw-text-iron-400">
          (optional)
        </span>
      )}
    </p>
  );
}