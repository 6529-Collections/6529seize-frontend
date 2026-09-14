"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validate,
} = require("../scripts/seo-validate-search-console-export.cjs");
const PERFORMANCE_HEADER =
  "date,page_type,device,country,query_class,clicks,impressions,ctr,position";

test("validates an aggregate performance export without raw queries", () => {
  const result = validate(
    "performance",
    [
      PERFORMANCE_HEADER,
      "2026-09-10,museum,MOBILE,usa,non_brand,3,100,0.03,12.5",
    ].join("\n")
  );
  assert.equal(result.valid, true);
  assert.equal(result.rows, 1);
});

test("rejects an inconsistent performance CTR", () => {
  assert.throws(
    () =>
      validate(
        "performance",
        [
          PERFORMANCE_HEADER,
          "2026-09-10,museum,MOBILE,usa,non_brand,3,100,0.3,12.5",
        ].join("\n")
      ),
    /ctr does not equal/
  );
});

test("rejects blank or padded numeric cells", () => {
  for (const clicks of ["", " 3 "]) {
    assert.throws(
      () =>
        validate(
          "performance",
          [
            PERFORMANCE_HEADER,
            `2026-09-10,museum,MOBILE,usa,non_brand,${clicks},100,0.03,12.5`,
          ].join("\n")
        ),
      /clicks must be a non-negative integer/
    );
  }
});

test("requires consistent positions for rows with and without impressions", () => {
  assert.throws(
    () =>
      validate(
        "performance",
        [
          PERFORMANCE_HEADER,
          "2026-09-10,museum,MOBILE,usa,non_brand,0,100,0,0",
        ].join("\n")
      ),
    /position must be at least 1/
  );
  assert.throws(
    () =>
      validate(
        "performance",
        [
          PERFORMANCE_HEADER,
          "2026-09-10,museum,MOBILE,usa,non_brand,0,0,0,1",
        ].join("\n")
      ),
    /position must be 0 when impressions are 0/
  );
});

test("validates an inspection sample", () => {
  const result = validate(
    "inspection",
    [
      "checked_on,page_type,url,submitted_sitemap,indexing_state,google_canonical,last_crawl",
      "2026-09-14,museum,https://6529.io/museum/network/works/example,true,Indexed,https://6529.io/museum/network/works/example,2026-09-10",
    ].join("\n")
  );
  assert.deepEqual(result.pageTypes, ["museum"]);
  assert.deepEqual(result.dateRange, {
    start: "2026-09-14",
    end: "2026-09-14",
  });
});

test("accepts a missing Google canonical for an uncrawled URL", () => {
  const result = validate(
    "inspection",
    [
      "checked_on,page_type,url,submitted_sitemap,indexing_state,google_canonical,last_crawl",
      "2026-09-14,education,https://6529.io/education/example,false,Unknown,,",
    ].join("\n")
  );
  assert.equal(result.valid, true);
});

test("requires an inspection receipt date", () => {
  assert.throws(
    () =>
      validate(
        "inspection",
        [
          "checked_on,page_type,url,submitted_sitemap,indexing_state,google_canonical,last_crawl",
          ",education,https://6529.io/education/example,false,Unknown,,",
        ].join("\n")
      ),
    /checked_on must be YYYY-MM-DD/
  );
});

test("rejects impossible calendar dates", () => {
  assert.throws(
    () =>
      validate(
        "performance",
        [
          PERFORMANCE_HEADER,
          "2026-02-31,museum,MOBILE,usa,non_brand,3,100,0.03,12.5",
        ].join("\n")
      ),
    /date must be YYYY-MM-DD/
  );
});

test("rejects unknown, duplicated, and missing CLI arguments", () => {
  const script =
    require.resolve("../scripts/seo-validate-search-console-export.cjs");
  const { spawnSync } = require("node:child_process");
  for (const args of [
    ["--kind", "performance", "--unknown", "value", "--input", "file.csv"],
    ["--kind", "performance", "--kind", "inspection", "--input", "file.csv"],
    ["--kind", "performance", "--output", "--input", "file.csv"],
  ]) {
    const result = spawnSync(process.execPath, [script, ...args], {
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  }
});
