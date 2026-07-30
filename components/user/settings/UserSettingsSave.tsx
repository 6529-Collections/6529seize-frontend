"use client";

import Button from "@/components/utils/button/Button";

export default function UserSettingsSave({
  loading,
  disabled,
  title = "Save",
}: {
  readonly loading: boolean;
  readonly disabled?: boolean | undefined;
  readonly title?: string | undefined;
}) {
  return (
    <div className="tw-flex tw-justify-end">
      <Button
        type="submit"
        variant="action"
        size="lg"
        loading={loading}
        disabled={disabled}
        fullWidth
        hideChildrenWhenLoading
        className="sm:tw-w-auto"
      >
        {title}
      </Button>
    </div>
  );
}
