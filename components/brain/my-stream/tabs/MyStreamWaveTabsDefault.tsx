import React from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import { useContentTab } from "../../ContentTabContext";
interface MyStreamWaveTabsDefaultProps {
  readonly wave: ApiWave;
}

const MyStreamWaveTabsDefault: React.FC<MyStreamWaveTabsDefaultProps> = ({
  wave,
}) => {
  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab } = useContentTab();
  return (
    <MyStreamWaveDesktopTabs
      activeTab={activeContentTab}
      wave={wave}
      setActiveTab={setActiveContentTab}
      hideMyVotes={true}
    />
  );
};

export default MyStreamWaveTabsDefault;
