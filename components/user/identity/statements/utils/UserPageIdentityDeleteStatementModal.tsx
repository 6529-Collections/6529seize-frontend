"use client";

import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiDelete } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";

export default function UserPageIdentityDeleteStatementModal({
  statement,
  profile,
  isOpen,
  onClose,
}: {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useContext(AuthContext);
  const { onProfileStatementRemove } = useContext(ReactQueryWrapperContext);

  const deleteStatementMutation = useMutation({
    mutationFn: () =>
      commonApiDelete({
        endpoint: `profiles/${profile.query}/cic/statements/${statement.id}`,
      }),
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "user.profile.identity.statements.deleteErrorTitle"),
        description: t(
          locale,
          "user.profile.identity.statements.primaryErrorDescription"
        ),
        details: getToastErrorDetails(error),
      });
    },
    onSuccess: () => {
      setToast({
        message: t(locale, "user.profile.identity.statements.deleteSuccess"),
        type: "warning",
      });
      onProfileStatementRemove({ profile });
      onClose();
    },
  });

  const onDelete = async () => {
    const { success } = await requestAuth();
    if (success) {
      deleteStatementMutation.mutate();
    }
  };

  return (
    <MobileWrapperDialog
      title={t(locale, "user.profile.identity.statements.deleteTitle")}
      isOpen={isOpen}
      onClose={onClose}
      tabletModal
      showHeaderCloseButton
      maxWidthClass="md:tw-max-w-md"
      headerClassName="-tw-mt-2 md:tw-mt-0"
      dismissible={!deleteStatementMutation.isPending}
    >
      <div className="tw-px-4 sm:tw-px-6">
        <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "user.profile.identity.statements.deleteDescription")}
        </p>
        <div className="tw-mt-6 tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
          <Button
            disabled={deleteStatementMutation.isPending}
            onClick={onClose}
            variant="secondary"
            size="lg"
            fullWidth
            className="sm:tw-w-auto"
          >
            {t(locale, "user.profile.identity.statements.cancel")}
          </Button>
          <Button
            onClick={() => void onDelete()}
            loading={deleteStatementMutation.isPending}
            variant="destructive"
            size="lg"
            fullWidth
            className="sm:tw-w-auto"
          >
            {t(locale, "user.profile.identity.statements.deleteStatement")}
          </Button>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
