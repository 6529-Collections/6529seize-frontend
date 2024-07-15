import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ProfileConnectedStatus } from "../../../../entities/IProfile";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CreateDrop, { CreateDropType } from "../../../drops/create/CreateDrop";
import CommonInfoBox from "../../../utils/CommonInfoBox";
import { Wave } from "../../../../generated/models/Wave";
import { Time } from "../../../../helpers/time";

export default function WaveCreateDrop({ wave }: { readonly wave: Wave }) {
  const { connectedProfile, connectionStatus } = useContext(AuthContext);

  const submissionIsStarted = wave.participation.period?.min
    ? wave.participation.period.min <= Time.currentMillis()
    : true;

  const submissionIsEnded = wave.participation.period?.max
    ? wave.participation.period.max <= Time.currentMillis()
    : false;

  const getInfoText = (): string => {
    if (!submissionIsStarted) {
      return "Submission has not started yet";
    }

    if (submissionIsEnded) {
      return "Submission has ended";
    }

    switch (connectionStatus) {
      case ProfileConnectedStatus.NOT_CONNECTED:
        return "Please connect to create a drop";
      case ProfileConnectedStatus.NO_PROFILE:
        return "Please make a profile to create a drop";
      case ProfileConnectedStatus.PROXY:
        return "Proxy can't create a drop";

      case ProfileConnectedStatus.HAVE_PROFILE:
        if (!wave.participation.authenticated_user_eligible) {
          return "You are not eligible to create a drop in this wave";
        }
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
    connectionStatus === ProfileConnectedStatus.HAVE_PROFILE &&
    wave.participation.authenticated_user_eligible &&
    submissionIsStarted &&
    !submissionIsEnded
  ) {
    return (
      <CreateDrop
        profile={connectedProfile}
        quotedDrop={null}
        type={CreateDropType.DROP}
        wave={{
          name: wave.name,
          image: wave.picture,
          id: wave.id,
        }}
      />
    );
  }

  return (
    <div className="tw-w-full">
      <CommonInfoBox message={infoText} widthFull={true} />
    </div>
  );
}
