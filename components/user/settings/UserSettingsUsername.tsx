import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { commonApiFetch } from "../../../services/api/common-api";
import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";

enum AVAILABILITY {
  AVAILABLE = "AVAILABLE",
  NOT_AVAILABLE = "NOT_AVAILABLE",
  iron = "iron", // empty or username not changed
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
    AVAILABILITY.iron
  );
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const getUsernameAvailability = async () => {
      if (!debouncedUsername) {
        setUsernameAvailability("");
        setAvailabilityState(AVAILABILITY.iron);
        return;
      }
      if (debouncedUsername.toLowerCase() === originalUsername.toLowerCase()) {
        setUsernameAvailability("");
        setAvailabilityState(AVAILABILITY.iron);
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

  return (
    <div>
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300">
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
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 hover:tw-ring-iron-600 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
        {loading && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center tw-right-0 tw-pr-3">
            <CircleLoader />
          </div>
        )}
      </div>
      <p
        className={`tw-mt-1 tw-block tw-text-sm tw-font-normal tw-leading-5 tw-h-2 ${
          availabilityState === AVAILABILITY.NOT_AVAILABLE
            ? "tw-text-red"
            : "tw-text-green"
        } `}
      >
        {usernameAvailability}
      </p>
    </div>
  );
}
