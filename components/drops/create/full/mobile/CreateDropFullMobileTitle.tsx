export default function CreateDropFullMobileTitle({
  title,
  onTitle,
}: {
  readonly title: string | null;
  readonly onTitle: (newV: string | null) => void;
}) {
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      onTitle(null);
      return;
    }
    onTitle(e.target.value);
  };
  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between">
      <input
        type="text"
        placeholder="Drop title"
        value={title ?? ""}
        maxLength={250}
        onChange={onInput}
        className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-600 focus:tw-ring-primary-400 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
      />
    </div>
  );
}
