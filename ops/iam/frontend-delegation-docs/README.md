# Delegation docs CDN publishing permissions

The `gha-frontend-docs-publish` role trusts GitHub OIDC for
`repo:6529-Collections/6529seize-frontend:environment:delegation-docs`, with
audience `sts.amazonaws.com`. This separate GitHub environment permits only
`main` and contains its own `AWS_DEPLOY_ROLE_ARN` variable. Its distinct subject
isolates publishing from the frontend staging and production deployment roles.

The role can upload, delete, and abort multipart uploads only under
`6529bucket/delegation-content/`, in `eu-west-1`. Deletion is required by the
existing `aws s3 sync --delete` command, which syncs into the content-addressed
package directory. Listing requires the same prefix; bucket-location lookup is
limited to this bucket. Object contents, unrelated prefixes, other buckets,
bucket deletion, IAM operations, and app deployment are not granted. The bucket
uses SSE-S3, requiring no KMS permission. No CloudFront API is used by this
publisher; CDN verification uses public content URLs.

OIDC sessions last 3,600 seconds; the job timeout is 30 minutes. AWS credentials
are obtained after dependency installation, and IPFS credentials are exposed
only to the publishing step. A default dry run builds a receipt and verifies
OIDC plus read-only S3 access, without publishing to IPFS or syncing content.
The same read/write policy is used for an explicitly requested live publication.

The policy manifest records hashes/sizes and installation evidence. Recompute
and validate policy documents before updating; check actual trust and exact
attachments. Retain the main-branch dry-run and CloudTrail identity proof in
the PR. Removing obsolete GitHub AWS key secrets after migration does not
deactivate the shared human CLI key in AWS.
