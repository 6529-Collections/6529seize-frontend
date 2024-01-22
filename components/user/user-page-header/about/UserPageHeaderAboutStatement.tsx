import { CicStatement } from "../../../../entities/IProfile";

export default function UserPageHeaderAboutStatement({
  statement,
}: {
  readonly statement: CicStatement | null;
}) {
  if (!statement) {
    return (
      <div className="tw-mt-3 tw-text-sm tw-italic">
        Click to add an About statement
      </div>
    );
  }
  return (
    <div className="tw-mb-0 tw-text-iron-200 tw-text-sm sm:tw-text-base tw-font-normal tw-whitespace-pre-line">
      {statement.statement_value}
    </div>
  );
}
