"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
import CreateWaveModal from "./create-wave/CreateWaveModal";
import { useAuth } from "../auth/Auth";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import {
  ActiveDropAction,
  ActiveDropState,
} from "../../types/dropInteractionTypes";
import { ExtendedDrop } from "../../helpers/waves/drop.helpers";
import { DropInteractionParams } from "../waves/drops/Drop";
import PrimaryButton from "../utils/button/PrimaryButton";

const WavesView: React.FC = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { connectedProfile } = useAuth();
  const { isApp } = useDeviceInfo();
  const [serialisedWaveId, setSerialisedWaveId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const waveId = searchParams?.get('wave') || null;
    setSerialisedWaveId(waveId);
  }, [searchParams]);

  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  const onDropContentClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('wave', drop.wave.id);
    params.set('serialNo', `${drop.serial_no}/`);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setActiveDrop(null);
  }, [serialisedWaveId]);

  const onReply = (param: DropInteractionParams) => {
    setActiveDrop({
      action: ActiveDropAction.REPLY,
      drop: param.drop,
      partId: param.partId,
    });
  };

  const onQuote = (param: DropInteractionParams) => {
    setActiveDrop({
      action: ActiveDropAction.QUOTE,
      drop: param.drop,
      partId: param.partId,
    });
  };

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  const component = serialisedWaveId ? (
    <MyStreamWave key={`wave-${serialisedWaveId}`} waveId={serialisedWaveId} />
  ) : (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-center tw-p-8">
      <h2 className="tw-text-xl tw-font-bold tw-text-iron-50 tw-mb-4">
        Select a Wave
      </h2>
      <p className="tw-text-iron-400 tw-max-w-md tw-mb-6">
        Choose a wave from the sidebar to view its content and participate in the discussion.
      </p>
      
      {!isApp && connectedProfile && (
        <PrimaryButton
          onClicked={() => setIsCreateModalOpen(true)}
          disabled={false}
          loading={false}
        >
          <PlusIcon className="tw-w-5 tw-h-5 -tw-ml-1" />
          Create Wave
        </PrimaryButton>
      )}
    
    </div>
  );

  return (
    <>
      <BrainContent
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}>
        {component}
      </BrainContent>

      {/* Create Wave Modal */}
      {connectedProfile && (
        <CreateWaveModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          profile={connectedProfile}
        />
      )}
    </>
  );
};

export default WavesView;
