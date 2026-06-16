const TYPE_ORDER = new Set(["string", "number", "boolean"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function serialize(value: unknown, path: string): string {
  if (value === null) {
    return "null";
  }

  const valueType = typeof value;
  if (TYPE_ORDER.has(valueType)) {
    if (valueType === "number") {
      if (!Number.isFinite(value)) {
        throw new TypeError(
          `CMS package contains non-finite number at ${path}`
        );
      }
      return JSON.stringify(Object.is(value, -0) ? 0 : value);
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map((item, index) => {
        const itemPath = `${path}[${index}]`;
        return serialize(item, itemPath);
      })
      .join(",")}]`;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));

    return `{${entries
      .map(([key, item]) => {
        const itemPath = `${path}.${key}`;
        return `${JSON.stringify(key)}:${serialize(item, itemPath)}`;
      })
      .join(",")}}`;
  }

  throw new TypeError(`CMS package contains unsupported value at ${path}`);
}

export function canonicalizeCmsJson(value: unknown): string {
  return serialize(value, "$");
}
