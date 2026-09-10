import { ARTWORK_DOCUMENTATION_MESSAGES } from "@/i18n/messages/artwork-documentation";
export default function ArtworkDocumentationLoading() {
  return (
    <p role="status" className="tw-py-8 tw-text-iron-300">
      {ARTWORK_DOCUMENTATION_MESSAGES["artworkDocumentation.loading"]}
    </p>
  );
}
