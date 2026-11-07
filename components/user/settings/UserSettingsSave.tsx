"use client";

import Button from "@/components/utils/button/Button";

export default function UserSettingsSave({
  loading,
  disabled,
  title = "Save",
  responsiveWidthClassName = "sm:tw-w-auto",
  compact = false,
}: {
  readonly loading: boolean;
  readonly disabled?: boolean | undefined;
  readonly title?: string | undefined;
  readonly responsiveWidthClassName?: string | undefined;
  readonly compact?: boolean;
}) {
  return (
    <div className="tw-flex tw-justify-end">
      <Button
        type="submit"
        variant={compact ? "primary" : "action"}
        size="lg"
        loading={loading}
        disabled={disabled}
        fullWidth
        hideChildrenWhenLoading
        className={responsiveWidthClassName}
      >
        {title}
      </Button>
    </div>
  );
}
