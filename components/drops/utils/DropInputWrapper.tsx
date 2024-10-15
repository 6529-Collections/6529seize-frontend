import { useContext, useEffect, useState } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { AuthContext } from "../../auth/Auth";
import { ProfileConnectedStatus } from "../../../entities/IProfile";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import CommonInfoBox from "../../utils/CommonInfoBox";

export default function DropInputWrapper({
  drop,
  children,
}: {
  readonly drop: ApiDrop;
  readonly children: React.ReactNode;
}) {
  const { connectionStatus } = useContext(AuthContext);

  const getInfoText = (): string | null => {
    switch (connectionStatus) {
      case ProfileConnectedStatus.NOT_CONNECTED:
        return "Please connect to drop";
      case ProfileConnectedStatus.NO_PROFILE:
        return "Please make a profile to drop";
      case ProfileConnectedStatus.PROXY:
        return "Proxy can't drop";

      case ProfileConnectedStatus.HAVE_PROFILE:
        if (!drop.wave.authenticated_user_eligible_to_chat) {
          return "You are not eligible to create a drop in this wave";
        }
        return null;
      default:
        assertUnreachable(connectionStatus);
        return null;
    }
  };

  const [infoText, setInfoText] = useState<string | null>(getInfoText());

  useEffect(() => {
    setInfoText(getInfoText());
  }, [connectionStatus]);
  if (infoText) {
    return (
      <div className="tw-w-full tw-pr-4">
        <CommonInfoBox message={infoText} widthFull={true} />
      </div>
    );
  }

  return <>{children}</>;
}
