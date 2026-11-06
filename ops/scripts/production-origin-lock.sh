#!/usr/bin/env bash
# Lock the production origin (the Elastic Beanstalk load balancer) to the page
# distribution with a secret origin header.
#
#   status  Show the current state. Never prints the secret.
#   apply   Lock, or re-lock after an unlock:
#           1. CloudFront sends X-Origin-Verify.
#           2. The HTTPS listener forwards only requests carrying it; the
#              default action answers 403.
#           3. The security group allows only HTTPS from the CloudFront
#              origin-facing prefix list. 0.0.0.0/0 rules left by an unlock
#              are revoked, because ManagedSecurityGroup means Elastic
#              Beanstalk never removes them.
#           Idempotent. Safe while traffic flows: the load balancer accepts a
#           new value before CloudFront sends it, and drops other values only
#           after the distribution has deployed. The listener is verified
#           directly at the origin (403 without the header, 200 with it)
#           through a temporary /32 rule for this machine, removed on exit.
#   rotate  Store a new secret in SSM, then run apply.
#   unlock  Accept direct traffic again, before any DNS rollback from
#           CloudFront to the load balancer:
#           1. The listener default action forwards, so the header is no
#              longer required.
#           2. The security group allows 443 and 80 from 0.0.0.0/0. Port 80
#              serves the HTTP listener's redirect to HTTPS for http://
#              visitors once DNS points at the load balancer.
#           3. A direct request without the header must return 200.
#           The header rule and the CloudFront header stay: they are harmless
#           while the default forwards, and apply re-locks without waiting for
#           a CloudFront deploy.
#
# Every step fails loudly; only "already exists" and "already absent" answers
# from AWS count as success.
#
# The secret lives in SSM Parameter Store as a SecureString. The script keeps it
# in memory and in mode-600 temporary files that are removed on exit. Requests
# that change AWS state print only IDs and statuses.
#
# CloudFront changes start from a fresh get-distribution-config and use its
# ETag with --if-match. Only the origin's X-Origin-Verify custom header is
# changed; every other field, including WebACLId, is written back as read.
#
# Runbook: ops/docs/developer/cloudfront-page-cache.md#origin-lockdown
set -euo pipefail
set +x
export MSYS_NO_PATHCONV=1 AWS_PAGER=""

REGION="${AWS_REGION:-us-east-1}"
ENV_NAME="${ENV_NAME:-seizeapp-env-node22}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-E3KTTDJUNHRYW9}"
ORIGIN_ID="${ORIGIN_ID:-production-alb-https}"
SITE_HOST="${SITE_HOST:-6529.io}"
PARAMETER="${ORIGIN_VERIFY_PARAMETER:-/6529/frontend/production/origin-verify-header}"
PREFIX_LIST="${PREFIX_LIST:-pl-3b927c52}"
HEADER="X-Origin-Verify"
RULE_PRIORITY="${RULE_PRIORITY:-1}"
POLL_SECONDS="${POLL_SECONDS:-90}"
# /api/version is no-store, so CloudFront always forwards it to the origin.
CHECK_PATH="/api/version"

umask 077
tmp="$(mktemp -d)"
probe_rule=""

log() { echo "$(date -u +%H:%M:%SZ) $*" >&2; }
die() {
  local message="$1"
  log "ERROR: $message"
  exit 1
}
aws_() { aws --region "$REGION" "$@"; }
# Native AWS CLI and jq builds on Windows may add carriage returns.
clean() { tr -d '\r'; }
# Native Windows builds of the AWS CLI and curl need Windows paths for files
# passed as arguments.
native_path() {
  local path="$1"
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -m "$path"
  else
    echo "$path"
  fi
}
file_arg() {
  local path="$1"
  echo "file://$(native_path "$path")"
}

cleanup() {
  if [[ -n "$probe_rule" ]]; then
    if aws_ ec2 revoke-security-group-ingress --group-id "$sg_id" \
      --ip-permissions "$probe_rule" --query Return --output text >/dev/null 2>&1; then
      log "removed the temporary probe rule"
    else
      log "WARNING: could not remove the temporary probe rule $probe_rule from $sg_id; remove it by hand"
    fi
  fi
  rm -rf "$tmp"
}
trap cleanup EXIT

discover() {
  lb_arn="$(aws_ elasticbeanstalk describe-environment-resources \
    --environment-name "$ENV_NAME" \
    --query 'EnvironmentResources.LoadBalancers[0].Name' --output text | clean)"
  [[ "$lb_arn" == arn:aws:elasticloadbalancing:* ]] || die "no load balancer for $ENV_NAME"
  eb_cname="$(aws_ elasticbeanstalk describe-environments --environment-names "$ENV_NAME" \
    --query 'Environments[0].CNAME' --output text | clean)"
  # shellcheck disable=SC2016 # JMESPath literal, not a shell expansion
  listener_arn="$(aws_ elbv2 describe-listeners --load-balancer-arn "$lb_arn" \
    --query 'Listeners[?Port==`443`].ListenerArn | [0]' --output text | clean)"
  [[ "$listener_arn" == arn:* ]] || die "no HTTPS listener on $lb_arn"
  local tgs
  tgs="$(aws_ elbv2 describe-target-groups --load-balancer-arn "$lb_arn" \
    --query 'TargetGroups[].TargetGroupArn' --output text | clean)"
  [[ "$(wc -w <<<"$tgs")" -eq 1 ]] || die "expected one target group, found: $tgs"
  tg_arn="$tgs"
  sg_id="$(aws_ elbv2 describe-load-balancers --load-balancer-arns "$lb_arn" \
    --query 'LoadBalancers[0].SecurityGroups[0]' --output text | clean)"
  [[ "$sg_id" == sg-* ]] || die "no security group on $lb_arn"
}

# Rules JSON holds the secret values, so it only ever goes to a temp file.
load_rule() {
  aws_ elbv2 describe-rules --listener-arn "$listener_arn" --output json >"$tmp/rules.json"
  rule_arn="$(jq -r --arg h "$HEADER" '[.Rules[] | select(any(.Conditions[]?;
      .Field == "http-header" and
      (.HttpHeaderConfig.HttpHeaderName | ascii_downcase) == ($h | ascii_downcase)))]
    | .[0].RuleArn // ""' <"$tmp/rules.json" | clean)"
  rule_values=()
  if [[ -n "$rule_arn" ]]; then
    mapfile -t rule_values < <(jq -r --arg a "$rule_arn" '.Rules[] | select(.RuleArn == $a)
      | .Conditions[] | select(.Field == "http-header") | .HttpHeaderConfig.Values[]' \
      <"$tmp/rules.json" | clean)
  fi
  default_action="$(jq -r '.Rules[] | select(.IsDefault) | .Actions[0].Type' <"$tmp/rules.json" | clean)"
}

write_conditions() { # values...
  printf '%s\n' "$@" | jq -R . | jq -s --arg h "$HEADER" \
    '[{Field: "http-header", HttpHeaderConfig: {HttpHeaderName: $h, Values: .}}]' >"$tmp/conditions.json"
}

set_rule_values() { # values...
  write_conditions "$@"
  if [[ -z "$rule_arn" ]]; then
    local taken
    taken="$(jq -r --arg p "$RULE_PRIORITY" '[.Rules[] | select(.Priority == $p)] | length' \
      <"$tmp/rules.json" | clean)"
    [[ "$taken" == 0 ]] || die "listener rule priority $RULE_PRIORITY is already used"
    aws_ elbv2 create-rule --listener-arn "$listener_arn" --priority "$RULE_PRIORITY" \
      --conditions "$(file_arg "$tmp/conditions.json")" \
      --actions "Type=forward,TargetGroupArn=$tg_arn" \
      --query 'Rules[0].RuleArn' --output text >/dev/null
    log "created the $HEADER forward rule (priority $RULE_PRIORITY) with $# value(s)"
  else
    aws_ elbv2 modify-rule --rule-arn "$rule_arn" \
      --conditions "$(file_arg "$tmp/conditions.json")" \
      --actions "Type=forward,TargetGroupArn=$tg_arn" \
      --query 'Rules[0].RuleArn' --output text >/dev/null
    log "set the $HEADER forward rule to $# value(s)"
  fi
  load_rule
}

read_secret() { # prints the secret, or nothing when the parameter does not exist
  local value
  if value="$(aws_ ssm get-parameter --name "$PARAMETER" --with-decryption \
    --query Parameter.Value --output text 2>"$tmp/ssm.err")"; then
    printf '%s' "$value" | tr -d '\r\n'
  elif grep -q ParameterNotFound "$tmp/ssm.err"; then
    return 0
  else
    die "reading $PARAMETER failed: $(clean <"$tmp/ssm.err")"
  fi
}

store_secret() {
  local value="$1" version
  jq -n --arg n "$PARAMETER" --arg v "$value" \
    '{Name: $n, Value: $v, Type: "SecureString", Overwrite: true,
      Description: "CloudFront origin header that the production load balancer requires (production-origin-lock.sh)"}' \
    >"$tmp/parameter.json"
  version="$(aws_ ssm put-parameter --cli-input-json "$(file_arg "$tmp/parameter.json")" \
    --query Version --output text | clean)"
  log "stored a new secret in $PARAMETER (version $version)"
}

new_secret() { openssl rand -hex 32 | clean; }

load_distribution() {
  aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --output json >"$tmp/distribution.json"
  jq -e --arg o "$ORIGIN_ID" 'any(.DistributionConfig.Origins.Items[]; .Id == $o)' \
    <"$tmp/distribution.json" >/dev/null || die "origin $ORIGIN_ID not found on $DISTRIBUTION_ID"
}

distribution_sends() { # exit 0 when the origin already sends this value
  local value="$1"
  SECRET="$value" jq -e --arg o "$ORIGIN_ID" --arg h "$HEADER" '
    .DistributionConfig.Origins.Items[] | select(.Id == $o)
    | any(.CustomHeaders.Items[]?; (.HeaderName | ascii_downcase) == ($h | ascii_downcase)
        and .HeaderValue == env.SECRET)' <"$tmp/distribution.json" >/dev/null
}

distribution_set_header() {
  local value="$1" etag
  etag="$(jq -r .ETag <"$tmp/distribution.json" | clean)"
  SECRET="$value" jq --arg o "$ORIGIN_ID" --arg h "$HEADER" '
    .DistributionConfig
    | .Origins.Items |= map(if .Id != $o then . else
        .CustomHeaders.Items = ([.CustomHeaders.Items[]?
            | select((.HeaderName | ascii_downcase) != ($h | ascii_downcase))]
          + [{HeaderName: $h, HeaderValue: env.SECRET}])
        | .CustomHeaders.Quantity = (.CustomHeaders.Items | length)
      end)' <"$tmp/distribution.json" >"$tmp/distribution-update.json"
  aws cloudfront update-distribution --id "$DISTRIBUTION_ID" --if-match "$etag" \
    --distribution-config "$(file_arg "$tmp/distribution-update.json")" \
    --query 'Distribution.Status' --output text >/dev/null
  log "CloudFront $DISTRIBUTION_ID now sends $HEADER; waiting for Deployed"
  aws cloudfront wait distribution-deployed --id "$DISTRIBUTION_ID"
  log "CloudFront $DISTRIBUTION_ID deployed"
}

check_site() { # three uncached requests through CloudFront must all return 200
  local code i
  for i in 1 2 3; do
    # curl prints 000 and exits non-zero when it cannot connect; the code decides.
    code="$(curl -s -o /dev/null -m 20 -w '%{http_code}' \
      "https://$SITE_HOST$CHECK_PATH?origin-lock-check=$RANDOM$i" || true)"
    log "CloudFront https://$SITE_HOST$CHECK_PATH -> $code"
    [[ "$code" == 200 ]] || return 1
  done
}

# Request the origin directly (load balancer hostname, site certificate).
direct_code() { # with-header|without-header
  local mode="$1" args=()
  if [[ "$mode" == with-header ]]; then
    printf '%s: %s\n' "$HEADER" "$secret" >"$tmp/header.txt"
    args=(-H "@$(native_path "$tmp/header.txt")")
  fi
  # curl prints 000 and exits non-zero when it cannot connect; callers compare the code.
  curl -s -o /dev/null -m 10 --connect-timeout 5 -w '%{http_code}' "${args[@]}" \
    --connect-to "$SITE_HOST:443:$eb_cname:443" \
    "https://$SITE_HOST$CHECK_PATH?origin-lock-check=$RANDOM" || true
}

poll_direct() { # mode expected-code
  local mode="$1" expected="$2" code="" deadline=$((SECONDS + POLL_SECONDS))
  while ((SECONDS < deadline)); do
    code="$(direct_code "$mode")"
    if [[ "$code" == "$expected" ]]; then
      log "origin direct, $mode -> $code"
      return 0
    fi
    sleep 3
  done
  log "origin direct, $mode -> $code (expected $expected after ${POLL_SECONDS}s)"
  return 1
}

# Authorize one ingress rule; an identical existing rule is fine, anything else fails.
authorize_ingress() {
  local permission="$1" err
  if ! err="$(aws_ ec2 authorize-security-group-ingress --group-id "$sg_id" \
    --ip-permissions "$permission" --query Return --output text 2>&1 >/dev/null)"; then
    [[ "$err" == *InvalidPermission.Duplicate* ]] || die "authorize on $sg_id failed: $err"
  fi
}

# Revoke one ingress rule; a rule that is already absent is fine, anything else fails.
revoke_ingress() {
  local permission="$1" err
  if ! err="$(aws_ ec2 revoke-security-group-ingress --group-id "$sg_id" \
    --ip-permissions "$permission" --query Return --output text 2>&1 >/dev/null)"; then
    [[ "$err" == *InvalidPermission.NotFound* ]] || die "revoke on $sg_id failed: $err"
  fi
}

ingress_rules() { # one "port:source" line per inbound rule
  aws_ ec2 describe-security-group-rules --filters "Name=group-id,Values=$sg_id" \
    --query 'SecurityGroupRules[?!IsEgress].[FromPort, CidrIpv4 || CidrIpv6 || PrefixListId || ReferencedGroupInfo.GroupId]' \
    --output text | clean | tr '\t' ':'
}

open_probe_path() { # temporary 443 rule for this machine, removed on exit
  local ip
  ip="$(curl -s -m 10 https://checkip.amazonaws.com | clean | tr -d '\n')"
  [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "could not determine this machine's public IP"
  probe_rule="IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=$ip/32}]"
  authorize_ingress "IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=$ip/32,Description=temporary production-origin-lock check}]"
  log "temporary probe rule: 443 from this machine"
}

close_probe_path() {
  [[ -n "$probe_rule" ]] || return 0
  revoke_ingress "$probe_rule"
  probe_rule=""
  log "removed the temporary probe rule"
}

set_default_action() { # forward|block
  local action="$1"
  if [[ "$action" == forward ]]; then
    aws_ elbv2 modify-listener --listener-arn "$listener_arn" \
      --default-actions "Type=forward,TargetGroupArn=$tg_arn" --query 'Listeners[0].Port' --output text >/dev/null
  else
    aws_ elbv2 modify-listener --listener-arn "$listener_arn" \
      --default-actions 'Type=fixed-response,FixedResponseConfig={StatusCode=403,ContentType=text/plain,MessageBody=Forbidden}' \
      --query 'Listeners[0].Port' --output text >/dev/null
  fi
  log "HTTPS listener default action: $action"
}

lock_security_group() {
  authorize_ingress "IpProtocol=tcp,FromPort=443,ToPort=443,PrefixListIds=[{PrefixListId=$PREFIX_LIST,Description=CloudFront origin-facing only}]"
  local port
  for port in 443 80; do
    revoke_ingress "IpProtocol=tcp,FromPort=$port,ToPort=$port,IpRanges=[{CidrIp=0.0.0.0/0}]"
  done
  local rules
  rules="$(ingress_rules | sort | tr '\n' ' ')"
  [[ "$rules" == "443:$PREFIX_LIST " ]] || die "security group $sg_id ingress is [$rules], expected only 443 from $PREFIX_LIST"
  log "security group $sg_id: only 443 from $PREFIX_LIST"
}

cmd_status() {
  discover
  load_rule
  load_distribution
  local cf_header secret_version matches=no current
  cf_header="$(jq -r --arg o "$ORIGIN_ID" --arg h "$HEADER" '.DistributionConfig.Origins.Items[]
    | select(.Id == $o) | any(.CustomHeaders.Items[]?; (.HeaderName | ascii_downcase) == ($h | ascii_downcase))' \
    <"$tmp/distribution.json" | clean)"
  secret_version="$(aws_ ssm describe-parameters \
    --parameter-filters "Key=Name,Values=$PARAMETER" \
    --query 'Parameters[0].Version' --output text | clean)"
  current="$(read_secret)"
  if [[ -n "$current" ]] && distribution_sends "$current"; then matches=yes; fi
  echo "load balancer:       ${lb_arn#*:loadbalancer/}"
  echo "security group:      $sg_id ingress: $(ingress_rules | tr '\n' ' ')"
  echo "listener default:    $default_action"
  if [[ -n "$rule_arn" ]]; then
    echo "header rule:         present, ${#rule_values[@]} value(s)"
  else
    echo "header rule:         absent"
  fi
  echo "CloudFront header:   $cf_header (matches SSM: $matches)"
  echo "SSM parameter:       $PARAMETER version $secret_version"
}

cmd_apply() {
  discover
  secret="$(read_secret)"
  if [[ -z "$secret" ]]; then
    store_secret "$(new_secret)"
    secret="$(read_secret)"
  fi
  [[ "$secret" =~ ^[0-9a-f]{32,128}$ ]] || die "the secret must be 32-128 lowercase hex characters"

  # 1. The load balancer accepts the current value, keeping any older value.
  load_rule
  local values=("$secret") v
  for v in "${rule_values[@]}"; do [[ "$v" == "$secret" ]] || values+=("$v"); done
  ((${#values[@]} <= 5)) || die "the header rule would have more than 5 values"
  if [[ -z "$rule_arn" || ${#values[@]} -ne ${#rule_values[@]} ]]; then
    set_rule_values "${values[@]}"
  fi

  # 2. CloudFront sends the current value everywhere.
  load_distribution
  if distribution_sends "$secret"; then
    log "CloudFront $DISTRIBUTION_ID already sends the current $HEADER"
  else
    distribution_set_header "$secret"
  fi
  check_site || die "the site check failed after the CloudFront change"

  # 3. Drop older values, require the header, and verify at the origin.
  if ((${#rule_values[@]} != 1)); then
    set_rule_values "$secret"
  fi
  open_probe_path
  if [[ "$default_action" != fixed-response ]]; then
    set_default_action block
  fi
  if ! poll_direct without-header 403 || ! poll_direct with-header 200 || ! check_site; then
    set_default_action forward
    die "the origin did not answer 403 without the header and 200 with it; default action restored to forward"
  fi
  close_probe_path

  # 4. Only CloudFront may connect (also removes rules left by an unlock).
  lock_security_group
  # Security group changes take a few seconds to reach the load balancer.
  poll_direct without-header 000 || die "a direct request from this machine still connects"
  check_site || die "the site check failed after locking the security group"
  log "origin lock applied"
}

cmd_rotate() {
  store_secret "$(new_secret)"
  cmd_apply
}

cmd_unlock() {
  discover
  set_default_action forward
  local port
  for port in 443 80; do
    authorize_ingress "IpProtocol=tcp,FromPort=$port,ToPort=$port,IpRanges=[{CidrIp=0.0.0.0/0}]"
    ingress_rules | grep -qx "$port:0.0.0.0/0" || die "security group $sg_id does not allow $port from 0.0.0.0/0"
    log "security group $sg_id: $port open to 0.0.0.0/0"
  done
  load_rule
  [[ "$default_action" == forward ]] || die "HTTPS listener default action is $default_action, not forward"
  poll_direct without-header 200 || die "a direct request without the header does not return 200"
  log "unlocked: direct requests reach the app without the header; DNS may now move"
}

case "${1:-}" in
  status) cmd_status ;;
  apply) cmd_apply ;;
  rotate) cmd_rotate ;;
  unlock) cmd_unlock ;;
  *)
    sed -n '2,31p' "$0" >&2
    exit 2
    ;;
esac
