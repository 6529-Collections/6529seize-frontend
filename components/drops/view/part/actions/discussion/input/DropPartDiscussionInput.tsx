import { useContext, useEffect, useRef, useState } from "react";
import { Drop } from "../../../../../../../generated/models/Drop";
import { DropPart } from "../../../../../../../generated/models/DropPart";
import PrimaryButton, {
  PrimaryButtonSize,
} from "../../../../../../utils/buttons/PrimaryButton";
import DropPfp from "../../../../../create/utils/DropPfp";
import { createBreakpoint } from "react-use";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../../services/api/common-api";
import { AuthContext } from "../../../../../../auth/Auth";
import { NewDropComment } from "../../../../../../../generated/models/NewDropComment";
import { DropComment } from "../../../../../../../generated/models/DropComment";
import { ReactQueryWrapperContext } from "../../../../../../react-query-wrapper/ReactQueryWrapper";

enum ScreenType {
  DESKTOP = "DESKTOP",
  MOBILE = "MOBILE",
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function DropPartDiscussionInput({
  drop,
  dropPart,
}: {
  readonly drop: Drop;
  readonly dropPart: DropPart;
}) {
  const { setToast, requestAuth, connectedProfile } = useContext(AuthContext);
  const { onDropDiscussionChange } = useContext(ReactQueryWrapperContext);
  const author = drop.author;
  const [comment, setComment] = useState<string | null>(null);
  const [addingComment, setAddingComment] = useState<boolean>(false);

  const breakpoint = useBreakpoint();
  const [screenType, setScreenType] = useState<ScreenType>(ScreenType.DESKTOP);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  useEffect(() => {
    if (breakpoint === "LG") {
      setScreenType(ScreenType.DESKTOP);
    } else {
      setScreenType(ScreenType.MOBILE);
    }
  }, [breakpoint]);

  const onCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  const addCommentMutation = useMutation({
    mutationFn: async (body: NewDropComment) => {
      await commonApiPost<NewDropComment, DropComment>({
        endpoint: `drops/${drop.id}/parts/${dropPart.part_id}/comments`,
        body,
      });
    },
    onSuccess: () => {
      setComment(null);
      onDropDiscussionChange({
        dropAuthorHandle: author?.handle,
        dropId: drop.id,
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setAddingComment(false);
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!comment) return;
    setAddingComment(true);
    const { success } = await requestAuth();
    if (!success) {
      setAddingComment(false);
      return;
    }
    await addCommentMutation.mutateAsync({ comment });
  };

  return (
    <div>
      <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
        <div className="tw-hidden sm:tw-block">
          <DropPfp pfpUrl={connectedProfile?.profile?.pfp_url} />
        </div>
        <form
          className="tw-w-full tw-flex tw-gap-x-2 sm:tw-gap-x-3"
          onSubmit={onSubmit}
        >
          <div className="tw-w-full">
            <input
              ref={inputRef}
              type="text"
              placeholder="Drop a comment"
              value={comment ?? ""}
              onChange={onCommentChange}
              maxLength={250}
              className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-text-md tw-leading-6 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
          <div className="tw-self-end">
            <PrimaryButton
              type="submit"
              disabled={!comment || addingComment}
              loading={addingComment}
              size={
                screenType === ScreenType.MOBILE
                  ? PrimaryButtonSize.SMALL
                  : PrimaryButtonSize.MEDIUM
              }
            >
              Send
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
