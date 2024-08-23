import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequestPart,
} from "../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "../../auth/Auth";
import { commonApiPost } from "../../../services/api/common-api";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { DropMedia } from "../../../generated/models/DropMedia";
import DropEditor from "./DropEditor";
import { CreateDropRequest } from "../../../generated/models/CreateDropRequest";
import { profileAndConsolidationsToProfileMin } from "../../../helpers/ProfileHelpers";
import { ProfileMinWithoutSubs } from "../../../helpers/ProfileTypes";
import { DropMentionedUser } from "../../../generated/models/DropMentionedUser";
import { Drop } from "../../../generated/models/Drop";

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
  const { onDropCreate } = useContext(ReactQueryWrapperContext);
  const [init, setInit] = useState(isClient);
  useEffect(() => setInit(true), []);
  const [submitting, setSubmitting] = useState(false);
  const profileMin: ProfileMinWithoutSubs | null =
    profileAndConsolidationsToProfileMin({
      profile,
    });

  const [dropEditorRefreshKey, setDropEditorRefreshKey] = useState(0);

  const addDropMutation = useMutation({
    mutationFn: async (body: CreateDropRequest) =>
      await commonApiPost<CreateDropRequest, Drop>({
        endpoint: `drops`,
        body,
      }),
    onSuccess: (response: Drop) => {
      setDropEditorRefreshKey((prev) => prev + 1);
      onDropCreate({ drop: response });
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
      setSubmitting(false);
    },
  });

  if (!init) {
    return null;
  }

  const generateMediaForPart = async (
    part: CreateDropPart
  ): Promise<Array<DropMedia>> => {
    if (!part.media.length) {
      return [];
    }

    const media = part.media[0];
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
    return [
      {
        url: prep.media_url,
        mime_type: prep.content_type,
      },
    ];
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
    return {
      ...part,
      media: await generateMediaForPart(part),
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

    const parts = await Promise.all(
      dropRequest.parts.map((part) => generatePart(part))
    );

    const requestBody: CreateDropRequest = {
      ...dropRequest,
      mentioned_users: filterMentionedUsers({
        mentionedUsers: dropRequest.mentioned_users,
        parts: dropRequest.parts,
      }),
      wave_id: wave.id,
      parts,
    };
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
