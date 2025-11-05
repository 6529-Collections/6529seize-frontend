import { ChatRestriction, SubmissionRestriction } from "@/hooks/useDropPriviledges";

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
        default: {
          throw new Error(`Unhandled chat restriction: ${chatRestriction}`);
        }
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
        case SubmissionRestriction.MAX_DROPS_REACHED:
          return "You have reached the maximum number of drops allowed";
        default: {
          throw new Error(`Unhandled submission restriction: ${submissionRestriction}`);
        }
      }
    }

    if (type === "both") {
      return "You cannot participate in this wave at the moment";
    }

    return "Action not available";
  };

  const getColor = () => {
    if (type === "chat" && chatRestriction === ChatRestriction.NOT_LOGGED_IN) return "tw-text-primary-400";
    if (type === "submission") {
      switch (submissionRestriction) {
        case SubmissionRestriction.NOT_LOGGED_IN:
          return "tw-text-primary-400";
        case SubmissionRestriction.NOT_STARTED:
          return "tw-text-[#FEDF89]";
        case SubmissionRestriction.ENDED:
          return "tw-text-red";
        case SubmissionRestriction.MAX_DROPS_REACHED:
          return "tw-text-red";
        default:
          return "tw-text-iron-400";
      }
    }
    return "tw-text-iron-400";
  };

  return (
    <div className="tw-min-h-[48px] tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-3 tw-bg-iron-900/50 tw-backdrop-blur tw-rounded-xl tw-border tw-border-iron-800/50">
      <div className="tw-flex tw-flex-col">
        <p className={`tw-text-sm tw-font-medium tw-mb-0 ${getColor()}`}>{getMessage()}</p>
      </div>
    </div>
  );
} 
