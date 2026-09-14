"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validate,
} = require("../scripts/seo-validate-search-console-export.cjs");

test("validates an aggregate performance export without raw queries", () => {
  const result = validate(
    "performance",
    [
      "date,page_type,device,country,query_class,clicks,impressions,ctr,position",
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
          "date,page_type,device,country,query_class,clicks,impressions,ctr,position",
          "2026-09-10,museum,MOBILE,usa,non_brand,3,100,0.3,12.5",
        ].join("\n")
      ),
    /ctr does not equal/
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

test("rejects impossible calendar dates", () => {
  assert.throws(
    () =>
      validate(
        "performance",
        [
          "date,page_type,device,country,query_class,clicks,impressions,ctr,position",
          "2026-02-31,museum,MOBILE,usa,non_brand,3,100,0.03,12.5",
        ].join("\n")
      ),
    /date must be YYYY-MM-DD/
  );
});
