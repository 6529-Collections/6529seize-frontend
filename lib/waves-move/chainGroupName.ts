/** A group the 6529 Network holds, under its chain id. */
const CHAIN_GROUP_ID = /^0x[0-9a-f]{64}$/;

/**
 * Whether a group made on the 6529 Network still shows the name 6529.io
 * gives it until it reads the real one: "Group " and the first 10
 * characters of its chain id. The id is checked too, so a 6529.io group a
 * person named that way is never taken for one.
 */
export function isChainGroupNamePending(
  group: { readonly id: string; readonly name: string } | null | undefined
): boolean {
  if (!group || !CHAIN_GROUP_ID.test(group.id)) {
    return false;
  }
  return group.name === `Group ${group.id.slice(0, 10)}`;
}
