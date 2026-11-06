#!/usr/bin/env bash
# Lock the production origin (the Elastic Beanstalk load balancer) to the page
# distribution with a secret origin header.
#
#   status  Show the current state. Never prints the secret.
#   apply   Make CloudFront send the header, then make the load balancer
#           require it (HTTPS listener: header rule forwards, default 403).
#           Idempotent. Safe while traffic flows: the load balancer accepts the
#           new value before CloudFront sends it, and drops other values only
#           after the distribution has deployed.
#   rotate  Store a new secret in SSM, then run apply.
#   unlock  Accept direct traffic again: default action forwards, and the
#           security group allows 80 and 443 from anywhere. Run it before any
#           DNS rollback from CloudFront to the load balancer.
#
# The secret lives in SSM Parameter Store as a SecureString. The script keeps it
# in memory and in mode-600 temporary files that are removed on exit. Requests
# that change AWS state print only IDs and statuses.
#
# CloudFront changes start from a fresh get-distribution-config and use its
# ETag with --if-match. Only the origin's X-Origin-Verify custom header is
# changed; every other field, including WebACLId, is written back as read.
#
# Runbook: ops/docs/developer/cloudfront-page-cache.md
set -euo pipefail
set +x
export MSYS_NO_PATHCONV=1 AWS_PAGER=""

REGION="${AWS_REGION:-us-east-1}"
ENV_NAME="${ENV_NAME:-seizeapp-env-node22}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-E3KTTDJUNHRYW9}"
ORIGIN_ID="${ORIGIN_ID:-production-alb-https}"
PARAMETER="${ORIGIN_VERIFY_PARAMETER:-/6529/frontend/production/origin-verify-header}"
HEADER="X-Origin-Verify"
RULE_PRIORITY="${RULE_PRIORITY:-1}"
CHECK_URL="${CHECK_URL:-https://6529.io/api/version}"

umask 077
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

log() { echo "$(date -u +%H:%M:%SZ) $*" >&2; }
die() { log "ERROR: $*"; exit 1; }
aws_() { aws --region "$REGION" "$@"; }
# AWS CLI on Windows needs Windows paths for file:// arguments.
file_arg() {
  if command -v cygpath >/dev/null 2>&1; then
    echo "file://$(cygpath -m "$1")"
  else
    echo "file://$1"
  fi
}

discover() {
  lb_arn="$(aws_ elasticbeanstalk describe-environment-resources \
    --environment-name "$ENV_NAME" \
    --query 'EnvironmentResources.LoadBalancers[0].Name' --output text)"
  [[ "$lb_arn" == arn:aws:elasticloadbalancing:* ]] || die "no load balancer for $ENV_NAME"
  # shellcheck disable=SC2016 # JMESPath literal, not a shell expansion
  listener_arn="$(aws_ elbv2 describe-listeners --load-balancer-arn "$lb_arn" \
    --query 'Listeners[?Port==`443`].ListenerArn | [0]' --output text)"
  [[ "$listener_arn" == arn:* ]] || die "no HTTPS listener on $lb_arn"
  local tgs
  tgs="$(aws_ elbv2 describe-target-groups --load-balancer-arn "$lb_arn" \
    --query 'TargetGroups[].TargetGroupArn' --output text)"
  [[ "$(wc -w <<<"$tgs")" -eq 1 ]] || die "expected one target group, found: $tgs"
  tg_arn="$tgs"
  sg_id="$(aws_ elbv2 describe-load-balancers --load-balancer-arns "$lb_arn" \
    --query 'LoadBalancers[0].SecurityGroups[0]' --output text)"
}

# Rules JSON holds the secret values, so it only ever goes to a temp file.
load_rule() {
  aws_ elbv2 describe-rules --listener-arn "$listener_arn" --output json >"$tmp/rules.json"
  rule_arn="$(jq -r --arg h "$HEADER" '[.Rules[] | select(any(.Conditions[]?;
      .Field == "http-header" and
      (.HttpHeaderConfig.HttpHeaderName | ascii_downcase) == ($h | ascii_downcase)))]
    | .[0].RuleArn // ""' <"$tmp/rules.json")"
  rule_values=()
  if [[ -n "$rule_arn" ]]; then
    mapfile -t rule_values < <(jq -r --arg a "$rule_arn" '.Rules[] | select(.RuleArn == $a)
      | .Conditions[] | select(.Field == "http-header") | .HttpHeaderConfig.Values[]' <"$tmp/rules.json")
  fi
  default_action="$(jq -r '.Rules[] | select(.IsDefault) | .Actions[0].Type' <"$tmp/rules.json")"
}

write_conditions() { # values...
  printf '%s\n' "$@" | jq -R . | jq -s --arg h "$HEADER" \
    '[{Field: "http-header", HttpHeaderConfig: {HttpHeaderName: $h, Values: .}}]' >"$tmp/conditions.json"
}

set_rule_values() { # values...
  write_conditions "$@"
  if [[ -z "$rule_arn" ]]; then
    local taken
    taken="$(jq -r --arg p "$RULE_PRIORITY" '[.Rules[] | select(.Priority == $p)] | length' <"$tmp/rules.json")"
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

read_secret() {
  aws_ ssm get-parameter --name "$PARAMETER" --with-decryption \
    --query Parameter.Value --output text 2>/dev/null || true
}

store_secret() { # value
  jq -n --arg n "$PARAMETER" --arg v "$1" \
    '{Name: $n, Value: $v, Type: "SecureString", Overwrite: true,
      Description: "CloudFront origin header that the production load balancer requires (production-origin-lock.sh)"}' \
    >"$tmp/parameter.json"
  local version
  version="$(aws_ ssm put-parameter --cli-input-json "$(file_arg "$tmp/parameter.json")" \
    --query Version --output text)"
  log "stored a new secret in $PARAMETER (version $version)"
}

new_secret() { openssl rand -hex 32; }

load_distribution() {
  aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" --output json >"$tmp/distribution.json"
  jq -e --arg o "$ORIGIN_ID" 'any(.DistributionConfig.Origins.Items[]; .Id == $o)' \
    <"$tmp/distribution.json" >/dev/null || die "origin $ORIGIN_ID not found on $DISTRIBUTION_ID"
}

distribution_sends() { # value -> exit 0 when the origin already sends it
  SECRET="$1" jq -e --arg o "$ORIGIN_ID" --arg h "$HEADER" '
    .DistributionConfig.Origins.Items[] | select(.Id == $o)
    | any(.CustomHeaders.Items[]?; (.HeaderName | ascii_downcase) == ($h | ascii_downcase)
        and .HeaderValue == env.SECRET)' <"$tmp/distribution.json" >/dev/null
}

distribution_set_header() { # value
  local etag
  etag="$(jq -r .ETag <"$tmp/distribution.json")"
  SECRET="$1" jq --arg o "$ORIGIN_ID" --arg h "$HEADER" '
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

check_site() {
  local code
  code="$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$CHECK_URL" || true)"
  log "$CHECK_URL -> $code"
  [[ "$code" == 200 ]]
}

set_default_action() { # forward|block
  if [[ "$1" == forward ]]; then
    aws_ elbv2 modify-listener --listener-arn "$listener_arn" \
      --default-actions "Type=forward,TargetGroupArn=$tg_arn" --query 'Listeners[0].Port' --output text >/dev/null
  else
    aws_ elbv2 modify-listener --listener-arn "$listener_arn" \
      --default-actions 'Type=fixed-response,FixedResponseConfig={StatusCode=403,ContentType=text/plain,MessageBody=Forbidden}' \
      --query 'Listeners[0].Port' --output text >/dev/null
  fi
  log "HTTPS listener default action: $1"
}

cmd_status() {
  discover
  load_rule
  load_distribution
  local cf_header ingress
  cf_header="$(jq -r --arg o "$ORIGIN_ID" --arg h "$HEADER" '.DistributionConfig.Origins.Items[]
    | select(.Id == $o) | any(.CustomHeaders.Items[]?; (.HeaderName | ascii_downcase) == ($h | ascii_downcase))' \
    <"$tmp/distribution.json")"
  ingress="$(aws_ ec2 describe-security-group-rules --filters "Name=group-id,Values=$sg_id" \
    --query 'SecurityGroupRules[?!IsEgress].[FromPort, CidrIpv4 || CidrIpv6 || PrefixListId || ReferencedGroupInfo.GroupId]' \
    --output text | tr '\t' ':' | tr '\n' ' ')"
  local secret_version
  secret_version="$(aws_ ssm get-parameter --name "$PARAMETER" --query Parameter.Version --output text 2>/dev/null || echo none)"
  local matches=no current
  current="$(read_secret)"
  if [[ -n "$current" ]] && distribution_sends "$current"; then matches=yes; fi
  echo "load balancer:       ${lb_arn#*:loadbalancer/}"
  echo "security group:      $sg_id ingress: ${ingress:-none}"
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
  local secret
  secret="$(read_secret)"
  if [[ -z "$secret" ]]; then
    store_secret "$(new_secret)"
    secret="$(read_secret)"
  fi
  [[ "${#secret}" -ge 32 && "${#secret}" -le 128 ]] || die "secret length must be 32-128 characters"

  load_rule
  # 1. The load balancer accepts the current value (keeping any older value).
  local values=("$secret") v
  for v in "${rule_values[@]}"; do [[ "$v" == "$secret" ]] || values+=("$v"); done
  [[ "${#values[@]}" -le 5 ]] || die "the header rule would have more than 5 values"
  if [[ -z "$rule_arn" || "${#values[@]}" -ne "${#rule_values[@]}" ]]; then
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

  # 3. Drop older values, then require the header.
  if [[ "${#rule_values[@]}" -ne 1 ]]; then
    set_rule_values "$secret"
  fi
  if [[ "$default_action" != fixed-response ]]; then
    set_default_action block
    sleep 5
    if ! check_site; then
      set_default_action forward
      die "the site check failed with the header required; default action restored to forward"
    fi
  fi
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
    if aws_ ec2 authorize-security-group-ingress --group-id "$sg_id" --ip-permissions \
      "IpProtocol=tcp,FromPort=$port,ToPort=$port,IpRanges=[{CidrIp=0.0.0.0/0}]" \
      --query Return --output text >/dev/null 2>&1; then
      log "security group $sg_id: allowed $port from 0.0.0.0/0"
    else
      log "security group $sg_id: $port from 0.0.0.0/0 already allowed (or not permitted)"
    fi
  done
  log "direct traffic accepted; the header rule and the CloudFront header stay in place"
}

case "${1:-}" in
  status) cmd_status ;;
  apply) cmd_apply ;;
  rotate) cmd_rotate ;;
  unlock) cmd_unlock ;;
  *) sed -n '2,19p' "$0" >&2; exit 2 ;;
esac
