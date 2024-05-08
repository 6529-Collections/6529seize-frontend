import { useContext, useEffect, useState } from "react";
import { ProfileProxy } from "../../../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";
import { AuthContext } from "../../../../../../auth/Auth";
import ProfileProxyEndTimeView from "./ProfileProxyEndTimeView";
import ProfileProxyEndTimeEdit from "./ProfileProxyEndTimeEdit";
import CommonChangeAnimation from "../../../../../../utils/animation/CommonChangeAnimation";

enum CreditMode {
  VIEW = "VIEW",
  EDIT = "EDIT",
}

export default function ProfileProxyEndTime({
  profileProxy,
  profileProxyAction,
}: {
  readonly profileProxy: ProfileProxy;
  readonly profileProxyAction: ProfileProxyAction;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const getIsOwner = (): boolean => {
    if (!connectedProfile) {
      return false;
    }
    return (
      connectedProfile?.profile?.external_id === profileProxy.created_by.id
    );
  };

  const [isOwner, setIsOwner] = useState(getIsOwner());
  useEffect(() => setIsOwner(getIsOwner()), [connectedProfile, profileProxy]);
  useEffect(() => {
    if (!isOwner) {
      setMode(CreditMode.VIEW);
    }
  }, [isOwner]);

  const [mode, setMode] = useState<CreditMode>(CreditMode.VIEW);
  const components: Record<CreditMode, JSX.Element> = {
    [CreditMode.VIEW]: (
      <ProfileProxyEndTimeView
        profileProxyAction={profileProxyAction}
        isOwner={isOwner}
        setEditMode={() => setMode(CreditMode.EDIT)}
      />
    ),
    [CreditMode.EDIT]: (
      <ProfileProxyEndTimeEdit
        profileProxy={profileProxy}
        profileProxyAction={profileProxyAction}
        setViewMode={() => setMode(CreditMode.VIEW)}
      />
    ),
  };
  return <CommonChangeAnimation>{components[mode]}</CommonChangeAnimation>;
}
