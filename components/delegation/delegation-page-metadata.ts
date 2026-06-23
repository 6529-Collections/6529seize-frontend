import { DelegationCenterSection } from "@/types/enums";
import {
  getDelegationArticle,
  getDelegationArticleIndex,
  getDelegationArticleSlugAt,
  isDelegationFaqChildArticle,
} from "./html/delegationContent";

interface DelegationPageMetadata {
  readonly title: string;
  readonly navLabel: string;
  readonly description: string;
  readonly articleSlug?: string;
  readonly isFaqChildArticle: boolean;
}

interface DelegationArticleNavigation {
  readonly previous:
    | { readonly slug: string; readonly title: string; readonly href: string }
    | undefined;
  readonly next:
    | { readonly slug: string; readonly title: string; readonly href: string }
    | undefined;
}

const SECTION_METADATA: Readonly<
  Partial<
    Record<
      DelegationCenterSection,
      Omit<DelegationPageMetadata, "isFaqChildArticle">
    >
  >
> = {
  [DelegationCenterSection.CENTER]: {
    title: "Delegation Center",
    navLabel: "Delegation Center",
    description: "Register, manage, and review NFT delegation records.",
  },
  [DelegationCenterSection.REGISTER_DELEGATION]: {
    title: "Register Delegation",
    navLabel: "Register Delegation",
    description:
      "Register a wallet that can use NFT utility without moving NFTs.",
  },
  [DelegationCenterSection.REGISTER_SUB_DELEGATION]: {
    title: "Register Delegation Manager",
    navLabel: "Register Delegation Manager",
    description:
      "Give a manager wallet permission to maintain delegations and consolidations.",
  },
  [DelegationCenterSection.REGISTER_CONSOLIDATION]: {
    title: "Register Consolidation",
    navLabel: "Register Consolidation",
    description: "Connect wallets you control for 6529 collection metrics.",
  },
  [DelegationCenterSection.ASSIGN_PRIMARY_ADDRESS]: {
    title: "Assign Primary Address",
    navLabel: "Assign Primary Address",
    description: "Assign the primary wallet used for delegation-aware views.",
  },
  [DelegationCenterSection.ANY_COLLECTION]: {
    title: "Any Collection Delegations",
    navLabel: "Any Collection",
    description: "Manage delegation records that apply to every collection.",
  },
  [DelegationCenterSection.MEMES_COLLECTION]: {
    title: "The Memes Delegations",
    navLabel: "The Memes",
    description: "Manage delegation records for The Memes collection.",
  },
  [DelegationCenterSection.MEME_LAB_COLLECTION]: {
    title: "Meme Lab Delegations",
    navLabel: "Meme Lab",
    description: "Manage delegation records for Meme Lab.",
  },
  [DelegationCenterSection.GRADIENTS_COLLECTION]: {
    title: "6529 Gradient Delegations",
    navLabel: "6529 Gradient",
    description: "Manage delegation records for 6529 Gradient.",
  },
  [DelegationCenterSection.WALLET_ARCHITECTURE]: {
    title: "Wallet Architecture",
    navLabel: "Wallet Architecture",
    description:
      "Understand vault, transaction, and minting wallet architecture.",
    articleSlug: "reference-overview-wallet-architecture",
  },
  [DelegationCenterSection.FAQ]: {
    title: "Delegation FAQ",
    navLabel: "Delegation FAQ",
    description: "Find delegation help articles and setup references.",
    articleSlug: "delegation-faq",
  },
  [DelegationCenterSection.CONSOLIDATION_USE_CASES]: {
    title: "Consolidation Use Cases",
    navLabel: "Consolidation Use Cases",
    description: "Learn when and how to use wallet consolidations.",
    articleSlug: "consolidation-use-cases",
  },
  [DelegationCenterSection.CHECKER]: {
    title: "Wallet Checker",
    navLabel: "Wallet Checker",
    description:
      "Check delegation, delegation manager, and consolidation records for a wallet.",
  },
};

function titleCaseSlug(slug: string) {
  return slug
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getDelegationRouteMetadata(
  sectionPath: readonly string[] | undefined
): DelegationPageMetadata {
  const path = sectionPath && sectionPath.length > 0 ? sectionPath : undefined;
  const firstSegment = path?.[0];
  const finalSegment = path?.[path.length - 1];
  const knownSection = firstSegment
    ? SECTION_METADATA[firstSegment as DelegationCenterSection]
    : undefined;

  if (knownSection && path?.length === 1) {
    return {
      ...knownSection,
      isFaqChildArticle: false,
    };
  }

  const article = getDelegationArticle(finalSegment);
  if (article && finalSegment) {
    return {
      title: article.title,
      navLabel: article.title,
      description: article.summary,
      articleSlug: finalSegment,
      isFaqChildArticle: isDelegationFaqChildArticle(finalSegment),
    };
  }

  if (knownSection) {
    return {
      ...knownSection,
      isFaqChildArticle: false,
    };
  }

  return {
    title: finalSegment ? titleCaseSlug(finalSegment) : "Delegation",
    navLabel: "Delegation",
    description: "NFT Delegation",
    isFaqChildArticle: false,
  };
}

export function getDelegationAppTitle(metadata: DelegationPageMetadata) {
  return `${metadata.title} | 6529.io`;
}

export function getDelegationArticleNavigation(
  slug: string | undefined
): DelegationArticleNavigation {
  if (!slug || !isDelegationFaqChildArticle(slug)) {
    return { previous: undefined, next: undefined };
  }

  const index = getDelegationArticleIndex(slug);
  const previousSlug = getDelegationArticleSlugAt(index - 1);
  const nextSlug = getDelegationArticleSlugAt(index + 1);

  function toLink(candidateSlug: string | undefined) {
    const article = getDelegationArticle(candidateSlug);
    if (
      !candidateSlug ||
      !article ||
      !isDelegationFaqChildArticle(candidateSlug)
    ) {
      return undefined;
    }

    return {
      slug: candidateSlug,
      title: article.title,
      href: `/delegation/delegation-faq/${candidateSlug}`,
    };
  }

  return {
    previous: toLink(previousSlug),
    next: toLink(nextSlug),
  };
}
