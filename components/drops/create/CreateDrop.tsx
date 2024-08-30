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
import { DropMedia } from "../../../generated/models/DropMedia";
import DropEditor from "./DropEditor";
import { CreateDropRequest } from "../../../generated/models/CreateDropRequest";
import { profileAndConsolidationsToProfileMin } from "../../../helpers/ProfileHelpers";
import { ProfileMinWithoutSubs } from "../../../helpers/ProfileTypes";
import { DropMentionedUser } from "../../../generated/models/DropMentionedUser";
import { Drop } from "../../../generated/models/Drop";
import { Wave } from "../../../generated/models/Wave";
import { getOptimisticDropId } from "../../../helpers/waves/drop.helpers";

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
  const { onDropCreate, addOptimisticDrop, invalidateDrops } = useContext(
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

  const { data: waveDetailed } = useQuery<Wave>({
    queryKey: [QueryKey.WAVE, { wave_id: wave.id }],
    queryFn: async () =>
      await commonApiFetch<Wave>({
        endpoint: `waves/${wave.id}`,
      }),
    enabled: !!wave.id,
  });

  const addDropMutation = useMutation({
    mutationFn: async (body: CreateDropRequest) =>
      await commonApiPost<CreateDropRequest, Drop>({
        endpoint: `drops`,
        body,
      }),
    onSuccess: (response: Drop) => {
      setDropEditorRefreshKey((prev) => prev + 1);
      onDropCreate();
      if (onSuccessfulDrop) {
        onSuccessfulDrop();
      }
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      invalidateDrops();
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  if (!init) {
    return null;
  }

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

  const filterMentionedUsers = ({
    mentionedUsers,
    parts,
  }: {
    readonly mentionedUsers: DropMentionedUser[];
    readonly parts: CreateDropPart[];
  }): DropMentionedUser[] =>
    mentionedUsers.filter((user) =>
      parts.some((part) =>
        part.content?.includes(`@[${user.handle_in_content}]`)
      )
    );

  const generatePart = async (
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

  const getOptimisticDrop = (dropRequest: CreateDropRequest): Drop | null => {
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
      },
      author: {
        ...profileMin,
        subscribed_actions: [],
      },
      created_at: Date.now(),
      title: dropRequest.title ?? null,
      parts: dropRequest.parts.map((part, i) => ({
        part_id: i,
        content: part.content ?? null,
        media: part.media.map((media) => ({
          url: media.url,
          mime_type: media.mime_type,
        })),
        quoted_drop: part.quoted_drop ?? null,
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

    const requestBody: CreateDropRequest = {
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
      loading={submitting}
      dropEditorRefreshKey={dropEditorRefreshKey}
      wave={wave}
      onSubmitDrop={submitDrop}
    />
  );
}
