const ACCESSIBLE_METHODS = new Set([
  "getByRole",
  "getByLabel",
  "getByText",
  "getByPlaceholder",
  "getByAltText",
  "getByTitle",
  "getByTestId",
]);
const SCOPING_METHODS = new Set(["first", "last", "nth", "filter", "locator"]);

function methodName(node) {
  if (node?.type !== "MemberExpression") return undefined;
  if (!node.computed) return node.property.name;
  return staticString(node.property);
}

function unwrap(node) {
  while (
    ["ChainExpression", "TSNonNullExpression", "TSAsExpression"].includes(
      node?.type
    )
  ) {
    node = node.expression;
  }
  return node;
}

function hasAccessibleScope(node) {
  node = unwrap(node);
  if (node?.type !== "CallExpression") return false;
  const name = methodName(node.callee);
  if (ACCESSIBLE_METHODS.has(name)) return true;
  return SCOPING_METHODS.has(name) && hasAccessibleScope(node.callee.object);
}

function staticString(node) {
  if (node?.type === "Literal" && typeof node.value === "string")
    return node.value;
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }
  return undefined;
}

function isDocumentSelector(selector) {
  // Document state and metadata have no user-facing accessible locator.
  return (
    selector === "html" ||
    selector === "body" ||
    selector === "head" ||
    /^meta\[(?:name|property)=(?:"[^"\r\n]+"|'[^'\r\n]+')\]$/u.test(
      selector ?? ""
    )
  );
}

export default {
  meta: {
    type: "suggestion",
    schema: [],
    messages: {
      accessible:
        "Start with getByRole/getByLabel or another getBy* query. CSS/XPath narrowing is allowed in a direct chain under that accessible query; document metadata and html/body/head are explicit exceptions.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = unwrap(node.callee);
        if (methodName(callee) !== "locator") return;
        if (hasAccessibleScope(callee.object)) return;
        if (isDocumentSelector(staticString(node.arguments[0]))) return;
        context.report({ node, messageId: "accessible" });
      },
    };
  },
};
