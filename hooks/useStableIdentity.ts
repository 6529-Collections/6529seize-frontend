"use client";

import {
  useCallback,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * A callback whose identity never changes and that always runs the latest
 * implementation. For callbacks handed to context consumers, so a provider
 * re-render does not change the context value.
 */
export function useStableCallback<Args extends unknown[], Result>(
  implementation: (...args: Args) => Result
): (...args: Args) => Result {
  const latest = useRef(implementation);
  useInsertionEffect(() => {
    latest.current = implementation;
  }, [implementation]);
  return useCallback((...args: Args) => latest.current(...args), []);
}

const shallowEqualObjects = (left: object, right: object): boolean => {
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = Object.keys(leftRecord);
  return (
    keys.length === Object.keys(rightRecord).length &&
    keys.every(
      (key) =>
        Object.hasOwn(rightRecord, key) &&
        Object.is(leftRecord[key], rightRecord[key])
    )
  );
};

const sameItem = <T>(left: T, right: T): boolean =>
  Object.is(left, right) ||
  (typeof left === "object" &&
    left !== null &&
    typeof right === "object" &&
    right !== null &&
    shallowEqualObjects(left, right));

const shareList = <List extends readonly unknown[]>(
  prior: List,
  list: List
): List => {
  let changed = prior.length !== list.length;
  const next = list.map((item, index) => {
    const priorItem = prior[index];
    if (index < prior.length && sameItem(priorItem, item)) {
      return priorItem;
    }
    changed = true;
    return item;
  }) as unknown as List;
  return changed ? next : prior;
};

/**
 * Remembers the last list it returned. A render that React discards still
 * updates it; the next render then shares against that list. That only
 * changes which equal objects are reused, never the values returned.
 */
const createListSharer = <List extends readonly unknown[]>() => {
  let last: List | null = null;
  return (list: List): List => {
    const shared =
      last === null || last === list ? list : shareList(last, list);
    last = shared;
    return shared;
  };
};

/**
 * The list with structural sharing against its previous value: items equal
 * to the previous item at the same position (by shallow comparison) keep the
 * previous object, and an unchanged list keeps the previous array.
 */
export function useStableList<List extends readonly unknown[]>(
  list: List
): List {
  const [share] = useState(createListSharer<List>);
  return useMemo(() => share(list), [share, list]);
}
