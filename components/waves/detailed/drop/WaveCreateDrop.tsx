import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ProfileConnectedStatus } from "../../../../entities/IProfile";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CreateDrop, { CreateDropType } from "../../../drops/create/CreateDrop";
import CommonInfoBox from "../../../utils/CommonInfoBox";

export default function WaveCreateDrop() {
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
        type={CreateDropType.DROP}
      />
    );
  }

  return <CommonInfoBox message={infoText} />;
}