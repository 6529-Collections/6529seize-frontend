import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AllowlistDescription } from "./builder/AllowlistToolBuilderHeader";
import { AllowlistToolResponse } from "./allowlist-tool.types";
import dynamic from "next/dynamic";

const AllowlistToolAllowlistsEmpty = dynamic(
  () => import("./AllowlistToolAllowlistsEmpty"),
  {
    ssr: false,
  }
);

const AllowlistToolAllowlistsTable = dynamic(
  () => import("./AllowlistToolAllowlistsTable"),
  {
    ssr: false,
  }
);

export default function AllowlistToolAllowlists() {
  const router = useRouter();
  const [allowlists, setAllowlists] = useState<AllowlistDescription[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);


  const fetchData = () => {
    setLoading(true);
    setAllowlists([]);
    setErrors([]);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists`;
    fetch(url)
      .then((response) => response.json())
      .then((data: AllowlistToolResponse<AllowlistDescription[]>) => {
        if ("error" in data) {
          typeof data.message === "string"
            ? setErrors([data.message])
            : setErrors(data.message);
        } else {
          setAllowlists(data);
        }
        setLoading(false);
      });
  };

  useEffect(() => fetchData(), []);

  return (
    <>
      {allowlists.length === 0 ? (
        <AllowlistToolAllowlistsEmpty />
      ) : (
        <AllowlistToolAllowlistsTable
          allowlists={allowlists}
          onAllowlistRemoved={fetchData}
        />
      )}
    </>
  );
}
