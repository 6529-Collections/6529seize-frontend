import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDropLexicalExample from "../../drops/drop/lexical/CreateDropLexicalExample";
import { MentionedUser, ReferencedNft } from "../../../entities/IDrop";
import CommonInput from "../../utils/input/CommonInput";
import { useMutation } from "wagmi";
import { commonApiPostForm } from "../../../services/api/common-api";
import { AuthContext } from "../../auth/Auth";
import CreateDropFileUpload from "../../drops/create/CreateDropFileUpload";

export default function UserPageDrops({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { setToast } = useContext(AuthContext);
  const [init, setInit] = useState(false);
  useEffect(() => setInit(true), []);

  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [replyToDropId, setReplyToDropId] = useState<string | null>(null);
  const [quotedDropId, setQuotedDropId] = useState<string | null>(null);
  const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  const [imageToShow, setImageToShow] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>();
  const onFile = (file: File) => {
    setFile(file);
    setImageToShow(URL.createObjectURL(file));
  };

  const [mutating, setMutating] = useState<boolean>(false);

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
    },
    onError: (error) => {
      setToast({
        message: error as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onDrop = async () => {
    const formData = new FormData();
    if (file) {
      formData.append("drop_media", file);
    }
    if (title) {
      formData.append("title", title);
    }
    if (content) {
      formData.append("content", content);
    }
    if (replyToDropId) {
      formData.append("reply_to_drop_id", replyToDropId);
    }
    if (quotedDropId) {
      formData.append("quoted_drop_id", quotedDropId);
    }
    if (referencedNfts) {
      formData.append(
        "referenced_nfts",
        JSON.stringify(
          referencedNfts.filter((nft) => content?.includes(`#${nft.name}`))
        )
      );
    }
    if (mentionedUsers) {
      formData.append(
        "mentioned_users",
        JSON.stringify(
          mentionedUsers.filter((user) =>
            content?.includes(`@${user.handle_in_content}`)
          )
        )
      );
    }

    await addDropMutation.mutateAsync(formData);
  };

  if (!init) {
    return null;
  }

  return (
    <div>
      <div className="tw-my-2 tw-w-[30rem]">
        <CommonInput
          inputType="text"
          value={title || ""}
          onChange={setTitle}
          placeholder="Title"
        />
      </div>
      <CreateDropLexicalExample
        mentionedUsers={mentionedUsers}
        referencedNft={referencedNfts}
        onContent={setContent}
        onReferencedNfts={setReferencedNfts}
        onMentionedUsers={setMentionedUsers}
      />
      <CreateDropFileUpload imageToShow={imageToShow} setFile={onFile} />
      <button onClick={onDrop} disabled={mutating}>
        DROP
      </button>
    </div>
  );
}
