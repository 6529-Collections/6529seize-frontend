import {
  applyDropOrderIds,
  getDropOrderUpdates,
  getRollbackOrderIds,
} from "@/components/user/waves/userPageProfileWaveMasonryOrder.helpers";

const drop = (id: string) => ({ id });

describe("userPageProfileWaveMasonryOrder helpers", () => {
  it("builds full absolute priority updates for every drop", () => {
    expect(getDropOrderUpdates([drop("b"), drop("a"), drop("c")])).toEqual([
      { dropId: "b", priorityOrder: 1 },
      { dropId: "a", priorityOrder: 2 },
      { dropId: "c", priorityOrder: 3 },
    ]);
  });

  it("uses the persisted order for rollback when it covers the current drops", () => {
    expect(
      getRollbackOrderIds({
        currentDrops: [drop("a"), drop("b"), drop("c")],
        persistedOrderIds: ["c", "a", "b"],
      })
    ).toEqual(["c", "a", "b"]);
  });

  it("falls back to the pre-drag order when persisted order is empty", () => {
    const currentDrops = [drop("a"), drop("b"), drop("c")];

    expect(
      getRollbackOrderIds({
        currentDrops,
        persistedOrderIds: [],
      })
    ).toEqual(["a", "b", "c"]);
    expect(applyDropOrderIds(currentDrops, ["a", "b", "c"])).toEqual(
      currentDrops
    );
  });
});
