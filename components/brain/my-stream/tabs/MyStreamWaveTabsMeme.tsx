import React, { useState } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import MyStreamWaveDesktopTabs from "../MyStreamWaveDesktopTabs";
import { useContentTab } from "../../ContentTabContext";
import MemesArtSubmissionModal from "../../../waves/memes/MemesArtSubmissionModal";
import MyStreamWaveTabsMemeSubmit from "./MyStreamWaveTabsMemeSubmit";

interface MyStreamWaveTabsMemeProps {
  readonly wave: ApiWave;
}

const MyStreamWaveTabsMeme: React.FC<MyStreamWaveTabsMemeProps> = ({
  wave,
}) => {
  // Get the active tab and utilities from global context
  const { activeContentTab, setActiveContentTab } = useContentTab();
  const [isMemesModalOpen, setIsMemesModalOpen] = useState(true);

  // Update your "Submit to Memes" button handler
  const handleMemesSubmit = () => {
    setIsMemesModalOpen(true);
  };

  return (
    <>
      {" "}
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-y-3 tw-mt-2">
        {/* Title and Submit button */}
        <div className="tw-flex tw-items-center tw-justify-between">
          <h1 className="tw-text-2xl tw-font-semibold tw-text-iron-100 tw-mb-0">
            Weekly Rolling Wave (Long-Term)
          </h1>
          <div className="tw-flex-shrink-0">
            <MyStreamWaveTabsMemeSubmit handleMemesSubmit={handleMemesSubmit} />
          </div>
        </div>

        <MyStreamWaveDesktopTabs
          activeTab={activeContentTab}
          wave={wave}
          setActiveTab={setActiveContentTab}
        />
      </div>
      <MemesArtSubmissionModal
        isOpen={isMemesModalOpen}
        onClose={() => setIsMemesModalOpen(false)}
        onSubmit={() => {
          setIsMemesModalOpen(false);
        }}
      />
    </>
  );
};

export default MyStreamWaveTabsMeme;
