import { formatDateTime } from "@/components/user/xtdh/utils/xtdhGrantFormatters";

export function GrantExpiryBadge({
  validUntil,
}: Readonly<{ validUntil: number | string | null | undefined }>) {
  if (!validUntil) {
    return null;
  }

  const date = new Date(validUntil);
  date.setDate(date.getDate() - 1);
  const label = formatDateTime(date.getTime(), { includeTime: false });

  return (
    <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs">
      <span className="tw-text-iron-500">Last grant</span>
      <span className="tw-font-medium tw-text-iron-300">{label}</span>
    </div>
  );
}
