import {
  ChatRestriction,
  SubmissionRestriction,
} from "@/hooks/useDropPriviledges";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Link from "next/link";
import type { ReactNode } from "react";
import PostingAccessLoadingPlaceholder from "./PostingAccessLoadingPlaceholder";

const MUTED_TEXT_CLASS = "tw-text-iron-400";
type DropPlaceholderType =
  | "chat"
  | "submission"
  | "both"
  | "profile-check"
  | "suspended";

function throwUnhandledRestriction(
  type: "chat" | "submission",
  restriction: string
): never {
  throw new Error(`Unhandled ${type} restriction: ${restriction}`);
}

interface DropPlaceholderProps {
  readonly type: DropPlaceholderType;
  readonly chatRestriction?: ChatRestriction | undefined;
  readonly submissionRestriction?: SubmissionRestriction | undefined;
  readonly profileSetupHref?: string | undefined;
}

function getProfileSetupMessage(
  profileSetupHref: string | undefined,
  suffix: string
): ReactNode {
  if (profileSetupHref === undefined) {
    return `Create a profile ${suffix}`;
  }

  return (
    <>
      <Link
        href={profileSetupHref}
        className="tw-text-primary-400 tw-no-underline tw-transition tw-duration-200 hover:tw-text-primary-300 hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-primary-400"
      >
        Create a profile
      </Link>{" "}
      <span className="tw-text-iron-400">{suffix}</span>
    </>
  );
}

function getChatMessage(
  restriction: ChatRestriction,
  profileSetupHref: string | undefined
): ReactNode {
  switch (restriction) {
    case ChatRestriction.NOT_LOGGED_IN:
      return "Please log in to participate in chat";
    case ChatRestriction.NEEDS_PROFILE:
      return getProfileSetupMessage(profileSetupHref, "to participate in chat");
    case ChatRestriction.PROXY_USER:
      return "Proxy users cannot participate in chat";
    case ChatRestriction.SLOW_MODE:
      return "Slow mode is active. Please wait before posting again";
    case ChatRestriction.NO_PERMISSION:
      return "You don't have permission to chat in this wave";
    case ChatRestriction.DISABLED:
      return "Chat is currently disabled for this wave";
    default:
      return throwUnhandledRestriction("chat", String(restriction));
  }
}

function getSubmissionMessage(
  restriction: SubmissionRestriction,
  profileSetupHref: string | undefined
): ReactNode {
  switch (restriction) {
    case SubmissionRestriction.NOT_LOGGED_IN:
      return "Please log in to make submissions";
    case SubmissionRestriction.NEEDS_PROFILE:
      return getProfileSetupMessage(profileSetupHref, "to submit in this wave");
    case SubmissionRestriction.PROXY_USER:
      return "Proxy users cannot make submissions";
    case SubmissionRestriction.NO_PERMISSION:
      return "You don't have permission to submit in this wave";
    case SubmissionRestriction.NOT_STARTED:
      return "Submissions haven't started yet";
    case SubmissionRestriction.ENDED:
      return "Submission period has ended";
    case SubmissionRestriction.MAX_DROPS_REACHED:
      return "You have reached the maximum number of drops allowed";
    default:
      return throwUnhandledRestriction("submission", String(restriction));
  }
}

function getPlaceholderColor({
  type,
  chatRestriction,
  submissionRestriction,
}: Pick<
  DropPlaceholderProps,
  "type" | "chatRestriction" | "submissionRestriction"
>): string {
  if (type === "suspended") return "tw-text-amber-300";
  const needsProfile =
    (type === "chat" && chatRestriction === ChatRestriction.NEEDS_PROFILE) ||
    (type === "submission" &&
      submissionRestriction === SubmissionRestriction.NEEDS_PROFILE) ||
    (type === "both" &&
      chatRestriction === ChatRestriction.NEEDS_PROFILE &&
      submissionRestriction === SubmissionRestriction.NEEDS_PROFILE);
  if (needsProfile) return "tw-text-primary-400";

  if (type !== "submission" || submissionRestriction === undefined) {
    return MUTED_TEXT_CLASS;
  }
  switch (submissionRestriction) {
    case SubmissionRestriction.NOT_STARTED:
      return "tw-text-[#FEDF89]";
    case SubmissionRestriction.ENDED:
    case SubmissionRestriction.MAX_DROPS_REACHED:
      return "tw-text-red";
    case SubmissionRestriction.NOT_LOGGED_IN:
    case SubmissionRestriction.NEEDS_PROFILE:
    case SubmissionRestriction.PROXY_USER:
    case SubmissionRestriction.NO_PERMISSION:
      return MUTED_TEXT_CLASS;
  }
}

export default function DropPlaceholder({
  type,
  chatRestriction,
  submissionRestriction,
  profileSetupHref,
}: DropPlaceholderProps) {
  const locale = useBrowserLocale();

  if (type === "profile-check") {
    return (
      <PostingAccessLoadingPlaceholder
        statusLabel={t(locale, "contentModeration.posting.checkingAccess")}
      />
    );
  }

  const getMessage = () => {
    if (type === "suspended") {
      return (
        <span className="tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-x-2 tw-gap-y-0.5">
          <span className="tw-whitespace-nowrap tw-text-amber-300">
            {t(locale, "contentModeration.posting.suspended")}
          </span>
          <span className="tw-min-w-0 tw-font-normal tw-text-iron-400">
            <span>· </span>
            {t(locale, "contentModeration.posting.suspendedSupport")}
          </span>
        </span>
      );
    }

    if (type === "chat" && chatRestriction !== undefined) {
      return getChatMessage(chatRestriction, profileSetupHref);
    }

    if (type === "submission" && submissionRestriction !== undefined) {
      return getSubmissionMessage(submissionRestriction, profileSetupHref);
    }

    if (type === "both") {
      if (
        chatRestriction === ChatRestriction.NOT_LOGGED_IN &&
        submissionRestriction === SubmissionRestriction.NOT_LOGGED_IN
      ) {
        return "Connect your wallet to participate in this wave";
      }

      if (
        chatRestriction === ChatRestriction.NEEDS_PROFILE &&
        submissionRestriction === SubmissionRestriction.NEEDS_PROFILE
      ) {
        return getProfileSetupMessage(
          profileSetupHref,
          "to participate in this wave"
        );
      }

      return "You cannot participate in this wave at the moment";
    }

    return "Action not available";
  };

  return (
    <div className="tw-flex tw-min-h-[48px] tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-iron-800/50 tw-bg-iron-900/50 tw-px-4 tw-py-3 tw-backdrop-blur">
      <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-center tw-text-center">
        <output
          className={`tw-m-0 tw-max-w-full tw-text-sm tw-font-medium ${getPlaceholderColor({ type, chatRestriction, submissionRestriction })}`}
        >
          {getMessage()}
        </output>
      </div>
    </div>
  );
}
