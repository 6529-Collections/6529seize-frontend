import CreateWaveOverviewInput from "./CreateWaveOverviewInput";

export default function CreateWaveOverviewInputs({
  name,
  description,
  onChange,
}: {
  readonly name: string;
  readonly description: string;
  readonly onChange: (param: {
    readonly key: "name" | "description";
    readonly value: string;
  }) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-6">
      <div className="tw-group tw-w-full tw-relative">
        <CreateWaveOverviewInput
          valueKey="name"
          onValueChange={onChange}
          value={name}
        />
      </div>
      <div className="tw-group tw-w-full tw-relative">
        <CreateWaveOverviewInput
          valueKey="description"
          value={description}
          onValueChange={onChange}
        />
      </div>
    </div>
  );
}
