import { useContext, useEffect, useState } from "react";
import {
  AllowlistDescription,
  AllowlistToolResponse,
} from "./allowlist-tool.types";
import dynamic from "next/dynamic";
import { AllowlistToolContext } from "../../pages/allowlist-tool";

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
  const { setToasts } = useContext(AllowlistToolContext);
  const [allowlists, setAllowlists] = useState<AllowlistDescription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getAllowlists = async () => {
    setIsLoading(true);
    setAllowlists([]);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists`;
    try {
      const response = await fetch(url);
      const data: AllowlistToolResponse<AllowlistDescription[]> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return;
      }
      setAllowlists(data);
    } catch (error: any) {
      setToasts({ messages: [error.message], type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllowlists();
  }, []);

  const removeAllowlist = (id: string) => {
    setAllowlists(allowlists.filter((allowlist) => allowlist.id !== id));
  };

  return (
    <>
      {allowlists.length === 0 ? (
        <AllowlistToolAllowlistsEmpty />
      ) : (
        <AllowlistToolAllowlistsTable
          allowlists={allowlists}
          onAllowlistRemoved={removeAllowlist}
        />
      )}
    </>
  );
}
