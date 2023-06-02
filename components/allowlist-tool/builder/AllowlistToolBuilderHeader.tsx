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

  // useEffect(() => {
  //   if (router.query.id) {
  //     setLoading(true);
  //     setData(null);
  //     setErrors([]);
  //     const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${router.query.id}`;
  //     fetch(url)
  //       .then((response) => response.json())
  //       .then((data: AllowlistToolResponse<AllowlistDescription>) => {
  //         if ("error" in data) {
  //           typeof data.message === "string"
  //             ? setErrors([data.message])
  //             : setErrors(data.message);
  //         } else {
  //           setData(data);
  //         }

  //         setLoading(false);
  //       });
  //   }
  // }, [router.query.id]);

  return (
    <>
      <div className="tw-w-full tw-flex-col">
        <nav className="tw-flex" aria-label="Breadcrumb">
          <ol
            role="list"
            className="tw-pl-0 tw-mb-0 tw-list-none tw-flex tw-items-center tw-space-x-4"
          >
            <li>
              <a
                href="#"
                className="tw-no-underline tw-text-sm tw-font-medium tw-text-gray-400 hover:tw-text-gray-50 tw-transition tw-duration-300 tw-ease-out"
              >
                Dashboard
              </a>
            </li>
            <li>
              <div className="tw-flex tw-items-center">
                <svg
                  className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clip-rule="evenodd"
                  />
                </svg>
                <a
                  href="#"
                  className="tw-no-underline tw-ml-4 tw-text-sm tw-font-medium tw-text-gray-100"
                  aria-current="page"
                >
                  Meme card 91
                </a>
              </div>
            </li>
          </ol>
        </nav>
        <div className="tw-mt-5">
          <h1 className="tw-uppercase tw-float-none tw-mb-0">Meme Card 91</h1>
        </div>
      </div>
    </>
  );
}
