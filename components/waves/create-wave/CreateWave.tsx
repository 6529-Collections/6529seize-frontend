import React, { useContext, useRef, useState } from "react";
import CreateWaveDrops from "./drops/CreateWaveDrops";
import CreateWavesMainSteps from "./main-steps/CreateWavesMainSteps";
import CreateWaveOverview from "./overview/CreateWaveOverview";
import CreateWaveGroups from "./groups/CreateWaveGroups";
import CreateWaveDates from "./dates/CreateWaveDates";
import CreateWaveOutcomes from "./outcomes/CreateWaveOutcomes";
import {
  CreateWaveStep,
} from "../../../types/waves.types";
import CreateWaveVoting from "./voting/CreateWaveVoting";
import CreateWaveApproval from "./approval/CreateWaveApproval";
import CreateWaveActions from "./utils/CreateWaveActions";
import CreateWaveDescription, {
  CreateWaveDescriptionHandles,
} from "./description/CreateWaveDescription";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { getCreateNewWaveBody } from "../../../helpers/waves/create-wave.helpers";
import { AuthContext } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { ApiCreateWaveDropRequest } from "../../../generated/models/ApiCreateWaveDropRequest";
import { useRouter } from "next/router";
import { 
  generateMediaForPart, 
  generateMediaForOverview, 
  generateDropPart 
} from "./services/waveMediaService";
import {
  getAdminGroupId
} from "./services/waveGroupService";
import {
  useAddWaveMutation
} from "./services/waveApiService";
import { useWaveConfig } from "./hooks/useWaveConfig";
import useCapacitor from "../../../hooks/useCapacitor";
import useIsMobileScreen from "../../../hooks/isMobileScreen";

export default function CreateWave({
  profile,
  onBack,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly onBack: () => void;
}) {
  const router = useRouter();
  const isMobile = useIsMobileScreen();
  const { isIos, keyboardVisible } = useCapacitor();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { waitAndInvalidateDrops, onWaveCreated } = useContext(
    ReactQueryWrapperContext
  );
  const [submitting, setSubmitting] = useState(false);
  
  // Use the hook for configuration state management
  const {
    config,
    endDateConfig,
    setEndDateConfig,
    step,
    selectedOutcomeType,
    errors,
    groupsCache,
    // Section updaters
    setOverview,
    setDates,
    setDrops,
    setOutcomes,
    // Navigation
    onStep,
    // Outcome management
    onOutcomeTypeChange,
    // Group handling
    onGroupSelect,
    // Voting
    onVotingTypeChange,
    onCategoryChange,
    onProfileIdChange,
    onTimeWeightedVotingChange,
    // Approval
    onThresholdChange,
    onThresholdTimeChange,
    // Chat
    onChatEnabledChange,
  } = useWaveConfig();

  const createWaveDescriptionRef = useRef<CreateWaveDescriptionHandles | null>(
    null
  );


  const addWaveMutation = useAddWaveMutation({
    onSuccess: (response) => {
      waitAndInvalidateDrops();
      onWaveCreated();
      router.push(`/my-stream?wave=${response.id}`);
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  const [showDropError, setShowDropError] = useState(false);

  const onHaveDropToSubmitChange = (haveDrop: boolean) => {
    if (haveDrop) setShowDropError(false);
  };



  const onComplete = async () => {
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }
    const drop = createWaveDescriptionRef.current?.requestDrop() ?? null;
    if (!drop?.parts.length) {
      setSubmitting(false);
      setShowDropError(true);
      return;
    }

    const adminGroupId = await getAdminGroupId({
      adminGroupId: config.groups.admin,
      primaryWallet: connectedProfile?.profile?.primary_wallet,
      handle: connectedProfile?.profile?.handle,
      onError: (error) => {
        setToast({
          message: typeof error === 'string' ? error : "Failed to get admin group",
          type: "error",
        });
      }
    });
    if (!adminGroupId) {
      setSubmitting(false);
      return;
    }

    const dropParts = await Promise.all(
      drop.parts.map((part) => generateDropPart(part))
    );

    const dropRequest: ApiCreateWaveDropRequest = {
      title: drop.title,
      parts: dropParts.map((part) => ({
        content: part.content,
        quoted_drop: part.quoted_drop,
        media: part.media.map((media) => ({
          url: media.url,
          mime_type: media.mime_type,
        })),
      })),
      referenced_nfts: drop.referenced_nfts.map((nft) => ({
        contract: nft.contract,
        token: nft.token,
        name: nft.name,
      })),
      mentioned_users: drop.mentioned_users.map((user) => ({
        mentioned_profile_id: user.mentioned_profile_id,
        handle_in_content: user.handle_in_content,
      })),
      metadata: drop.metadata.map((meta) => ({
        data_key: meta.data_key,
        data_value: meta.data_value,
      })),
      // TODO: fix it
      signature: null,
    };

    const picture = await generateMediaForOverview(config.overview.image);

    const waveBody = getCreateNewWaveBody({
      config: {
        ...config,
        groups: {
          ...config.groups,
          admin: adminGroupId,
        },
      },
      picture: picture?.url ?? null,
      drop: dropRequest,
    });

    await addWaveMutation.mutateAsync(waveBody);
  };

  const stepComponent: Record<CreateWaveStep, JSX.Element> = {
    [CreateWaveStep.OVERVIEW]: (
      <CreateWaveOverview
        overview={config.overview}
        errors={errors}
        setOverview={setOverview}
      />
    ),
    [CreateWaveStep.GROUPS]: (
      <CreateWaveGroups
        waveType={config.overview.type}
        groups={config.groups}
        groupsCache={groupsCache}
        chatEnabled={config.chat.enabled}
        setChatEnabled={onChatEnabledChange}
        onGroupSelect={onGroupSelect}
      />
    ),
    [CreateWaveStep.DATES]: (
      <CreateWaveDates
        waveType={config.overview.type}
        dates={config.dates}
        errors={errors}
        setDates={setDates}
        endDateConfig={endDateConfig}
        setEndDateConfig={setEndDateConfig}
      />
    ),
    [CreateWaveStep.DROPS]: (
      <CreateWaveDrops
        waveType={config.overview.type}
        drops={config.drops}
        errors={errors}
        setDrops={setDrops}
      />
    ),
    [CreateWaveStep.VOTING]: (
      <CreateWaveVoting
        waveType={config.overview.type}
        selectedType={config.voting.type}
        category={config.voting.category}
        profileId={config.voting.profileId}
        errors={errors}
        onTypeChange={onVotingTypeChange}
        setCategory={onCategoryChange}
        setProfileId={onProfileIdChange}
        timeWeighted={config.voting.timeWeighted}
        onTimeWeightedChange={onTimeWeightedVotingChange}
      />
    ),
    [CreateWaveStep.APPROVAL]: (
      <CreateWaveApproval
        threshold={config.approval.threshold}
        thresholdTimeMs={config.approval.thresholdTimeMs}
        errors={errors}
        setThreshold={onThresholdChange}
        setThresholdTimeMs={onThresholdTimeChange}
      />
    ),
    [CreateWaveStep.OUTCOMES]: (
      <CreateWaveOutcomes
        outcomes={config.outcomes}
        outcomeType={selectedOutcomeType}
        waveType={config.overview.type}
        errors={errors}
        dates={config.dates}
        setOutcomeType={onOutcomeTypeChange}
        setOutcomes={setOutcomes}
      />
    ),
    [CreateWaveStep.DESCRIPTION]: (
      <CreateWaveDescription
        ref={createWaveDescriptionRef}
        profile={profile}
        showDropError={showDropError}
        wave={{
          name: config.overview.name,
          image: config.overview.image
            ? URL.createObjectURL(config.overview.image)
            : null,
          id: null,
        }}
        onHaveDropToSubmitChange={onHaveDropToSubmitChange}
      />
    ),
  };

  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-28 tw-px-4 xl:tw-px-0 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto tw-min-h-screen">
      <div className="tw-h-full tw-w-full">
        <div className="xl:tw-max-w-[60rem] tw-mx-auto">
          <button
            onClick={onBack}
            type="button"
            className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50">
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 12H4M4 12L10 18M4 12L10 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"></path>
            </svg>
            <span>Back</span>
          </button>
          <div
            className={`tw-mb-0 tw-font-bold ${
              isMobile ? "tw-text-3xl" : "tw-text-5xl"
            }`}>
            Create Wave {!!config.overview.name && `"${config.overview.name}"`}
          </div>
        </div>
        <div className="tw-mt-4 md:tw-mt-8 xl:tw-max-w-[60rem] tw-mx-auto lg:tw-flex tw-gap-x-16 tw-justify-between tw-h-full tw-w-full">
          <div className="tw-1/4">
            <CreateWavesMainSteps
              activeStep={step}
              waveType={config.overview.type}
              onStep={(step) => onStep({ step, direction: "backward" })}
            />
          </div>
          <div
            className={`tw-flex-1 ${
              isIos && !keyboardVisible ? "tw-mb-10" : ""
            }`}>
            <div className="tw-relative tw-w-full tw-bg-iron-900 tw-p-4 lg:tw-p-8 tw-rounded-xl">
              <div className="tw-relative tw-h-full">
                <div className="tw-flex tw-flex-col tw-h-full">
                  <div className="tw-flex-1 tw-w-full">
                    {stepComponent[step]}
                  </div>
                  {!selectedOutcomeType && (
                    <div className="tw-mt-auto">
                      <CreateWaveActions
                        setStep={(step, direction) =>
                          onStep({ step, direction })
                        }
                        step={step}
                        config={config}
                        submitting={submitting}
                        onComplete={onComplete}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
