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
import {
  commonApiFetch,
  commonApiPost,
  commonApiPostForm,
} from "../../../services/api/common-api";
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
    mutationFn: async (body: {
      readonly title: string | null;
      readonly content: string | null;
      readonly root_drop_id: number | null;
      readonly quoted_drop_id: number | null;
      readonly referenced_nfts: ReferencedNft[];
      readonly mentioned_users: MentionedUser[];
      readonly metadata: DropMetadata[];
      drop_media: {
        readonly url: string;
        readonly mimetype: string;
      } | null;
    }) =>
      await commonApiPost({
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
      setSubmitting(false);
      return;
    }

    // drop-media/prep
    // content_type
    // file_name

    // RESPONSE
    // upload_url; -> upload file here
    // content_type; -> to drop body
    // media_url; -> to drop body

    const formData: {
      readonly title: string | null;
      readonly content: string | null;
      readonly root_drop_id: number | null;
      readonly quoted_drop_id: number | null;
      readonly referenced_nfts: ReferencedNft[];
      readonly mentioned_users: MentionedUser[];
      readonly metadata: DropMetadata[];
      drop_media: {
        readonly url: string;
        readonly mimetype: string;
      } | null;
    } = {
      title: dropRequest.title,
      content: dropRequest.content,
      root_drop_id: dropRequest.stormId ? parseInt(dropRequest.stormId) : null,
      quoted_drop_id: dropRequest.quotedDropId,
      referenced_nfts: dropRequest.referencedNfts,
      mentioned_users: dropRequest.mentionedUsers,
      metadata: dropRequest.metadata,
      drop_media: null,
    };

    if (dropRequest.file) {
      console.log("file", dropRequest.file.type, dropRequest.file.name);
      const prep = await commonApiPost<
        {
          content_type: string;
          file_name: string;
        },
        {
          upload_url: string;
          content_type: string;
          media_url: string;
        }
      >({
        endpoint: "drop-media/prep",
        body: {
          content_type: dropRequest.file.type,
          file_name: dropRequest.file.name,
        },
      });
      console.log("prep");
      console.log(prep);
      const myHeaders = new Headers({ "Content-Type": prep.content_type });
      const response = await fetch(prep.upload_url, {
        method: "PUT",
        headers: myHeaders,
        body: dropRequest.file,
      });
      console.log("response");
      console.log(response);
      formData.drop_media = {
        url: prep.media_url,
        mimetype: prep.content_type,
      };
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
