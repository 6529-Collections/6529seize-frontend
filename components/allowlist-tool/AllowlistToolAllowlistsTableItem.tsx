import { useState } from "react";
import { useRouter } from "next/router";
import { AllowlistDescription } from "./allowlist-tool.types";

export default function AllowlistToolAllowlistsTableItem({
  allowlist,
  onAllowlistRemoved,
}: {
  allowlist: AllowlistDescription;
  onAllowlistRemoved: (id: string) => void;
}) {
  const router = useRouter();
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
          onAllowlistRemoved(allowlist.id);
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

  const goToAllowlist = () => {
    router.push(`/allowlist-tool/${allowlist.id}`);
  };

  return (
    <>
      <div
        className="tw-w-full tw-inline-flex tw-justify-between"
        onClick={goToAllowlist}
      >
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
