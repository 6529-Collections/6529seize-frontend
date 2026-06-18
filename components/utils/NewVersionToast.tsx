"use client";

import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIsVersionStale } from "@/hooks/useIsVersionStale";
import clsx from "clsx";
import { type JSX } from "react";
import styles from "./toast/AppToast.module.scss";

const SHOW_NEW_VERSION_TOAST_PARAM = "showNewVersionToast";

const removeNewVersionToastOverrideFromCurrentPath = () => {
  const url = new URL(globalThis.location.href);
  url.searchParams.delete(SHOW_NEW_VERSION_TOAST_PARAM);
  globalThis.history.replaceState(globalThis.history.state, "", url);
};

const refreshWithoutToastOverride = () => {
  removeNewVersionToastOverrideFromCurrentPath();
  globalThis.location.reload();
};

const NewVersionToast = (): JSX.Element | null => {
  const isVersionStale = useIsVersionStale();
  const { isApp } = useDeviceInfo();

  if (!isVersionStale) {
    return null;
  }

  return (
    <div
      className={clsx(
        styles["newVersionWrapper"],
        isApp && styles["newVersionWrapperApp"]
      )}
    >
      <button
        type="button"
        aria-label="Refresh page"
        title="Refresh page"
        onClick={refreshWithoutToastOverride}
        className={styles["newVersionButton"]}
      >
        <div>
          <div className={styles["newVersionTitle"]}>
            A new version is available
          </div>
          <div className={styles["newVersionDescription"]}>
            Refresh to get the latest updates.
          </div>
        </div>

        <img
          src="/rocket-refresh.png"
          alt=""
          className={styles["newVersionImage"]}
        />
      </button>
    </div>
  );
};

export default NewVersionToast;
