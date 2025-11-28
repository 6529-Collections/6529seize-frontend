import type { ContractOverview, Suggestion } from "../types";

export function mapSuggestionToOverview(suggestion: Suggestion): ContractOverview {
    return {
        ...suggestion,
        description: null,
        bannerImageUrl: null,
    };
}
