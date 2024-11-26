import { ChatRestriction, SubmissionRestriction } from "../../../hooks/useDropPriviledges";

interface DropPlaceholderProps {
  readonly type: "chat" | "submission" | "both";
  readonly chatRestriction?: ChatRestriction;
  readonly submissionRestriction?: SubmissionRestriction;
}

export default function DropPlaceholder({ type, chatRestriction, submissionRestriction }: DropPlaceholderProps) {
  const getMessage = () => {
    if (type === "chat" && chatRestriction) {
      switch (chatRestriction) {
        case ChatRestriction.NOT_LOGGED_IN:
          return "Please log in to participate in chat";
        case ChatRestriction.PROXY_USER:
          return "Proxy users cannot participate in chat";
        case ChatRestriction.NO_PERMISSION:
          return "You don't have permission to chat in this wave";
        case ChatRestriction.DISABLED:
          return "Chat is currently disabled for this wave";
      }
    }

    if (type === "submission" && submissionRestriction) {
      switch (submissionRestriction) {
        case SubmissionRestriction.NOT_LOGGED_IN:
          return "Please log in to make submissions";
        case SubmissionRestriction.PROXY_USER:
          return "Proxy users cannot make submissions";
        case SubmissionRestriction.NO_PERMISSION:
          return "You don't have permission to submit in this wave";
        case SubmissionRestriction.NOT_STARTED:
          return "Submissions haven't started yet";
        case SubmissionRestriction.ENDED:
          return "Submission period has ended";
      }
    }

    if (type === "both") {
      return "You cannot participate in this wave at the moment";
    }

    return "Action not available";
  };

  const getIcon = () => {
    switch (type) {
      case "chat":
        return chatRestriction === ChatRestriction.NOT_LOGGED_IN ? "user-lock" : "comment-slash";
      case "submission":
        return submissionRestriction === SubmissionRestriction.NOT_LOGGED_IN ? "user-lock" : 
               submissionRestriction === SubmissionRestriction.NOT_STARTED ? "clock" :
               submissionRestriction === SubmissionRestriction.ENDED ? "calendar-xmark" : "file-circle-xmark";
      case "both":
        return "lock";
    }
  };

  return (
    <div className="tw-min-h-[48px] tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-2.5 tw-bg-neutral-900 tw-rounded-lg tw-border tw-border-neutral-800">
      <div className="tw-flex tw-items-center tw-gap-2.5">
        <i className={`fas fa-${getIcon()} tw-text-neutral-500 tw-text-sm`} />
        <p className="tw-text-neutral-400 tw-text-xs">{getMessage()}</p>
      </div>
    </div>
  );
} 
