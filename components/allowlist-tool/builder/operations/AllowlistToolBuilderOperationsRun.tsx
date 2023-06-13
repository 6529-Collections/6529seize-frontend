import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { AllowlistToolBuilderContext } from "../../../../pages/allowlist-tool/[id]";
import AllowlistToolPrimaryBtn from "../../common/AllowlistToolPrimaryBtn";
import {
  AllowlistDescription,
  AllowlistToolResponse,
} from "../../allowlist-tool.types";

export default function AllowlistToolBuilderOperationsRun() {
  const router = useRouter();
  const { setToasts, setAllowlist } = useContext(AllowlistToolBuilderContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runOperations = async () => {
    setIsLoading(true);
    const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}/runs`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allowlistId: router.query.id,
        }),
      });
      const data: AllowlistToolResponse<AllowlistDescription> =
        await response.json();
      if ("error" in data) {
        setToasts({
          messages:
            typeof data.message === "string" ? [data.message] : data.message,
          type: "error",
        });
        return;
      }
      setAllowlist(data);
      setToasts({
        messages: ["Started running operations"],
        type: "success",
      });
    } catch (error) {
      setToasts({
        messages: ["Something went wrong"],
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AllowlistToolPrimaryBtn
      onClick={() => runOperations()}
      type="button"
      loading={isLoading}
      size="medium"
    >
      Run operations
    </AllowlistToolPrimaryBtn>
  );
}
