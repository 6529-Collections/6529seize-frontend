import ts from "typescript";
import { z } from "zod";

const mediaSchema = z
  .object({
    src: z.string().min(1),
    alt: z.string(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    caption: z.string().optional(),
    href: z.string().optional(),
  })
  .strict();

const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), content: z.string() }).strict(),
  z.object({ type: z.literal("paragraph"), content: z.string() }).strict(),
  z.object({ type: z.literal("html"), html: z.string() }).strict(),
  z.object({ type: z.literal("image"), media: mediaSchema }).strict(),
  z
    .object({
      type: z.literal("video"),
      video: z
        .object({
          src: z.string(),
          title: z.string(),
          caption: z.string().optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("quote"),
      content: z.string(),
      cite: z.string().optional(),
    })
    .strict(),
  z.object({ type: z.literal("divider") }).strict(),
]);

// Deliberately narrower than ReactNode: unsupported expressions are reported,
// never evaluated or replaced with a rendering of TypeScript source code.
const contentSchema = z
  .object({
    source: z.literal("migrated-wordpress"),
    path: z.string().refine((value) => {
      const [empty, root, ...segments] = value.split("/");
      return (
        empty === "" &&
        (root === "capital" || root === "museum") &&
        segments.every((segment) => /^[a-z0-9-]+$/.test(segment))
      );
    }),
    title: z.string().min(1),
    description: z.string(),
    section: z.string(),
    heroImage: mediaSchema.optional(),
    blocks: z.array(blockSchema),
  })
  .strict();

export type StaticContent = z.infer<typeof contentSchema>;
export type StaticMedia = z.infer<typeof mediaSchema>;

export class MigrationInputError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "MigrationInputError";
  }
}

function literalValue(expression: ts.Expression): unknown {
  if (
    ts.isSatisfiesExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  ) {
    return literalValue(expression.expression);
  }
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return expression.text;
  }
  if (ts.isNumericLiteral(expression)) return Number(expression.text);
  if (ts.isArrayLiteralExpression(expression))
    return expression.elements.map(literalValue);
  if (ts.isObjectLiteralExpression(expression)) return objectValue(expression);
  if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === "migratedWordPressTrustedHtml" &&
    expression.arguments.length === 1
  ) {
    const argument = expression.arguments[0];
    if (
      argument &&
      (ts.isStringLiteral(argument) ||
        ts.isNoSubstitutionTemplateLiteral(argument))
    ) {
      return argument.text;
    }
  }
  throw new MigrationInputError("source.unsupported_expression");
}

function objectValue(
  expression: ts.ObjectLiteralExpression
): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null) as Record<
    string,
    unknown
  >;
  for (const property of expression.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
    ) {
      throw new MigrationInputError("source.unsupported_property");
    }
    const name = property.name.text;
    if (Object.hasOwn(result, name))
      throw new MigrationInputError("source.duplicate_property");
    result[name] = literalValue(property.initializer);
  }
  return result;
}

function isContentDeclaration(declaration: ts.VariableDeclaration): boolean {
  if (declaration.type?.getText() === "MigratedWordPressStaticPageContent")
    return true;
  const initializer = declaration.initializer;
  return (
    !!initializer &&
    ts.isSatisfiesExpression(initializer) &&
    initializer.type.getText() === "MigratedWordPressStaticPageContent"
  );
}

export function parseStaticContent(source: string): StaticContent {
  const syntax = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve },
  });
  if (
    syntax.diagnostics?.some(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
    )
  ) {
    throw new MigrationInputError("source.invalid_syntax");
  }
  const file = ts.createSourceFile(
    "content.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const declarations = file.statements
    .filter(ts.isVariableStatement)
    .filter((statement) =>
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )
    )
    .flatMap((statement) => [...statement.declarationList.declarations])
    .filter(isContentDeclaration);
  if (declarations.length !== 1 || !declarations[0]?.initializer) {
    throw new MigrationInputError("source.expected_one_typed_content_export");
  }
  const parsed = contentSchema.safeParse(
    literalValue(declarations[0].initializer)
  );
  if (!parsed.success)
    throw new MigrationInputError("source.invalid_content_shape");
  return parsed.data;
}
