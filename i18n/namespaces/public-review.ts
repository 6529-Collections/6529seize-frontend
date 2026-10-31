import { PUBLIC_REVIEW_MESSAGES } from "@/i18n/messages/public-review";
import { registerNamespaceMessages } from "@/i18n/namespaces/registry";

// `publicReview.*` copy is used only by the /reviews routes. Every review
// module that reads it with t() or tRich() imports this module for its side
// effect, so the copy is registered before that module runs, whatever order
// the framework loads modules in. The /reviews layout and PublicReviewMessages
// also import it as a backstop for the whole route.
// Importing it from shared code puts the copy back in every page's bundle.
registerNamespaceMessages(PUBLIC_REVIEW_MESSAGES);
