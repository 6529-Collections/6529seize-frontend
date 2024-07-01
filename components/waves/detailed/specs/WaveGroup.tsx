import { WaveScope } from "../../../../generated/models/WaveScope";

export default function WaveGroup({
  scope,
  label,
}: {
  readonly scope: WaveScope;
  readonly label: string;
}) {
  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-2">
      <span className="tw-font-medium tw-text-iron-400">{label}</span>
      {scope.group ? (
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {scope.group.author.pfp ? (
            <img
              className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800"
              src={scope.group.author.pfp}
              alt="Profile Picture"
            />
          ) : (
            <div className="tw-h-6 tw-w-6 tw-rounded-lg tw-bg-iron-800" />
          )}
          <span className="tw-font-medium tw-text-white tw-text-base">
            {scope.group.name}
          </span>
        </div>
      ) : (
        <span className="tw-font-medium tw-text-white tw-text-base">
          Anyone
        </span>
      )}
    </div>
  );
}
