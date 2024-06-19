import CreateWaveOverviewInput from "./CreateWaveOverviewInput";

export default function CreateWaveOverviewInputs({
  onChange,
}: {
  readonly onChange: (param: {
    readonly key: "name" | "description";
    readonly value: string;
  }) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div className="tw-group tw-w-full tw-relative">
        <CreateWaveOverviewInput valueKey="name" onValueChange={onChange} />
      </div>
      <div className="tw-group tw-w-full tw-relative">
        <CreateWaveOverviewInput
          valueKey="description"
          onValueChange={onChange}
        />
      </div>
    </div>
  );
}
