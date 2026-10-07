import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function GroupCardActionFooter({
  loading,
  disabled,
  onSave,
  onCancel,
}: {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-mt-6 tw-flex tw-flex-col tw-gap-1">
      <Button
        onClick={onSave}
        loading={loading}
        disabled={disabled}
        variant="primary"
        size="lg"
        fullWidth
        className="focus-visible:!tw-outline-iron-300"
      >
        {t(locale, "network.groupInspection.grant")}
      </Button>
      <Button
        onClick={onCancel}
        disabled={loading}
        variant="ghost"
        size="lg"
        fullWidth
        className="focus-visible:!tw-outline-iron-300"
      >
        {t(locale, "network.groupInspection.cancel")}
      </Button>
    </div>
  );
}
