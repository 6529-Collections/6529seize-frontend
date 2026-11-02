export function isAnonymousAuthor(
  author: { readonly is_anonymous?: boolean } | null | undefined
): boolean {
  return author?.is_anonymous === true;
}
