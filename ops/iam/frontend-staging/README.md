# Frontend staging deployment permissions

The role `gha-frontend-deploy-staging` in account `987989283142` trusts GitHub
OIDC for `repo:6529-Collections/6529seize-frontend:environment:staging`, with
audience `sts.amazonaws.com`. The existing GitHub environment permits only
`1a-staging`. Set its `AWS_DEPLOY_ROLE_ARN` variable to the role's ARN.
The workflow uses `frontend-staging-<run ID>` sessions lasting 5,400 seconds.
Temporary credentials cap the signed artifact URL's validity at session expiry.
The deployment job lasts at most 75 minutes; the session begins inside that job
and lasts 90 minutes. Its download/deploy window therefore finishes before
credential expiry, with at least a 15-minute margin. The workflow explicitly
rejects an artifact bucket region other than the approved `us-east-1`.

## Scope

- Upload, download, cleanup, and failed multipart-upload cleanup only under
  `s3://seize-web/staging/`, plus bucket-location metadata in `us-east-1`.
- `ssm:SendCommand` only with `AWS-RunShellScript` on
  `i-059d5adda6cc33b90` in `eu-west-1`. Existing deployment records confirmed
  this server; it is registered and online in SSM.
- SSM instance metadata and command invocation results in `eu-west-1`.
  These APIs do not support resource-level authorization. Invocation read
  access therefore includes other known command IDs in that region, while
  command execution remains restricted to the approved server.

No IAM administration, role passing, secret-value access, backend Lambda
deployment, production artifact writes, or unrelated resource mutations are
granted. The artifact bucket uses SSE-S3, so no KMS permission is required.

SSM commands run as root on the approved server. This is necessary for the
existing staging deployment mechanism and gives the deployer access to that
host's files and runtime credentials. The host's instance profile is unchanged;
it contains SSM and CloudWatch agent policies. Host credential isolation remains
separate work.

## Validation and rollout

`manifest.json` records the reviewed policy hash and source inventory commit.
`verification.json` is a timestamped installation snapshot. Validate with IAM
Access Analyzer and positive/negative simulations, compare installed policy and
trust documents, and verify read-only calls using a temporary role whose session
policy removes writes. Delete that temporary role after testing; retain no
temporary credentials.

Merge the reviewed change into current `1a-staging`, preserve concurrent work,
and follow the ordinary automatic deployment through artifact integrity, SSM
success, exact HTTP version, and related staging E2E before production. Builds
continue without deployment credentials; the existing verified-artifact and
PM2 reload/rollback mechanisms are preserved.

See [deployment](../../docs/developer/deployment.md) and
[GitHub OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).
