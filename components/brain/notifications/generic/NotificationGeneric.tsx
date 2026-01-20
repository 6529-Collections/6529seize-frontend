import type { INotificationGeneric } from "@/types/feed.types";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";

function formatCause(cause: string): string {
  return cause
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatContextValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function ContextDetails({
  context,
}: {
  readonly context: Record<string, unknown> | undefined;
}) {
  if (!context || Object.keys(context).length === 0) return null;

  const displayableEntries = Object.entries(context)
    .map(([key, value]) => [key, formatContextValue(value)] as const)
    .filter((entry): entry is [string, string] => entry[1] !== null);

  if (displayableEntries.length === 0) return null;

  return (
    <>
      <span className="tw-mr-1 tw-text-xs tw-font-bold tw-text-iron-400">
        &#8226;
      </span>
      <div className="tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-1">
        {displayableEntries.map(([key, value]) => (
          <span key={key} className="tw-text-xs tw-text-iron-500">
            <span className="tw-text-iron-600">{key}:</span> {value}
          </span>
        ))}
      </div>
    </>
  );
}

function NotificationContent({
  causeLabel,
  createdAt,
  context,
}: {
  readonly causeLabel: string;
  readonly createdAt: number;
  readonly context: Record<string, unknown> | undefined;
}) {
  return (
    <>
      <span className="tw-text-sm tw-font-normal tw-text-iron-400">
        {causeLabel}
      </span>
      <NotificationTimestamp createdAt={createdAt} />
      <ContextDetails context={context} />
    </>
  );
}

export default function NotificationGeneric({
  notification,
}: {
  readonly notification: INotificationGeneric;
}) {
  const causeLabel = formatCause(notification.cause);

  if (notification.related_identity) {
    return (
      <div className="tw-w-full">
        <NotificationHeader author={notification.related_identity}>
          <NotificationContent
            causeLabel={causeLabel}
            createdAt={notification.created_at}
            context={notification.additional_context}
          />
        </NotificationHeader>
      </div>
    );
  }

  return (
    <div className="tw-w-full tw-py-2">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">
          {causeLabel}
        </span>
        <NotificationTimestamp createdAt={notification.created_at} />
      </div>
      <ContextDetails context={notification.additional_context} />
    </div>
  );
}
