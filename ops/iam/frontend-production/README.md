# Frontend production deployment permissions

The role `gha-frontend-deploy-production` in account `987989283142` trusts
GitHub OIDC for
`repo:6529-Collections/6529seize-frontend:environment:production`, with audience
`sts.amazonaws.com`. The existing environment permits only `main`. Set its
`AWS_DEPLOY_ROLE_ARN` variable to the role's ARN. Sessions last 5,400 seconds and
use `frontend-production-<run ID>` for CloudTrail correlation.

## Scope

- Upload and read versioned artifacts under `seize-web/web_build/<40-character
version>/`, plus the exact `web_build/current-production-version.json` object.
  IAM's `?` wildcard checks directory length, not hexadecimal syntax; the
  workflow independently requires an exact hexadecimal Git commit SHA.
  Failed multipart uploads may be aborted; object and bucket deletion are not
  granted. The bucket uses SSE-S3, requiring no KMS permission.
- Describe/create application versions for `seize app`; describe/update only
  `seizeapp-env-node22` in `us-east-1`.
- Read and invalidate only the existing announcement distribution `EKB17CMB021J6`.
  The workflow uses its known ID instead of listing all distributions.
  Before publishing, it requires the distribution domain to match the
  announcement endpoint. A lookup, mismatch, or invalidation failure fails the
  job instead of silently claiming publication success.
- Get/pass only the existing `ec2-seize-prod` role and read its instance
  profile. Passing is limited to Elastic Beanstalk and EC2. No IAM policy,
  credential, trust, service-linked-role, or identity writes are allowed.

The existing environment uses caller permissions for downstream deployment
operations. Its CloudFormation stack, Auto Scaling group, launch template, and
log groups are inventoried from the live environment and deployment calls.
Those operations are allowed only through AWS forward access sessions
(`aws:ViaAWSService=true`), excluding direct calls from the deployment role.
They remain restricted to this environment's resources and `us-east-1`.
Required regional EC2/Auto Scaling metadata calls cannot be resource-scoped;
they carry the same service-delegation restriction.

Elastic Beanstalk also requires `s3:CreateBucket` and
`s3:PutBucketOwnershipControls` for its existing regional
storage bucket, `elasticbeanstalk-us-east-1-987989283142`, when updating the
environment. This is limited to that exact bucket, `us-east-1`, and AWS forward
access sessions. It does not grant bucket deletion or access to other buckets.
This bucket is shared by the account's Elastic Beanstalk environments; the
ownership-control permission applies at bucket level and cannot be limited to
an environment prefix. The production deployment observed its existing
`ObjectWriter` ownership configuration; the workflow does not change it.

Normal rolling deployments may update capacity and launch-template versions.
Creating a different environment, replacing networking/resources, changing IAM
policies, or provisioning additional services requires administrative review and
a policy refresh. Exact launch-template and distribution IDs fail closed after
replacement.

The existing production service/instance role retains its runtime permissions.
Deploying application code or configuration can exercise those permissions
indirectly. Runtime role reduction and separation remain follow-up work.

## Validation and rollout

`manifest.json` records compact policy hashes and the inventory source commit.
`verification.json` records installation and read-only validation; retain live
deployment/E2E evidence in the PR. Access Analyzer and simulations must pass
before attachment. Verify actual installed trust, policy contents and attachment
set; temporary read-test roles must be removed without saving credentials.

After staging deployment and related E2E pass, merge the reviewed PR into current
`main` and dispatch `Web Deploy - PROD` pinned to the reviewed merge commit.
Preserve autonomous release notes and every artifact, downgrade, exact-version,
and Elastic Beanstalk readiness check. The current
`RollingWithAdditionalBatch` deployment policy is unchanged. Verify the OIDC
session, service-delegated deployment permissions, Green/Ready exact version,
live HTTP version, and related production E2E.

Keep legacy AWS keys until migration is verified and separate human CLI
credentials are established. No backend redeployment or schema change is needed.

References:

- [Elastic Beanstalk resource permissions](https://docs.aws.amazon.com/service-authorization/latest/reference/list_elasticbeanstalk.html)
- [AWS forward access sessions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_forward_access_sessions.html)
- [GitHub OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
