import { PUBLIC_REVIEW_MESSAGES } from "@/i18n/messages/public-review";
import { registerNamespaceMessages } from "@/i18n/namespaces/registry";

// `publicReview.*` copy is used only by the /reviews routes. Import this module
// for its side effect from review code alone:
// - app/reviews/[review]/layout.tsx, for server components and metadata;
// - PublicReviewMessages, for client components;
// - any review module that reads review copy while it loads.
// Importing it from shared code puts the copy back in every page's bundle.
registerNamespaceMessages(PUBLIC_REVIEW_MESSAGES);
