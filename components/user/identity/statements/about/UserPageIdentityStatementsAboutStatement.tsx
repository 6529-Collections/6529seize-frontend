import { CicStatement } from "../../../../../entities/IProfile";

export default function UserPageIdentityStatementsAboutStatement({
  statement,
}: {
  readonly statement: CicStatement | null;
}) {
  if (!statement) {
    return (
     <div className="xl:-tw-mt-1">
       <span className="tw-text-sm tw-italic tw-text-iron-500">
        No About statement yet
      </span>
     </div>
    );
  }
  return (
    <p className="tw-mb-0 tw-mt-2 tw-text-iron-400 tw-text-base tw-font-normal tw-whitespace-pre-line">
      {statement.statement_value}
    </p>
  );
}
