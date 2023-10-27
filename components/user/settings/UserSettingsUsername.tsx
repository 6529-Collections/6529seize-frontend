import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { commonApiFetch } from "../../../services/api/common-api";
import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";

enum AVAILABILITY {
  AVAILABLE = "AVAILABLE",
  NOT_AVAILABLE = "NOT_AVAILABLE",
  NEUTRAL = "NEUTRAL", // empty or username not changed
}

export default function UserSettingsUsername({
  userName,
  originalUsername,
  setUserName,
}: {
  userName: string;
  originalUsername: string;
  setUserName: (userName: string) => void;
}) {
  const [debouncedUsername, setDebouncedUsername] = useState<string>(
    userName ?? ""
  );
  useDebounce(() => setDebouncedUsername(userName), 300, [userName]);
  const [usernameAvailability, setUsernameAvailability] = useState("");
  const [availabilityState, setAvailabilityState] = useState<AVAILABILITY>(
    AVAILABILITY.NEUTRAL
  );
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const getUsernameAvailability = async () => {
      if (!debouncedUsername) {
        setUsernameAvailability("");
        setAvailabilityState(AVAILABILITY.NEUTRAL);
        return;
      }
      if (debouncedUsername === originalUsername) {
        setUsernameAvailability("");
        setAvailabilityState(AVAILABILITY.NEUTRAL);
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
  }, [debouncedUsername]);

  return (
    <div>
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-350">
        Username
      </label>
      <div className="tw-mt-2 tw-relative">
        <input
          type="text"
          name="name"
          required
          autoComplete="off"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Please select a username"
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-900 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-600 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-neutral-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        {loading && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center tw-right-0 tw-pr-3">
            <CircleLoader />
          </div>
        )}
      </div>
      <p
        className={`tw-block tw-text-sm tw-font-normal tw-leading-5 tw-h-2 ${
          availabilityState === AVAILABILITY.NOT_AVAILABLE
            ? "tw-text-red-400"
            : "tw-text-green-400"
        } `}
      >
        {usernameAvailability}
      </p>
    </div>
  );
}
