import { ProfileProxyAction } from "../../../../../generated/models/ProfileProxyAction";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { useState } from "react";
import ProxyActionRowDataMode from "./ProxyActionRowDataMode";
import CommonChangeAnimation from "../../../../utils/animation/CommonChangeAnimation";
import ProfileProxyCreditEdit from "../action/utils/credit/ProfileProxyCreditEdit";
import ProfileProxyEndTimeEdit from "../action/utils/time/ProfileProxyEndTimeEdit";

export enum PROXY_ACTION_ROW_VIEW_MODE {
  DATA = "DATA",
  CREDIT_EDIT = "CREDIT_EDIT",
  END_TIME_EDIT = "END_TIME_EDIT",
}

export default function ProxyActionRow({
  action,
  profileProxy,
  profile,
  isSelf,
}: {
  readonly action: ProfileProxyAction;
  readonly profileProxy: ProfileProxy;
  readonly profile: IProfileAndConsolidations;
  readonly isSelf: boolean;
}) {
  const [viewMode, setViewMode] = useState(PROXY_ACTION_ROW_VIEW_MODE.DATA);

  const components: Record<PROXY_ACTION_ROW_VIEW_MODE, JSX.Element> = {
    [PROXY_ACTION_ROW_VIEW_MODE.DATA]: (
      <ProxyActionRowDataMode
        action={action}
        profileProxy={profileProxy}
        profile={profile}
        isSelf={isSelf}
        setViewMode={setViewMode}
      />
    ),
    [PROXY_ACTION_ROW_VIEW_MODE.CREDIT_EDIT]: (
      <ProfileProxyCreditEdit
        profileProxy={profileProxy}
        profileProxyAction={action}
        setViewMode={() => setViewMode(PROXY_ACTION_ROW_VIEW_MODE.DATA)}
      />
    ),
    [PROXY_ACTION_ROW_VIEW_MODE.END_TIME_EDIT]: (
      <ProfileProxyEndTimeEdit
        profileProxy={profileProxy}
        profileProxyAction={action}
        setViewMode={() => setViewMode(PROXY_ACTION_ROW_VIEW_MODE.DATA)}
      />
    ),
  };

  return (
    <div className="tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-iron-600">
      <CommonChangeAnimation key={action.id}>
        {components[viewMode]}
      </CommonChangeAnimation>
    </div>
  );
}
