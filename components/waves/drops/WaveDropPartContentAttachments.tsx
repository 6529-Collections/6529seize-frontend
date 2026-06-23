"use client";

import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import { ApiAttachmentKind } from "@/generated/models/ApiAttachmentKind";
import { ApiAttachmentStatus } from "@/generated/models/ApiAttachmentStatus";
import {
  DocumentIcon,
  ExclamationTriangleIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import DropAttachmentDisplay from "@/components/drops/view/item/content/attachments/DropAttachmentDisplay";
import clsx from "clsx";

const IN_FLIGHT_STATUSES = new Set<ApiAttachmentStatus>([
  ApiAttachmentStatus.Uploading,
  ApiAttachmentStatus.Verifying,
  ApiAttachmentStatus.Processing,
]);

function getAttachmentIcon(kind: ApiAttachmentKind) {
  if (kind === ApiAttachmentKind.Csv) {
    return TableCellsIcon;
  }

  return DocumentIcon;
}

function isAttachmentReady(attachment: ApiAttachment): boolean {
  return attachment.status === ApiAttachmentStatus.Ready && !!attachment.url;
}

function getStatusLabel(attachment: ApiAttachment): string {
  if (attachment.status === ApiAttachmentStatus.Uploading) {
    return "Uploading...";
  }

  if (attachment.status === ApiAttachmentStatus.Verifying) {
    return "Scanning...";
  }

  if (attachment.status === ApiAttachmentStatus.Processing) {
    return "Finalizing...";
  }

  if (attachment.status === ApiAttachmentStatus.Bad) {
    return attachment.error_reason ?? "Attachment failed validation.";
  }

  return attachment.mime_type;
}

export default function WaveDropPartContentAttachments({
  attachments,
}: {
  readonly attachments: ApiAttachment[];
}) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="tw-mt-3 tw-space-y-2">
      {attachments.map((attachment) => {
        const Icon = getAttachmentIcon(attachment.kind);
        const ready = isAttachmentReady(attachment);
        const inFlight = IN_FLIGHT_STATUSES.has(attachment.status);
        const bad = attachment.status === ApiAttachmentStatus.Bad;
        let statusIcon = <Icon className="tw-size-5" />;
        if (inFlight) {
          statusIcon = <CircleLoader size={CircleLoaderSize.MEDIUM} />;
        } else if (bad) {
          statusIcon = (
            <ExclamationTriangleIcon className="tw-size-5 tw-text-error" />
          );
        }

        if (ready && attachment.url) {
          return (
            <DropAttachmentDisplay
              key={attachment.attachment_id}
              mimeType={attachment.mime_type}
              attachmentUrl={attachment.url}
              fileName={attachment.file_name}
              safety={attachment.safety}
            />
          );
        }

        const content = (
          <div
            className={clsx(
              "tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border tw-border-solid tw-bg-iron-950 tw-p-3 tw-text-left",
              inFlight && "tw-border-iron-700",
              bad && "tw-border-error tw-bg-error/10"
            )}
          >
            <div className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900 tw-text-iron-200">
              {statusIcon}
            </div>
            <div className="tw-min-w-0 tw-flex-1">
              <div className="tw-truncate tw-text-sm tw-font-medium tw-text-iron-100">
                {attachment.file_name}
              </div>
              <div
                className={clsx(
                  "tw-mt-0.5 tw-text-xs",
                  bad ? "tw-text-error" : "tw-text-iron-400"
                )}
              >
                {getStatusLabel(attachment)}
              </div>
            </div>
          </div>
        );

        return <div key={attachment.attachment_id}>{content}</div>;
      })}
    </div>
  );
}
