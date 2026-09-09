"use client";

import Button from "@/components/utils/button/Button";

export default function UserSettingsSave({
  loading,
  disabled,
  title = "Save",
  responsiveWidthClassName = "sm:tw-w-auto",
}: {
  readonly loading: boolean;
  readonly disabled?: boolean | undefined;
  readonly title?: string | undefined;
  readonly responsiveWidthClassName?: string | undefined;
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
        className={responsiveWidthClassName}
      >
        {title}
      </Button>
    </div>
  );
}
