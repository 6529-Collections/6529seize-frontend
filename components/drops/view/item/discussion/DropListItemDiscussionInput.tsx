import { useContext, useEffect, useState } from "react";
import PrimaryButton, {
  PrimaryButtonSize,
} from "../../../../utils/buttons/PrimaryButton";
import { AuthContext } from "../../../../auth/Auth";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import DropPfp from "../../../create/utils/DropPfp";
import { DropFull } from "../../../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../services/api/common-api";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { createBreakpoint } from "react-use";

enum ScreenType {
  DESKTOP = "DESKTOP",
  MOBILE = "MOBILE",
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function DropListItemDiscussionInput({
  profile,
  drop,
}: {
  readonly profile: IProfileAndConsolidations | null;
  readonly drop: DropFull;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onDropDiscussionChange } = useContext(ReactQueryWrapperContext);
  const [comment, setComment] = useState<string | null>(null);
  const [mutating, setMutating] = useState<boolean>(false);

  const breakpoint = useBreakpoint();
  const [screenType, setScreenType] = useState<ScreenType>(ScreenType.DESKTOP);
  useEffect(() => {
    if (breakpoint === "LG") {
      setScreenType(ScreenType.DESKTOP);
    } else {
      setScreenType(ScreenType.MOBILE);
    }
  }, [breakpoint]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  const commentMutation = useMutation({
    mutationFn: async (body: { comment: string }) => {
      await commonApiPost<{ content: string }, void>({
        endpoint: `drops/${drop.id}/log`,
        body: {
          content: body.comment,
        },
      });
    },
    onSuccess: () => {
      setToast({
        message: "Comment submitted",
        type: "success",
      });
      setComment(null);
      onDropDiscussionChange({
        dropId: drop.id,
        dropAuthorHandle: drop.author.handle,
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!comment) return;
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    await commentMutation.mutateAsync({ comment });
  };

  return (
    <div>
      <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
        <div className="tw-hidden sm:tw-block">
          <DropPfp pfpUrl={profile?.profile?.pfp_url} />
        </div>
        <form
          className="tw-w-full tw-flex tw-gap-x-2 sm:tw-gap-x-3"
          onSubmit={onSubmit}
        >
          <div className="tw-w-full">
            <input
              type="text"
              placeholder="Write a comment"
              value={comment ?? ""}
              onChange={onChange}
              maxLength={250}
              className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-text-md tw-leading-6 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
            />
          </div>
          <div className="tw-self-end">
            <PrimaryButton
              type="submit"
              disabled={!comment || mutating}
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
