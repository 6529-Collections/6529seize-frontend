import { useState } from "react";
import { AllowlistDescription } from "./builder/AllowlistToolBuilderHeader";
import { useRouter } from "next/router";

export default function AllowlistToolAllowlistsTableItem({
  allowlist,
  onAllowlistRemoved,
}: {
  allowlist: AllowlistDescription;
  onAllowlistRemoved: () => void;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const deleteAllowlist = () => {
    setLoading(true);
    setErrors([]);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${allowlist.id}`;
    fetch(url, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.status === 200 && response.statusText === "OK") {
          onAllowlistRemoved();
          return;
        }
        response
          .json()
          .then((data) => {
            if ("error" in data) {
              typeof data.message === "string"
                ? setErrors([data.message])
                : setErrors(data.message);
            } else {
              setErrors(["Something went wrong. Please try again."]);
            }
          })
          .catch(() => setErrors(["Something went wrong. Please try again."]));
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <div className="tw-w-full tw-inline-flex tw-justify-between">
        <div>{allowlist.name}</div>
        {errors.length > 0 &&
          errors.map((error, index) => (
            <div key={`${allowlist.id}-error-${index}`}>{error}</div>
          ))}
        <button onClick={deleteAllowlist}>Delete</button>
      </div>
    </>
  );
}
