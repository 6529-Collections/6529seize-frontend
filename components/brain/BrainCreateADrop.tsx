import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/Auth";
import CreateDrop, { CreateDropType } from "../drops/create/CreateDrop";
import CommonInfoBox from "../user/utils/connected-states/CommonInfoBox";
import { ProfileConnectedStatus } from "../../entities/IProfile";
import { assertUnreachable } from "../../helpers/AllowlistToolHelpers";
import { Wave } from "../../generated/models/Wave";

export default function BrainCreateADrop() {
  const { connectedProfile, connectionStatus } = useContext(AuthContext);

  const getInfoText = (): string => {
    switch (connectionStatus) {
      case ProfileConnectedStatus.NOT_CONNECTED:
        return "Please connect to create a drop";
      case ProfileConnectedStatus.NO_PROFILE:
        return "Please make a profile to create a drop";
      case ProfileConnectedStatus.HAVE_PROFILE:
        return "";
      default:
        assertUnreachable(connectionStatus);
        return "";
    }
  };

  const [infoText, setInfoText] = useState<string>(getInfoText());

  useEffect(() => {
    setInfoText(getInfoText());
  }, [connectionStatus]);

  if (
    connectedProfile &&
    connectionStatus === ProfileConnectedStatus.HAVE_PROFILE
  ) {
    return (
      <CreateDrop
        profile={connectedProfile}
        quotedDrop={null}
        // TODO: Add wave id
        waveId=""
        // TODO: Add isDescriptionDrop
        isDescriptionDrop={false}
        // TODO: Add wave name
        waveName=""
        type={CreateDropType.DROP}
      />
    );
  }

  return <CommonInfoBox>{infoText}</CommonInfoBox>;
}
