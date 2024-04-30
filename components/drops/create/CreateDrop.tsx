import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDropWrapper from "./utils/CreateDropWrapper";
import {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequest,
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
  quotedDrop,
  isClient = false,
  type,
  onSuccessfulDrop,
}: {
  readonly profile: IProfileAndConsolidations;
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

  const [title, setTitle] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DropMetadata[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<
    Omit<MentionedUser, "current_handle">[]
  >([]);
  const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);
  const [drop, setDrop] = useState<CreateDropConfig | null>(null);
  const [viewType, setViewType] = useState<CreateDropViewType>(
    CreateDropViewType.COMPACT
  );

  const onDrop = (updatedDrop: CreateDropConfig) => {
    setDrop(updatedDrop);
    // setDropEditorRefreshKey((prev) => prev + 1);
  };

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
      setTitle(null);
      setMetadata([]);
      setMentionedUsers([]);
      setReferencedNfts([]);
      setDrop(null);
      setViewType(CreateDropViewType.COMPACT);
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
      parts,
    };
    await addDropMutation.mutateAsync(requestBody);
  };

  return (
    <CreateDropWrapper
      profile={profile}
      quotedDrop={quotedDrop}
      type={type}
      loading={submitting}
      title={title}
      metadata={metadata}
      mentionedUsers={mentionedUsers}
      referencedNfts={referencedNfts}
      drop={drop}
      viewType={viewType}
      setViewType={setViewType}
      setDrop={onDrop}
      setMentionedUsers={setMentionedUsers}
      setReferencedNfts={setReferencedNfts}
      setTitle={setTitle}
      setMetadata={setMetadata}
      onSubmitDrop={submitDrop}
      key={dropEditorRefreshKey}
    />
  );
}
