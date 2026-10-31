import { parseCsvFile } from "@/components/mapping-tools/mappingToolCsv";

function parse<T>(
  csv: string,
  mapRow: Parameters<typeof parseCsvFile<T>>[1]
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    void parseCsvFile(
      new File([csv], "test.csv", { type: "text/csv" }),
      mapRow,
      resolve,
      () => reject(new Error("parse failed"))
    );
  });
}

describe("parseCsvFile", () => {
  it("reports the mapped rows with generic column keys", async () => {
    const rows = await parse("address,token_id\n0xabc,1\n0xdef,2\n", (row) => ({
      address: row["_0"],
      tokenId: row["_1"],
    }));

    expect(rows).toEqual([
      { address: "address", tokenId: "token_id" },
      { address: "0xabc", tokenId: "1" },
      { address: "0xdef", tokenId: "2" },
    ]);
  });

  it("skips rows the mapper rejects and passes the row index", async () => {
    const seenIndexes: number[] = [];

    const rows = await parse("address\n0xabc\n0xdef\n", (row, index) => {
      seenIndexes.push(index);
      return index === 0 ? undefined : row["_0"];
    });

    expect(rows).toEqual(["0xabc", "0xdef"]);
    expect(seenIndexes).toEqual([0, 1, 2]);
  });

  it("reports an error when the file cannot be read", async () => {
    const text = jest
      .spyOn(File.prototype, "text")
      .mockRejectedValue(new Error("unreadable"));
    const onParsed = jest.fn();
    const onError = jest.fn();

    await parseCsvFile(
      new File(["a"], "test.csv"),
      (row) => row["_0"],
      onParsed,
      onError
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onParsed).not.toHaveBeenCalled();
    text.mockRestore();
  });
});
