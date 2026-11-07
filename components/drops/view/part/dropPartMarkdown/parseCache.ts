import type { Plugin } from "unified";

/**
 * A least-recently-used cache of finished markdown trees, so re-rendering a
 * drop part with the same content does not parse and transform it again.
 *
 * react-markdown parses and runs every plugin on every render. Two plugins
 * short-circuit that:
 * - `remark` goes first among the remark plugins. It wraps the parser: on a
 *   cache hit the parser returns an empty tree, so the other plugins run on
 *   nothing.
 * - `rehype` goes last among the rehype plugins. On a hit it hands back the
 *   cached tree; on a miss it stores the finished tree.
 *
 * Entries are keyed by namespace and content. A namespace stands for one
 * set of plugins and plugin options; trees made with different plugins must
 * use different namespaces. A finished tree is shared between renders and
 * instances: react-markdown's own post-processing (URL transform, raw HTML
 * handling) gives the same result when applied to it again, and the drop
 * renderers do not modify the nodes they receive.
 */
interface MarkdownParseCachePlugins {
  readonly remark: Plugin<[]>;
  readonly rehype: Plugin<[]>;
}

interface MarkdownParseCache {
  /** The plugin pair for one namespace; the same objects on every call. */
  readonly plugins: (namespace: string) => MarkdownParseCachePlugins;
  readonly size: () => number;
  readonly clear: () => void;
}

interface CacheTree {
  readonly type: string;
}

type Parser = (document: string, file: unknown) => CacheTree;

interface ParserHolder {
  parser?: Parser | undefined;
}

/** @api The default size, checked by the cache tests. */
export const MARKDOWN_PARSE_CACHE_MAX_ENTRIES = 2_000;

const cacheKey = (namespace: string, content: string) =>
  `${namespace}\u0000${content}`;

/** @api A separate cache; the app uses `dropMarkdownParseCache`. */
export function createMarkdownParseCache(
  maxEntries: number = MARKDOWN_PARSE_CACHE_MAX_ENTRIES
): MarkdownParseCache {
  const entries = new Map<string, CacheTree>();
  const pluginsByNamespace = new Map<string, MarkdownParseCachePlugins>();

  const take = (key: string): CacheTree | undefined => {
    const tree = entries.get(key);
    if (tree !== undefined) {
      // Most recently used goes last; eviction takes the first.
      entries.delete(key);
      entries.set(key, tree);
    }
    return tree;
  };

  const store = (key: string, tree: CacheTree) => {
    entries.set(key, tree);
    for (const oldestKey of entries.keys()) {
      if (entries.size <= maxEntries) break;
      entries.delete(oldestKey);
    }
  };

  const createPlugins = (namespace: string): MarkdownParseCachePlugins => {
    const remark: Plugin<[]> = function cacheParsedMarkdown(this: unknown) {
      const processor = this as ParserHolder;
      const parse = processor.parser;
      if (parse === undefined) return;
      processor.parser = (document, file) =>
        entries.has(cacheKey(namespace, document))
          ? { type: "root", children: [] }
          : parse(document, file);
    };
    const rehype: Plugin<[]> = () => (tree, file) => {
      const key = cacheKey(namespace, String(file.value));
      const cached = take(key);
      if (cached !== undefined) return cached as typeof tree;
      store(key, tree);
      return tree;
    };
    return { remark, rehype };
  };

  return {
    plugins: (namespace) => {
      let plugins = pluginsByNamespace.get(namespace);
      if (plugins === undefined) {
        plugins = createPlugins(namespace);
        pluginsByNamespace.set(namespace, plugins);
      }
      return plugins;
    },
    size: () => entries.size,
    clear: () => entries.clear(),
  };
}

/** The cache shared by every drop part on the page. */
export const dropMarkdownParseCache = createMarkdownParseCache();
