import type { CicStatement } from "@/entities/IProfile";
import { getStatementMeta, STATEMENT_GROUP } from "@/helpers/Types";

function getExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function getStatementPresentation(
  statement: CicStatement,
  fallbackTitle: string
): {
  readonly canOpen: boolean;
  readonly displayValue: string;
  readonly title: string;
} {
  const statementMeta = getStatementMeta(statement.statement_type);
  const externalUrl = getExternalUrl(statement.statement_value);
  const isCustomArtLink =
    statement.statement_group === STATEMENT_GROUP.NFT_ACCOUNTS &&
    statement.statement_type === "LINK";
  const customLabel = statement.statement_comment?.trim();
  let title = statementMeta?.title ?? fallbackTitle;
  if (isCustomArtLink && customLabel) {
    title = customLabel;
  }

  return {
    canOpen: statementMeta
      ? statementMeta.canOpenStatement && externalUrl !== null
      : statement.statement_group === STATEMENT_GROUP.NFT_ACCOUNTS &&
        externalUrl?.protocol === "https:",
    displayValue:
      isCustomArtLink && externalUrl
        ? externalUrl.hostname
        : statement.statement_value,
    title,
  };
}
