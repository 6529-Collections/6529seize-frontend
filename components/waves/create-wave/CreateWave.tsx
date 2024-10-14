import React, { useContext, useEffect, useRef, useState } from "react";
import CreateWaveDrops from "./drops/CreateWaveDrops";
import CreateWavesMainSteps from "./main-steps/CreateWavesMainSteps";
import CreateWaveOverview from "./overview/CreateWaveOverview";
import CreateWaveGroups from "./groups/CreateWaveGroups";
import CreateWaveDates from "./dates/CreateWaveDates";
import CreateWaveOutcomes from "./outcomes/CreateWaveOutcomes";
import {
  CreateWaveConfig,
  CreateWaveGroupConfigType,
  CreateWaveOutcomeType,
  CreateWaveStep,
  WaveSignatureType,
} from "../../../types/waves.types";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import CreateWaveVoting from "./voting/CreateWaveVoting";
import CreateWaveApproval from "./approval/CreateWaveApproval";
import { ApiGroupFull } from "../../../generated/models/ApiGroupFull";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import CreateWaveActions from "./utils/CreateWaveActions";
import CreateWaveDescription, {
  CreateWaveDescriptionHandles,
} from "./description/CreateWaveDescription";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import {
  CREATE_WAVE_VALIDATION_ERROR,
  getCreateNewWaveBody,
  getCreateWaveValidationErrors,
} from "../../../helpers/waves/create-wave.helpers";
import { ApiCreateNewWave } from "../../../generated/models/ApiCreateNewWave";
import { AuthContext } from "../../auth/Auth";
import {
  CreateDropPart,
  CreateDropRequestPart,
  DropMedia,
} from "../../../entities/IDrop";
import { commonApiPost } from "../../../services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { ApiCreateWaveDropRequest } from "../../../generated/models/ApiCreateWaveDropRequest";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useRouter } from "next/router";
import { ApiGroupFilterDirection } from "../../../generated/models/ApiGroupFilterDirection";
import { ApiCreateGroup } from "../../../generated/models/ApiCreateGroup";
import { Time } from "../../../helpers/time";

export default function CreateWave({
  profile,
  onBack,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly onBack: () => void;
}) {
  const router = useRouter();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { waitAndInvalidateDrops, onWaveCreated } = useContext(
    ReactQueryWrapperContext
  );
  const initialType = ApiWaveType.Chat;
  const initialStep = CreateWaveStep.OVERVIEW;
  const getInitialConfig = ({
    type,
  }: {
    readonly type: ApiWaveType;
  }): CreateWaveConfig => ({
    overview: {
      type,
      signatureType: WaveSignatureType.NONE,
      name: "",
      image: null,
    },
    groups: {
      canView: null,
      canDrop: null,
      canVote: null,
      admin: null,
    },
    dates: {
      submissionStartDate: Time.currentMillis(),
      votingStartDate: Time.currentMillis(),
      endDate: null,
    },
    drops: {
      allowDiscussionDrops: true,
      noOfApplicationsAllowedPerParticipant: null,
      requiredTypes: [],
      requiredMetadata: [],
    },
    voting: {
      type: ApiWaveCreditType.Tdh,
      category: null,
      profileId: null,
    },
    outcomes: [],
    approval: {
      threshold: null,
      thresholdTimeMs: null,
    },
  });

  const [config, setConfig] = useState<CreateWaveConfig>(
    getInitialConfig({
      type: initialType,
    })
  );

  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<CreateWaveStep>(initialStep);
  const [selectedOutcomeType, setSelectedOutcomeType] =
    useState<CreateWaveOutcomeType | null>(null);

  const [errors, setErrors] = useState<CREATE_WAVE_VALIDATION_ERROR[]>([]);

  const onOutcomeTypeChange = (outcomeType: CreateWaveOutcomeType | null) => {
    setSelectedOutcomeType(outcomeType);
    setErrors([]);
  };

  useEffect(() => {
    setErrors([]);
  }, [config]);

  const onStep = ({
    step: newStep,
    direction,
  }: {
    readonly step: CreateWaveStep;
    readonly direction: "forward" | "backward";
  }) => {
    if (direction === "forward") {
      const newErrors = getCreateWaveValidationErrors({ config, step });
      if (newErrors.length) {
        setErrors(newErrors);
        return;
      }
    }
    setErrors([]);
    setSelectedOutcomeType(null);
    setStep(newStep);
  };

  const setOverview = (overview: CreateWaveConfig["overview"]) => {
    setConfig((prev) => ({
      ...getInitialConfig({ type: overview.type }),
      overview,
    }));
  };

  const setDates = (dates: CreateWaveConfig["dates"]) => {
    setConfig((prev) => ({
      ...prev,
      dates,
    }));
  };

  const setDrops = (drops: CreateWaveConfig["drops"]) => {
    setConfig((prev) => ({
      ...prev,
      drops,
    }));
  };

  const setOutcomes = (outcomes: CreateWaveConfig["outcomes"]) => {
    setConfig((prev) => ({
      ...prev,
      outcomes,
    }));
  };

  const onGroupSelect = ({
    group,
    groupType,
  }: {
    readonly group: ApiGroupFull | null;
    readonly groupType: CreateWaveGroupConfigType;
  }) => {
    switch (groupType) {
      case CreateWaveGroupConfigType.CAN_VIEW:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canView: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_DROP:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canDrop: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.CAN_VOTE:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            canVote: group?.id ?? null,
          },
        }));
        break;
      case CreateWaveGroupConfigType.ADMIN:
        setConfig((prev) => ({
          ...prev,
          groups: {
            ...prev.groups,
            admin: group?.id ?? null,
          },
        }));
        break;
      default:
        assertUnreachable(groupType);
    }
  };

  const onVotingTypeChange = (type: ApiWaveCreditType) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        type,
        category: null,
        profileId: null,
      },
    }));
  };

  const onCategoryChange = (category: string | null) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        category,
      },
    }));
  };

  const onProfileIdChange = (profileId: string | null) => {
    setConfig((prev) => ({
      ...prev,
      voting: {
        ...prev.voting,
        profileId,
      },
    }));
  };

  const onThresholdChange = (threshold: number | null) => {
    setConfig((prev) => ({
      ...prev,
      approval: {
        ...prev.approval,
        threshold,
      },
    }));
  };

  const onThresholdTimeChange = (thresholdTimeMs: number | null) => {
    setConfig((prev) => ({
      ...prev,
      approval: {
        ...prev.approval,
        thresholdTimeMs,
      },
    }));
  };

  const createWaveDescriptionRef = useRef<CreateWaveDescriptionHandles | null>(
    null
  );

  const generateMediaForPart = async (media: File): Promise<DropMedia> => {
    const prep = await commonApiPost<
      {
        content_type: string;
        file_name: string;
        file_size: number;
      },
      {
        upload_url: string;
        content_type: string;
        media_url: string;
      }
    >({
      endpoint: "drop-media/prep",
      body: {
        content_type: media.type,
        file_name: media.name,
        file_size: media.size,
      },
    });
    const myHeaders = new Headers({ "Content-Type": prep.content_type });
    await fetch(prep.upload_url, {
      method: "PUT",
      headers: myHeaders,
      body: media,
    });
    return {
      url: prep.media_url,
      mime_type: prep.content_type,
    };
  };

  const generateMediaForOverview = async (
    file: File | null
  ): Promise<{
    readonly url: string;
    readonly mime_type: string;
  } | null> => {
    if (!file) return null;
    const prep = await commonApiPost<
      {
        content_type: string;
        file_name: string;
        file_size: number;
      },
      {
        upload_url: string;
        content_type: string;
        media_url: string;
      }
    >({
      endpoint: "wave-media/prep",
      body: {
        content_type: file.type,
        file_name: file.name,
        file_size: file.size,
      },
    });
    const myHeaders = new Headers({ "Content-Type": prep.content_type });
    await fetch(prep.upload_url, {
      method: "PUT",
      headers: myHeaders,
      body: file,
    });
    return {
      url: prep.media_url,
      mime_type: prep.content_type,
    };
  };

  const generateDropPart = async (
    part: CreateDropPart
  ): Promise<CreateDropRequestPart> => {
    const media = await Promise.all(
      part.media.map((media) => generateMediaForPart(media))
    );
    return {
      ...part,
      media,
    };
  };

  const addWaveMutation = useMutation({
    mutationFn: async (body: ApiCreateNewWave) =>
      await commonApiPost<ApiCreateNewWave, ApiWave>({
        endpoint: `waves`,
        body,
      }),
    onSuccess: (response) => {
      waitAndInvalidateDrops();
      onWaveCreated();
      router.push(`/waves/${response.id}`);
      return response;
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

  const makeGroupVisibleMutation = useMutation({
    mutationFn: async (param: {
      id: string;
      body: { visible: true; old_version_id: string | null };
    }) =>
      await commonApiPost<
        { visible: true; old_version_id: string | null },
        ApiGroupFull
      >({
        endpoint: `groups/${param.id}/visible`,
        body: param.body,
      }),
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      setSubmitting(false);
    },
  });

  const createNewGroupMutation = useMutation({
    mutationFn: async (body: ApiCreateGroup) =>
      await commonApiPost<ApiCreateGroup, ApiGroupFull>({
        endpoint: `groups`,
        body,
      }),
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      setSubmitting(false);
    },
  });

  const createOnlyMeGroup = async ({
    primaryWallet,
  }: {
    readonly primaryWallet: string;
  }): Promise<string | null> => {
    const groupConfig: ApiCreateGroup = {
      name: `Only ${connectedProfile?.profile?.handle}`,
      group: {
        tdh: { min: null, max: null },
        rep: {
          min: null,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
          category: null,
        },
        cic: {
          min: null,
          max: null,
          direction: ApiGroupFilterDirection.Received,
          user_identity: null,
        },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_addresses: [primaryWallet],
        excluded_identity_addresses: null,
      },
    };
    const group = await createNewGroupMutation.mutateAsync(groupConfig);
    if (!group) {
      return null;
    }
    await makeGroupVisibleMutation.mutateAsync({
      id: group.id,
      body: { visible: true, old_version_id: null },
    });
    return group.id;
  };

  const getAdminGroupId = async (): Promise<string | null> => {
    if (config.groups.admin) {
      return config.groups.admin;
    }
    const primaryWallet = connectedProfile?.profile?.primary_wallet;
    if (!primaryWallet) {
      setSubmitting(false);
      setToast({
        message: "You need to have a primary wallet to create a wave",
        type: "error",
      });
      return null;
    }

    return await createOnlyMeGroup({ primaryWallet });
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

    const adminGroupId = await getAdminGroupId();
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
        onGroupSelect={onGroupSelect}
      />
    ),
    [CreateWaveStep.DATES]: (
      <CreateWaveDates
        waveType={config.overview.type}
        dates={config.dates}
        errors={errors}
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
            className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
          >
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 12H4M4 12L10 18M4 12L10 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Back</span>
          </button>
          <h1 className="tw-mb-0">
            Create Wave {!!config.overview.name && `"${config.overview.name}"`}
          </h1>
        </div>
        <div className="tw-mt-4 md:tw-mt-8 xl:tw-max-w-[60rem] tw-mx-auto lg:tw-flex tw-gap-x-16 tw-justify-between tw-h-full tw-w-full">
          <div className="tw-1/4">
            <CreateWavesMainSteps
              activeStep={step}
              waveType={config.overview.type}
              onStep={(step) => onStep({ step, direction: "backward" })}
            />
          </div>
          <div className="tw-flex-1">
            <div className="tw-relative tw-w-full tw-bg-iron-900 tw-p-4 lg:tw-p-8 tw-rounded-xl">
              <div className="tw-relative tw-h-full">
                <div className="tw-flex tw-flex-col tw-h-full">
                  <div className="tw-flex-1 tw-w-full">
                    {/* <AnimatePresence mode="wait">
                      <CommonAnimationHeight>
                        <motion.div
                          key={step}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {stepComponent[step]}
                        </motion.div>
                      </CommonAnimationHeight>
                    </AnimatePresence> */}
                    {stepComponent[step]}
                  </div>
                  {!selectedOutcomeType && (
                    <div className="tw-mt-auto">
                      <CreateWaveActions
                        setStep={(step) =>
                          onStep({ step, direction: "forward" })
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
