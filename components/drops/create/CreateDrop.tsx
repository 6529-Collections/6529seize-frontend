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

export interface DropRequest {
  readonly title: string | null;
  readonly content: string | null;
  readonly stormId: string | null;
  readonly quotedDropId: string | null;
  readonly referencedNfts: ReferencedNft[];
  readonly mentionedUsers: MentionedUser[];
  readonly metadata: DropMetadata[];
  readonly file: File | null;
}

export default function CreateDrop({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const [init, setInit] = useState(false);
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
      formData.append("quoted_drop_id", dropRequest.quotedDropId);
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
    // setDropEditorRefreshKey((prev) => prev + 1);
    // setSubmitting(false);
  };

  return (
    <CreateDropWrapper
      profile={profile}
      onSubmitDrop={submitDrop}
      key={dropEditorRefreshKey}
    />
  );
}
