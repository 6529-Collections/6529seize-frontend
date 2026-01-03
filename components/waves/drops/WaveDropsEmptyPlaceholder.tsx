import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface WaveDropsEmptyPlaceholderProps {
  readonly dropId: string | null;
}

export default function WaveDropsEmptyPlaceholder({
  dropId,
}: WaveDropsEmptyPlaceholderProps) {
  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-py-16 tw-px-4">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-max-w-xs tw-text-center">
        <ChatBubbleLeftRightIcon className="tw-size-10 tw-text-iron-600" />
        <div className="tw-space-y-1.5">
          <p className="tw-text-base tw-font-medium tw-text-iron-300">
            Start the conversation
          </p>
          {dropId && (
            <p className="tw-text-sm tw-text-iron-500">
              Share your thoughts and join the discussion
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
