import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequestPart,
} from "../../../entities/IDrop";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../auth/Auth";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../services/api/common-api";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../react-query-wrapper/ReactQueryWrapper";
import DropEditor from "./DropEditor";
import { ApiCreateDropRequest } from "../../../generated/models/ApiCreateDropRequest";
import { profileAndConsolidationsToProfileMin } from "../../../helpers/ProfileHelpers";
import { ProfileMinWithoutSubs } from "../../../helpers/ProfileTypes";
import { ApiDropMentionedUser } from "../../../generated/models/ApiDropMentionedUser";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ApiWave } from "../../../generated/models/ApiWave";
import { getOptimisticDropId } from "../../../helpers/waves/drop.helpers";
import { ApiDropType } from "../../../generated/models/ApiDropType";
import { multiPartUpload } from "../../waves/create-wave/services/multiPartUpload";

export enum CreateDropType {
  DROP = "DROP",
  QUOTE = "QUOTE",
}

export enum CreateDropViewType {
  COMPACT = "COMPACT",
  FULL = "FULL",
}

interface CreateDropWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string;
}

interface CreateDropProps {
  readonly profile: IProfileAndConsolidations;
  readonly wave: CreateDropWaveProps;
  readonly quotedDrop: {
    dropId: string;
    partId: number;
  } | null;
  readonly isClient?: boolean;
  readonly showProfile?: boolean;
  readonly type: CreateDropType;
  readonly onSuccessfulDrop?: () => void;
}

export default function CreateDrop({
  profile,
  quotedDrop,
  wave,
  isClient = false,
  showProfile = true,
  type,
  onSuccessfulDrop,
}: CreateDropProps) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { waitAndInvalidateDrops, addOptimisticDrop } = useContext(
    ReactQueryWrapperContext
  );
  const [init, setInit] = useState(isClient);
  useEffect(() => setInit(true), []);
  const [submitting, setSubmitting] = useState(false);
  const profileMin: ProfileMinWithoutSubs | null =
    profileAndConsolidationsToProfileMin({
      profile,
    });

  const [dropEditorRefreshKey, setDropEditorRefreshKey] = useState(0);

  const { data: waveDetailed } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: wave.id }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${wave.id}`,
      }),
    enabled: !!wave.id,
  });

  const addDropMutation = useMutation({
    mutationFn: async (body: ApiCreateDropRequest) =>
      await commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint: `drops`,
        body,
      }),
    onSuccess: (response: ApiDrop) => {
      setDropEditorRefreshKey((prev) => prev + 1);
      if (onSuccessfulDrop) {
        onSuccessfulDrop();
      }
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      waitAndInvalidateDrops();
      setSubmitting(false);
    },
  });

  if (!init) {
    return null;
  }

  const filterMentionedUsers = ({
    mentionedUsers,
    parts,
  }: {
    readonly mentionedUsers: ApiDropMentionedUser[];
    readonly parts: CreateDropPart[];
  }): ApiDropMentionedUser[] =>
    mentionedUsers.filter((user) =>
      parts.some((part) =>
        part.content?.includes(`@[${user.handle_in_content}]`)
      )
    );

  const generatePart = async (
    part: CreateDropPart
  ): Promise<CreateDropRequestPart> => {
    const media = await Promise.all(
      part.media.map((media) => multiPartUpload({ file: media, path: "drop" }))
    );
    return {
      ...part,
      media,
    };
  };

  const generateParts = async ({
    parts,
  }: {
    readonly parts: CreateDropPart[];
  }): Promise<CreateDropRequestPart[]> => {
    try {
      return await Promise.all(parts.map((part) => generatePart(part)));
    } catch (error) {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      return [];
    }
  };

  const getOptimisticDrop = (
    dropRequest: ApiCreateDropRequest
  ): ApiDrop | null => {
    if (!profileMin) {
      return null;
    }

    if (!waveDetailed) {
      return null;
    }

    return {
      id: getOptimisticDropId(),
      serial_no: Math.floor(Math.random() * (1000000 - 100000) + 100000),
      wave: {
        id: waveDetailed.id,
        name: waveDetailed.name,
        picture: waveDetailed.picture ?? "",
        description_drop_id: waveDetailed.description_drop.id,
        authenticated_user_eligible_to_participate:
          waveDetailed.participation.authenticated_user_eligible,
        authenticated_user_eligible_to_vote:
          waveDetailed.voting.authenticated_user_eligible,
        authenticated_user_eligible_to_chat:
          waveDetailed.chat.authenticated_user_eligible,
        voting_credit_type: waveDetailed.voting.credit_type,
        voting_period_start: waveDetailed.voting.period?.min ?? null,
        voting_period_end: waveDetailed.voting.period?.max ?? null,
        visibility_group_id: null,
        participation_group_id: null,
        chat_group_id: null,
        voting_group_id: null,
        admin_group_id: null,
        admin_drop_deletion_enabled:
          waveDetailed.wave.admin_drop_deletion_enabled,
        authenticated_user_admin:
          waveDetailed.wave.authenticated_user_eligible_for_admin,
      },
      author: {
        ...profileMin,
        subscribed_actions: [],
      },
      created_at: Date.now(),
      updated_at: null,
      title: dropRequest.title ?? null,
      parts: dropRequest.parts.map((part, i) => ({
        part_id: i + 1,
        content: part.content ?? null,
        media: part.media.map((media) => ({
          url: media.url,
          mime_type: media.mime_type,
        })),
        quoted_drop: part.quoted_drop
          ? {
              ...part.quoted_drop,
              is_deleted: false,
            }
          : null,
        replies_count: 0,
        quotes_count: 0,
      })),
      parts_count: dropRequest.parts.length,
      referenced_nfts: dropRequest.referenced_nfts,
      mentioned_users: dropRequest.mentioned_users,
      metadata: dropRequest.metadata,
      rating: 0,
      top_raters: [],
      raters_count: 0,
      context_profile_context: null,
      subscribed_actions: [],
      drop_type: ApiDropType.Chat,
      rank: null,
      realtime_rating: 0,
      is_signed: false,
    };
  };

  // TODO: add required metadata & media validations for wave participation
  const submitDrop = async (dropRequest: CreateDropConfig) => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }

    if (!dropRequest.parts.length) {
      setSubmitting(false);
      return;
    }

    const parts = await generateParts({ parts: dropRequest.parts });
    if (!parts.length) {
      setSubmitting(false);
      return;
    }

    const requestBody: ApiCreateDropRequest = {
      ...dropRequest,
      mentioned_users: filterMentionedUsers({
        mentionedUsers: dropRequest.mentioned_users,
        parts: dropRequest.parts,
      }),
      wave_id: wave.id,
      parts,
    };
    const optimisticDrop = getOptimisticDrop(requestBody);
    if (optimisticDrop) {
      addOptimisticDrop({ drop: optimisticDrop });
    }
    await addDropMutation.mutateAsync(requestBody);
  };

  if (!profileMin) {
    return;
  }

  return (
    <DropEditor
      profile={profileMin}
      isClient={isClient}
      quotedDrop={quotedDrop}
      showProfile={showProfile}
      type={type}
      waveId={wave.id}
      loading={submitting}
      dropEditorRefreshKey={dropEditorRefreshKey}
      wave={wave}
      onSubmitDrop={submitDrop}
    />
  );
}
