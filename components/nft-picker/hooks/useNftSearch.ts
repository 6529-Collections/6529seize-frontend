import { useMemo, useState, useEffect } from "react";
import { isValidEthAddress } from "@/helpers/Helpers";
import {
    useCollectionSearch,
    useContractOverviewQuery,
    primeContractCache,
} from "@/hooks/useAlchemyNftQueries";
import type { Suggestion, SupportedChain } from "../types";

type UseNftSearchProps = {
    chain: SupportedChain;
    debounceMs: number;
    hideSpamProp: boolean;
};

export function useNftSearch({ chain, debounceMs, hideSpamProp }: UseNftSearchProps) {
    const [query, setQuery] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [hideSpam, setHideSpam] = useState(hideSpamProp);

    useEffect(() => {
        setHideSpam(hideSpamProp);
    }, [hideSpamProp]);

    const isAddressQuery = useMemo(() => isValidEthAddress(query.trim()), [query]);
    const contractQueryAddress = useMemo(() => {
        if (!isAddressQuery) {
            return undefined;
        }
        return query.trim() as `0x${string}`;
    }, [isAddressQuery, query]);

    const { data: searchResult } = useCollectionSearch({
        query,
        chain,
        hideSpam,
        debounceMs,
        enabled: !isAddressQuery && query.length > 1,
    });

    const addressOverviewQuery = useContractOverviewQuery({
        address: contractQueryAddress,
        chain,
        enabled: Boolean(contractQueryAddress),
    });

    const suggestionList: Suggestion[] = useMemo(() => {
        if (contractQueryAddress && addressOverviewQuery.data) {
            return [addressOverviewQuery.data];
        }
        return searchResult?.items ?? [];
    }, [contractQueryAddress, addressOverviewQuery.data, searchResult?.items]);

    const hiddenCount = useMemo(() => {
        if (contractQueryAddress) {
            return 0;
        }
        return searchResult?.hiddenCount ?? 0;
    }, [contractQueryAddress, searchResult?.hiddenCount]);

    const handleToggleSpam = () => {
        setHideSpam((prev) => !prev);
    };

    const resetSearch = () => {
        setIsOpen(false);
        setQuery("");
        setActiveIndex(0);
    };

    return {
        query,
        setQuery,
        isOpen,
        setIsOpen,
        activeIndex,
        setActiveIndex,
        hideSpam,
        suggestionList,
        hiddenCount,
        handleToggleSpam,
        resetSearch,
        primeContractCache, // Exporting this to be used by parent
    };
}
