"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { commonApiFetch } from "@/services/api/common-api";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

enum AVAILABILITY {
  AVAILABLE = "AVAILABLE",
  NOT_AVAILABLE = "NOT_AVAILABLE",
  IDLE = "IDLE", // empty or username not changed
}

export default function UserSettingsUsername({
  userName,
  originalUsername,
  setUserName,
  setIsAvailable,
  setIsLoading,
}: {
  readonly userName: string;
  readonly originalUsername: string;
  readonly setUserName: (userName: string) => void;
  readonly setIsAvailable: (isAvailable: boolean) => void;
  readonly setIsLoading: (isLoading: boolean) => void;
}) {
  const [debouncedUsername, setDebouncedUsername] = useState<string>(
    userName ?? ""
  );
  useDebounce(() => setDebouncedUsername(userName), 300, [userName]);
  const [usernameAvailability, setUsernameAvailability] = useState("");
  const [availabilityState, setAvailabilityState] = useState<AVAILABILITY>(
    AVAILABILITY.IDLE
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => setIsLoading(loading), [loading]);

  useEffect(() => {
    const getUsernameAvailability = async () => {
      if (!debouncedUsername) {
        setUsernameAvailability("");
        setAvailabilityState(AVAILABILITY.IDLE);
        return;
      }
      if (debouncedUsername.toLowerCase() === originalUsername.toLowerCase()) {
        setUsernameAvailability("");
        setAvailabilityState(AVAILABILITY.IDLE);
        return;
      }
      setLoading(true);
      const availability = await commonApiFetch<{
        available: boolean;
        message: string;
      }>({
        endpoint: `profiles/${debouncedUsername}/availability`,
      });
      setLoading(false);
      setUsernameAvailability(availability.message);
      if (!availability.available) {
        setAvailabilityState(AVAILABILITY.NOT_AVAILABLE);
      } else {
        setAvailabilityState(AVAILABILITY.AVAILABLE);
      }
    };
    getUsernameAvailability();
  }, [debouncedUsername, originalUsername]);

  useEffect(() => {
    if (availabilityState === AVAILABILITY.AVAILABLE) {
      setIsAvailable(true);
    } else {
      setIsAvailable(false);
    }
  }, [availabilityState]);

  return (
    <div>
      <label
        htmlFor="name"
        className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-200"
      >
        Username
      </label>
      <div className="tw-relative tw-mt-2">
        <input
          id="name"
          type="text"
          name="name"
          required
          autoComplete="off"
          aria-describedby="username-availability"
          aria-invalid={availabilityState === AVAILABILITY.NOT_AVAILABLE}
          aria-busy={loading}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Please select a username"
          className="tw-form-input tw-block tw-w-full tw-rounded-xl tw-border-0 tw-bg-iron-900/70 tw-px-4 tw-py-3 tw-pr-11 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-200 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-white/15 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400/60"
        />
        {loading && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
            <CircleLoader />
          </div>
        )}
      </div>
      <p
        id="username-availability"
        aria-live="polite"
        className={`tw-m-0 tw-mt-2 tw-block tw-min-h-4 tw-text-xs tw-font-medium tw-leading-4 ${
          availabilityState === AVAILABILITY.NOT_AVAILABLE
            ? "tw-text-error"
            : "tw-text-green-400"
        }`}
      >
        {usernameAvailability}
      </p>
    </div>
  );
}
