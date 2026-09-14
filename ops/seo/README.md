# Organic search measurement

This directory is the repository-side contract for measuring organic-search
work. It intentionally contains no account credentials, raw query exports, or
visitor-level analytics data.

Start with [measurement-contract.md](measurement-contract.md). Use the empty
templates as the normalized import format, then validate a local export before
sharing an aggregate report:

```powershell
seize exec node ops/scripts/seo-validate-search-console-export.cjs `
  --kind performance --input path/to/performance.csv
seize exec node ops/scripts/seo-validate-search-console-export.cjs `
  --kind inspection --input path/to/inspection.csv
```

The validator does not upload data or contact Google. Its optional `--output`
file is a local aggregate validation receipt; do not place raw exports or
receipts containing non-public query data in the repository.
