import React, { useContext, useRef, useState } from "react";
import CreateWaveDrops from "./drops/CreateWaveDrops";
import CreateWavesMainSteps from "./main-steps/CreateWavesMainSteps";
import CreateWaveOverview from "./overview/CreateWaveOverview";
import CreateWaveGroups from "./groups/CreateWaveGroups";
import CreateWaveDates from "./dates/CreateWaveDates";
import CreateWaveOutcomes from "./outcomes/CreateWaveOutcomes";
import { CreateWaveStep } from "../../../types/waves.types";
import CreateWaveVoting from "./voting/CreateWaveVoting";
import CreateWaveApproval from "./approval/CreateWaveApproval";
import CreateWaveActions from "./utils/CreateWaveActions";
import CreateWaveDescription, {
  CreateWaveDescriptionHandles,
} from "./description/CreateWaveDescription";
import { getCreateNewWaveBody } from "../../../helpers/waves/create-wave.helpers";
import { AuthContext } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { ApiCreateWaveDropRequest } from "../../../generated/models/ApiCreateWaveDropRequest";
import { useRouter } from "next/router";
import { generateDropPart } from "./services/waveMediaService";
import { getAdminGroupId } from "./services/waveGroupService";
import { useAddWaveMutation } from "./services/waveApiService";
import { useWaveConfig } from "./hooks/useWaveConfig";
import useCapacitor from "../../../hooks/useCapacitor";
import CreateWaveFlow from "./CreateWaveFlow";
import { multiPartUpload } from "./services/multiPartUpload";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
export default function CreateWave({
  profile,
  onBack,
}: {
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
}) {
  const router = useRouter();
  const { isIos, keyboardVisible } = useCapacitor();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { waitAndInvalidateDrops, onWaveCreated } = useContext(
    ReactQueryWrapperContext
  );
  const [submitting, setSubmitting] = useState(false);

  // Use the hook for configuration state management
  const {
    config,
    step,
    selectedOutcomeType,
    errors,
    groupsCache,
    // Section updaters
    setOverview,
    setDates,
    setDrops,
    setOutcomes,
    setDropsAdminCanDelete,
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
        message: error as string,
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
      primaryWallet: connectedProfile?.primary_wallet,
      handle: connectedProfile?.handle ?? undefined,
      onError: (error) => {
        setToast({
          message:
            typeof error === "string" ? error : "Failed to get admin group",
          type: "error",
        });
      },
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
      signature: null,
    };

    const picture = config.overview.image
      ? await multiPartUpload({ file: config.overview.image, path: "wave" })
      : null;

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
        adminCanDeleteDrops={config.drops.adminCanDeleteDrops}
        setChatEnabled={onChatEnabledChange}
        onGroupSelect={onGroupSelect}
        setDropsAdminCanDelete={setDropsAdminCanDelete}
      />
    ),
    [CreateWaveStep.DATES]: (
      <CreateWaveDates
        waveType={config.overview.type}
        dates={config.dates}
        setDates={setDates}
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
    <CreateWaveFlow
      onBack={onBack}
      title={`Create Wave ${
        !!config.overview.name && `"${config.overview.name}"`
      }`}>
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
                <div className="tw-flex-1 tw-w-full">{stepComponent[step]}</div>
                {!selectedOutcomeType && (
                  <div className="tw-mt-auto">
                    <CreateWaveActions
                      setStep={(step, direction) => onStep({ step, direction })}
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
    </CreateWaveFlow>
  );
}
