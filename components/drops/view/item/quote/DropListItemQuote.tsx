import { useContext } from "react";
import { AuthContext } from "../../../../auth/Auth";
import CreateDrop, { CreateDropType } from "../../../create/CreateDrop";
import { ProfileConnectedStatus } from "../../../../../entities/IProfile";
import CommonInfoBox from "../../../../user/utils/connected-states/CommonInfoBox";


export default function DropListItemQuote({
  waveId,
  quotedDropId,
  quotedPartId,
  init,
  isDescriptionDrop,
  waveName,
  waveImage,
  onSuccessfulDrop,
}: {
  readonly waveId: string;
  readonly quotedDropId: string;
  readonly quotedPartId: number;
  readonly init: boolean;
  readonly isDescriptionDrop: boolean;
  readonly waveName: string;
  readonly waveImage: string | null;
  readonly onSuccessfulDrop: () => void;
}) {
  const { connectedProfile, connectionStatus } = useContext(AuthContext);

  const components: Record<ProfileConnectedStatus, React.ReactNode> = {
    [ProfileConnectedStatus.NOT_CONNECTED]: (
      <CommonInfoBox>Please connect to make a quote drop</CommonInfoBox>
    ),
    [ProfileConnectedStatus.NO_PROFILE]: (
      <CommonInfoBox>Please make a profile to make a quote drop</CommonInfoBox>
    ),
    [ProfileConnectedStatus.HAVE_PROFILE]: (
      <>
        {connectedProfile && (
          <CreateDrop
            profile={connectedProfile}
            waveId={waveId}
            quotedDrop={{
              dropId: quotedDropId,
              partId: quotedPartId,
            }}
            isClient={init}
            isDescriptionDrop={isDescriptionDrop}
            waveName={waveName}
            waveImage={waveImage}
            type={CreateDropType.QUOTE}
            onSuccessfulDrop={onSuccessfulDrop}
          />
        )}
      </>
    ),
  };
  return (
    <div className="tw-w-full tw-py-5 tw-px-4 sm:tw-px-5 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0 tw-border-iron-700">
      {components[connectionStatus]}
    </div>
  );
}
