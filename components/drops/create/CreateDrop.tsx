import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDropWrapper from "./utils/CreateDropWrapper";
import {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequestPart,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "../../auth/Auth";
import { commonApiPost } from "../../../services/api/common-api";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { DropMedia } from "../../../generated/models/DropMedia";
import DropEditor from "./DropEditor";
import { CreateDropRequest } from "../../../generated/models/CreateDropRequest";

export enum CreateDropType {
  DROP = "DROP",
  QUOTE = "QUOTE",
}

export enum CreateDropViewType {
  COMPACT = "COMPACT",
  FULL = "FULL",
}

export default function CreateDrop({
  profile,
  waveId,
  quotedDrop,
  isClient = false,
  type,
  onSuccessfulDrop,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly waveId: string;
  readonly quotedDrop: {
    dropId: string;
    partId: number;
  } | null;
  readonly isClient?: boolean;
  readonly type: CreateDropType;
  readonly onSuccessfulDrop?: () => void;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onDropCreate } = useContext(ReactQueryWrapperContext);
  const [init, setInit] = useState(isClient);
  useEffect(() => setInit(true), []);
  const [submitting, setSubmitting] = useState(false);

  const [dropEditorRefreshKey, setDropEditorRefreshKey] = useState(0);

  const addDropMutation = useMutation({
    mutationFn: async (body: CreateDropRequest) =>
      await commonApiPost({
        endpoint: `drops`,
        body,
      }),
    onSuccess: (response) => {
      setDropEditorRefreshKey((prev) => prev + 1);

      onDropCreate({ profile });
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
      wave_id: waveId,
      parts,
    };
    console.log(requestBody);
    await addDropMutation.mutateAsync(requestBody);
  };

  return (
    <DropEditor
      profile={profile}
      isClient={isClient}
      quotedDrop={quotedDrop}
      type={type}
      loading={submitting}
      dropEditorRefreshKey={dropEditorRefreshKey}
      onSubmitDrop={submitDrop}
    />
  );
}
