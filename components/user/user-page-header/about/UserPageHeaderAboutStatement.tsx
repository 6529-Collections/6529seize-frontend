import { CicStatement } from "../../../../entities/IProfile";

export default function UserPageHeaderAboutStatement({
  statement,
}: {
  readonly statement: CicStatement | null;
}) {
  if (!statement) {
    return (
      <div className="tw-mt-3 tw-text-sm tw-italic tw-text-iron-500">
        No About statement set yet. Click to add one.
      </div>
    );
  }
  return (
    <div className="tw-mb-0 tw-mt-2 tw-text-iron-400 tw-text-base tw-font-normal tw-whitespace-pre-line">
      {statement.statement_value}
    </div>
  );
}
