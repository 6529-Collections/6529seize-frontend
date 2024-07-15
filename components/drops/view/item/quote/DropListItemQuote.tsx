import { useContext } from "react";
import { AuthContext } from "../../../../auth/Auth";
import CreateDrop, { CreateDropType } from "../../../create/CreateDrop";
import { ProfileConnectedStatus } from "../../../../../entities/IProfile";
import CommonInfoBox from "../../../../user/utils/connected-states/CommonInfoBox";

interface DropListItemQuoteWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string;
}

interface DropListItemQuoteProps {
  readonly quotedDropId: string;
  readonly quotedPartId: number;
  readonly init: boolean;
  readonly wave: DropListItemQuoteWaveProps;
  readonly onSuccessfulDrop: () => void;
}

export default function DropListItemQuote({
  quotedDropId,
  quotedPartId,
  init,
  wave,
  onSuccessfulDrop,
}: DropListItemQuoteProps) {
  const { connectedProfile, connectionStatus } = useContext(AuthContext);

  const components: Record<ProfileConnectedStatus, React.ReactNode> = {
    [ProfileConnectedStatus.NOT_CONNECTED]: (
      <CommonInfoBox>Please connect to make a quote drop</CommonInfoBox>
    ),
    [ProfileConnectedStatus.NO_PROFILE]: (
      <CommonInfoBox>Please make a profile to make a quote drop</CommonInfoBox>
    ),
    [ProfileConnectedStatus.PROXY]: (
      <CommonInfoBox>Proxy can&apos;t make a quote drop</CommonInfoBox>
    ),
    [ProfileConnectedStatus.HAVE_PROFILE]: (
      <>
        {connectedProfile && (
          <CreateDrop
            profile={connectedProfile}
            quotedDrop={{
              dropId: quotedDropId,
              partId: quotedPartId,
            }}
            isClient={init}
            wave={wave}
            type={CreateDropType.QUOTE}
            onSuccessfulDrop={onSuccessfulDrop}
          />
        )}
      </>
    ),
  };
  return (
    <div className="tw-w-full tw-py-5 tw-px-4 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0 tw-border-iron-700">
      {components[connectionStatus]}
    </div>
  );
}
