import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AllowlistToolResponse } from "../allowlist-tool.types";

export interface AllowlistDescriptionActiveRun {
  readonly id: string;
  readonly createdAt: number;
}

export interface AllowlistDescription {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly createdAt: number;
  readonly activeRun?: AllowlistDescriptionActiveRun;
}

export default function AllowlistToolBuilderHeader() {
  const router = useRouter();
  const [data, setData] = useState<AllowlistDescription | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (router.query.id) {
      setLoading(true);
      setData(null);
      setErrors([]);
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}`;
      fetch(url)
        .then((response) => response.json())
        .then((data: AllowlistToolResponse<AllowlistDescription>) => {
          if ("error" in data) {
            typeof data.message === "string"
              ? setErrors([data.message])
              : setErrors(data.message);
          } else {
            setData(data);
          }

          setLoading(false);
        });
    }
  }, [router.query.id]);

  return (
    <>
      <div>Name</div>
    </>
  );
}
