import { useContext } from "react";
import { AuthContext } from "../../../../auth/Auth";
import CreateDrop, { CreateDropType } from "../../../create/CreateDrop";
import { ProfileConnectedStatus } from "../../../../../entities/IProfile";
import CommonInfoBox from "../../../../user/utils/connected-states/CommonInfoBox";
import { Drop } from "../../../../../generated/models/Drop";

interface DropListItemQuoteWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string;
}

interface DropListItemQuoteProps {
  readonly quotedDrop: Drop;
  readonly quotedPartId: number;
  readonly init: boolean;
  readonly onSuccessfulDrop: () => void;
}

export default function DropListItemQuote({
  quotedDrop,
  quotedPartId,
  init,
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
        {connectedProfile &&
        quotedDrop.wave.authenticated_user_eligible_to_participate ? (
          <CreateDrop
            profile={connectedProfile}
            quotedDrop={{
              dropId: quotedDrop.id,
              partId: quotedPartId,
            }}
            showProfile={false}
            isClient={init}
            wave={{
              name: quotedDrop.wave.name,
              image: quotedDrop.wave.picture,
              id: quotedDrop.wave.id,
            }}
            type={CreateDropType.QUOTE}
            onSuccessfulDrop={onSuccessfulDrop}
          />
        ) : (
          <CommonInfoBox>
            You are not eligible to make a quote drop in this wave
          </CommonInfoBox>
        )}
      </>
    ),
  };
  return (
    <div className="tw-w-full tw-px-4 tw-pb-2 tw-pt-2">
      {components[connectionStatus]}
    </div>
  );
}
