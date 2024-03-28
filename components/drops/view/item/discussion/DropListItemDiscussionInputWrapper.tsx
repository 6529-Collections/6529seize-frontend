import { useContext, useEffect, useState } from "react";
import DropListItemDiscussionInput from "./DropListItemDiscussionInput";
import { AuthContext } from "../../../../auth/Auth";
import CommonInfoBox from "../../../../user/utils/connected-states/CommonInfoBox";

enum STATE {
  NOT_CONNECTED = "NOT_CONNECTED",
  DONT_HAVE_PROFILE = "DONT_HAVE_PROFILE",
  HAVE_PROFILE = "HAVE_PROFILE",
}

export default function DropListItemDiscussionInputWrapper() {
  const { connectedProfile } = useContext(AuthContext);
  const [state, setState] = useState<STATE>(STATE.NOT_CONNECTED);
  useEffect(() => {
    if (!connectedProfile) {
      setState(STATE.NOT_CONNECTED);
      return;
    }
    if (!connectedProfile.profile) {
      setState(STATE.DONT_HAVE_PROFILE);
      return;
    }
    setState(STATE.HAVE_PROFILE);
  }, [connectedProfile]);

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
      <DropListItemDiscussionInput profile={connectedProfile} />
    ),
  };
  return components[state];
}
