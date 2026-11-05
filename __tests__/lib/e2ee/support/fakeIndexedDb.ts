/** Standards-compatible IndexedDB for storage/upgrade/checkpoint tests. */
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";

export function createFakeIndexedDb(): {
  factory: globalThis.IDBFactory;
  install(): () => void;
  has(name: string): boolean;
} {
  const factory = new IDBFactory();
  const names = new Set<string>();
  const open = factory.open.bind(factory);
  const remove = factory.deleteDatabase.bind(factory);
  factory.open = (name, version) => {
    names.add(name);
    return open(name, version);
  };
  factory.deleteDatabase = (name) => {
    names.delete(name);
    return remove(name);
  };
  return {
    factory,
    has: (name) => names.has(name),
    install() {
      const previous = globalThis.IDBKeyRange;
      globalThis.IDBKeyRange = IDBKeyRange;
      return () => {
        globalThis.IDBKeyRange = previous;
      };
    },
  };
}
