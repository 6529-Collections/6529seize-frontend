import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDropWrapper from "./utils/CreateDropWrapper";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { AuthContext } from "../../auth/Auth";
import { commonApiPostForm } from "../../../services/api/common-api";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";

export interface DropRequest {
  readonly title: string | null;
  readonly content: string | null;
  readonly stormId: string | null;
  readonly quotedDropId: number | null;
  readonly referencedNfts: ReferencedNft[];
  readonly mentionedUsers: MentionedUser[];
  readonly metadata: DropMetadata[];
  readonly file: File | null;
}

export enum CreateDropType {
  DROP = "DROP",
  QUOTE = "QUOTE",
}

export default function CreateDrop({
  profile,
  quotedDropId,
  isClient = false,
  type,
  onSuccessfulDrop,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly quotedDropId: number | null;
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
    mutationFn: async (body: FormData) =>
      await commonApiPostForm<any>({
        endpoint: `drops`,
        body,
      }),
    onSuccess: (response) => {
      setToast({
        message: "Drop created.",
        type: "success",
      });
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

  const submitDrop = async (dropRequest: DropRequest) => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(true);
      return;
    }
    const formData = new FormData();
    if (dropRequest.file) {
      formData.append("drop_media", dropRequest.file);
    }
    if (dropRequest.title) {
      formData.append("title", dropRequest.title);
    }

    if (dropRequest.content) {
      formData.append("content", dropRequest.content);
    }

    if (dropRequest.stormId) {
      formData.append("storm_id", dropRequest.stormId);
    }

    if (dropRequest.quotedDropId) {
      formData.append("quoted_drop_id", dropRequest.quotedDropId.toString());
    }

    if (dropRequest.referencedNfts.length) {
      formData.append(
        "referenced_nfts",
        JSON.stringify(dropRequest.referencedNfts)
      );
    }

    if (dropRequest.mentionedUsers.length) {
      formData.append(
        "mentioned_users",
        JSON.stringify(dropRequest.mentionedUsers)
      );
    }

    if (dropRequest.metadata.length) {
      formData.append("metadata", JSON.stringify(dropRequest.metadata));
    }

    await addDropMutation.mutateAsync(formData);
  };

  return (
    <CreateDropWrapper
      profile={profile}
      quotedDropId={quotedDropId}
      type={type}
      onSubmitDrop={submitDrop}
      key={dropEditorRefreshKey}
    />
  );
}
