import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { DropFull } from "../../entities/IDrop";
import { useContext, useEffect, useState } from "react";
import DropListWrapper from "../drops/view/DropListWrapper";
import { useSelector } from "react-redux";
import { selectActiveCurationFilterId } from "../../store/curationFilterSlice";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation";
import { Mutable } from "../../helpers/Types";
import { useDebounce } from "react-use";
import { AuthContext } from "../auth/Auth";
import CreateDrop, { CreateDropType } from "../drops/create/CreateDrop";

interface QueryUpdateInput {
  name: keyof typeof SEARCH_PARAMS_FIELDS;
  value: string | null;
}

interface StreamQuery {
  readonly curation_criteria_id?: string;
  readonly limit: string;
  readonly storm_id?: string;
  readonly input_profile?: string;
}

const REQUEST_SIZE = 10;

const SEARCH_PARAMS_FIELDS = {
  curation: "curation",
} as const;

export default function Stream() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);
  const { connectedProfile } = useContext(AuthContext);

  const getParamsFromUrl = (): StreamQuery => {
    const curation = searchParams.get(SEARCH_PARAMS_FIELDS.curation);
    const query: Mutable<StreamQuery> = {
      limit: `${REQUEST_SIZE}`,
    };
    if (curation) {
      query.curation_criteria_id = curation;
    }
    if (connectedProfile?.profile?.handle) {
      query.input_profile = connectedProfile.profile.handle;
    }
    return query;
  };

  const createQueryString = (
    updateItems: QueryUpdateInput[],
    lowerCase: boolean = true
  ): string => {
    const searchParamsStr = new URLSearchParams(searchParams.toString());
    for (const { name, value } of updateItems) {
      const key = SEARCH_PARAMS_FIELDS[name];
      if (!value) {
        searchParamsStr.delete(key);
      } else {
        searchParamsStr.set(key, lowerCase ? value.toLowerCase() : value);
      }
    }
    return searchParamsStr.toString();
  };

  const updateFields = async (
    updateItems: QueryUpdateInput[],
    lowerCase: boolean = true
  ): Promise<void> => {
    const queryString = createQueryString(updateItems, lowerCase);
    const path = queryString ? pathname + "?" + queryString : pathname;
    await router.replace(path, undefined, {
      shallow: true,
    });
  };

  useEffect(() => {
    if (params.curation_criteria_id !== activeCurationFilterId) {
      const items: QueryUpdateInput[] = [
        {
          name: "curation",
          value: activeCurationFilterId,
        },
      ];
      updateFields(items, false);
    }
  }, [activeCurationFilterId]);

  const [params, setParams] = useState(getParamsFromUrl());
  useEffect(
    () => setParams(getParamsFromUrl()),
    [searchParams, connectedProfile]
  );

  const [debouncedParams, setDebouncedParams] = useState<StreamQuery>(params);
  useDebounce(() => setDebouncedParams(params), 200, [params]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [QueryKey.COMMUNITY_DROPS, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        ...debouncedParams,
      };
      if (pageParam) {
        params.id_less_than = `${pageParam}`;
      }
      return await commonApiFetch<DropFull[]>({
        endpoint: `drops/`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.id ?? null,
  });

  const [drops, setDrops] = useState<DropFull[]>([]);

  useEffect(() => setDrops(data?.pages.flat() ?? []), [data]);

  const onBottomIntersection = (state: boolean) => {
    if (drops.length < REQUEST_SIZE) {
      return;
    }
    if (!state) {
      return;
    }
    if (status === "pending") {
      return;
    }
    if (isFetching) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }

    fetchNextPage();
  };

  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-2xl tw-mx-auto">
        <h1 className="tw-block tw-float-none">Stream</h1>
        <div className="tw-flow-root">
          <div className="tw-overflow-hidden tw-border-b tw-border-iron-700 tw-border-solid tw-border-x-0 tw-border-t-0">
            <div className="tw-overflow-x-auto tw-overflow-y-hidden no-scrollbar tw-pb-[1px]">
              <div
                className="-tw-mb-px tw-flex tw-gap-x-3 lg:tw-gap-x-4"
                aria-label="Tabs"
              >
                <button
                  type="button"
                  className="tw-bg-transparent tw-border-primary-400 tw-border-solid tw-border-x-0 tw-border-t-0 tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-py-4 tw-px-1 tw-pointer-events-none tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold"
                >
                  Live
                </button>
                <button
                  type="button"
                  className="tw-bg-transparent tw-border-transparent tw-text-iron-500  hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2  tw-border-x-0 tw-border-t-0 tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold"
                >
                  Trending
                </button>
                <button
                  type="button"
                  className="tw-bg-transparent tw-border-transparent tw-text-iron-500  hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-border-x-0 tw-border-t-0 tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold"
                >
                  Pool
                </button>
                <button
                  type="button"
                  className="tw-bg-transparent tw-border-transparent tw-text-iron-500  hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-border-x-0 tw-border-t-0 tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold"
                >
                  Pre-mint
                </button>
                <button
                  type="button"
                  className="tw-bg-transparent tw-border-transparent tw-text-iron-500  hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-border-x-0 tw-border-t-0 tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold"
                >
                  Auction
                </button>
                <button
                  type="button"
                  className="tw-bg-transparent tw-border-transparent tw-text-iron-500  hover:tw-text-iron-100 tw-whitespace-nowrap tw-border-b-2 tw-border-x-0 tw-border-t-0 tw-py-4 tw-px-1 tw-transition tw-duration-300 tw-ease-out tw-no-underline tw-leading-4 tw-p-0 tw-text-base tw-font-semibold"
                >
                  Minted
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="tw-mt-4 lg:tw-mt-6">
          {connectedProfile && (
            <CreateDrop
              profile={connectedProfile}
              quotedDropId={null}
              type={CreateDropType.DROP}
            />
          )}
          <DropListWrapper
            drops={drops}
            loading={isFetching}
            onBottomIntersection={onBottomIntersection}
          />
        </div>
      </div>
    </div>
  );
}
