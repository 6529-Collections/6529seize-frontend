import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../../../auth/Auth";
import CommonInfoBox from "../../../../../../user/utils/connected-states/CommonInfoBox";
import DropPartDiscussionInput from "./DropPartDiscussionInput";
import { Drop } from "../../../../../../../generated/models/Drop";
import { DropPart } from "../../../../../../../generated/models/DropPart";

enum STATE {
  NOT_CONNECTED = "NOT_CONNECTED",
  DONT_HAVE_PROFILE = "DONT_HAVE_PROFILE",
  HAVE_PROFILE = "HAVE_PROFILE",
}

export default function DropPartDiscussionInputWrapper({
  drop,
  dropPart,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const getConnectedState = () => {
    if (!connectedProfile) {
      return STATE.NOT_CONNECTED;
    }
    if (!connectedProfile.profile) {
      return STATE.DONT_HAVE_PROFILE;
    }
    return STATE.HAVE_PROFILE;
  };
  const [state, setState] = useState<STATE>(getConnectedState());
  useEffect(() => setState(getConnectedState()), [connectedProfile]);

  const components: Record<STATE, React.ReactNode> = {
    [STATE.NOT_CONNECTED]: (
      <CommonInfoBox>
        Please connect to take part in the discussion
      </CommonInfoBox>
    ),
    [STATE.DONT_HAVE_PROFILE]: (
      <CommonInfoBox>
        Please make a profile to take part in the discussion
      </CommonInfoBox>
    ),
    [STATE.HAVE_PROFILE]: (
      <DropPartDiscussionInput drop={drop} dropPart={dropPart} />
    ),
  };
  return components[state];
}