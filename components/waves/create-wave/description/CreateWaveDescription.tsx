import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import CreateDrop, { CreateDropType } from "../../../drops/create/CreateDrop";

export default function CreateWaveDescription({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        Description
      </p>
      <p className="tw-mt-2 tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-400">
        Give a good description of your wave so participants know what you
        expect in this wave. More information, including any content moderation
        parameters, is better than less.
      </p>
      <div className="tw-mt-6">
        <CreateDrop
          profile={profile}
          quotedDrop={null}
          type={CreateDropType.DROP}
        />
      </div>
    </div>
  );
}
