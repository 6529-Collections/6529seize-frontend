#!/usr/bin/env bash

set -euo pipefail

for name in ARTIFACT_URL EXPECTED_DIGEST EXPECTED_SHA \
  PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64 REPO_DIR RUN_AS \
  SSR_CLIENT_ID_B64 SSR_CLIENT_SECRET_B64; do
  if [[ -z "${!name:-}" ]]; then
    echo "Required deployment value $name is missing." >&2
    exit 1
  fi
done

[[ "$ARTIFACT_URL" == https://* ]] || {
  echo "The staging artifact URL must use HTTPS." >&2
  exit 1
}
[[ "$EXPECTED_DIGEST" =~ ^[a-f0-9]{64}$ ]] || {
  echo "The staging artifact digest is malformed." >&2
  exit 1
}
[[ "$EXPECTED_SHA" =~ ^[a-f0-9]{40}$ ]] || {
  echo "The staging source SHA is malformed." >&2
  exit 1
}
[[ "$REPO_DIR" == /* && "$REPO_DIR" != / ]] || {
  echo "The staging repository directory is unsafe." >&2
  exit 1
}
id "$RUN_AS" >/dev/null 2>&1 || {
  echo "Run-as user '$RUN_AS' does not exist." >&2
  exit 1
}
[[ -d "$REPO_DIR/.git" ]] || {
  echo "Repo directory '$REPO_DIR' is not a git checkout." >&2
  exit 1
}

for command in base64 curl flock grep jq sha256sum sudo unzip; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Required staging command '$command' is unavailable." >&2
    exit 1
  }
done
sudo -H -u "$RUN_AS" pm2 --version >/dev/null 2>&1 || {
  echo "Required staging command 'pm2' is unavailable for $RUN_AS." >&2
  exit 1
}

ssr_client_id="$(printf '%s' "$SSR_CLIENT_ID_B64" | base64 -d)"
ssr_client_secret="$(printf '%s' "$SSR_CLIENT_SECRET_B64" | base64 -d)"
[[ -n "$ssr_client_id" && -n "$ssr_client_secret" ]] || {
  echo "Decoded staging SSR credentials must be non-empty." >&2
  exit 1
}

release_root="$REPO_DIR/.deploy"
if [[ -L "$release_root" ]]; then
  echo "Refusing to use a staging runtime symlink." >&2
  exit 1
elif [[ -e "$release_root" && ! -d "$release_root" ]]; then
  echo "Refusing to replace a non-directory staging runtime path." >&2
  exit 1
fi
install -d -o "$RUN_AS" -g "$RUN_AS" "$release_root"
touch "$release_root/deploy.lock"
chown "$RUN_AS:$RUN_AS" "$release_root/deploy.lock"
exec 9>"$release_root/deploy.lock"
flock -n 9 || {
  echo "Another instance-local staging deployment is active." >&2
  exit 1
}
physical_release_root="$(readlink -f "$release_root")"
release_id="$EXPECTED_SHA-$EXPECTED_DIGEST"
release_dir="$physical_release_root/releases/$release_id"
release_app="$release_dir/app"
current_link="$release_root/current"
runtime_secrets_file="$release_root/runtime-secrets.json"
if [[ -e "$current_link" && ! -L "$current_link" ]]; then
  echo "Refusing to replace a non-symlink staging current path." >&2
  exit 1
fi
install -d -o "$RUN_AS" -g "$RUN_AS" "$physical_release_root/releases"

previous_target=""
if [[ -L "$current_link" ]]; then
  previous_target="$(readlink -f "$current_link" 2>/dev/null || true)"
  previous_release_id="${previous_target%/app}"
  previous_release_id="${previous_release_id##*/}"
  [[ "$previous_release_id" =~ ^[a-f0-9]{40}(-[a-f0-9]{64})?$ && \
    "$previous_target" == "$physical_release_root/releases/$previous_release_id/app" && \
    -f "$previous_target/server.js" ]] || {
    echo "Refusing to deploy with an unrecognized staging current release." >&2
    exit 1
  }
fi
pm2_json="$(sudo -H -u "$RUN_AS" pm2 jlist)"
process_count="$(jq '[.[] | select(.name == "6529seize")] | length' <<<"$pm2_json")"
process_kind=""
if [[ "$process_count" -eq 0 ]]; then
  process_kind="absent"
elif [[ "$process_count" -eq 1 ]]; then
  process_shape="$(jq -c '[.[] | select(.name == "6529seize")][0] | {
    exec_mode: .pm2_env.exec_mode,
    pm_exec_path: .pm2_env.pm_exec_path,
    pm_cwd: .pm2_env.pm_cwd,
    args: .pm2_env.args
  }' <<<"$pm2_json")"
  if jq -e --arg repo_dir "$REPO_DIR" '
    .exec_mode == "fork_mode" and
    (.pm_exec_path == "/usr/bin/bash" or .pm_exec_path == "/bin/bash") and
    .pm_cwd == $repo_dir and
    .args == ["-lc", ("cd \"" + $repo_dir + "\" && ./bin/6529 run start:standalone")]
  ' <<<"$process_shape" >/dev/null; then
    process_kind="legacy"
  elif [[ -n "$previous_target" ]] && jq -e \
    --arg release_root "$release_root" \
    --arg physical_release_root "$physical_release_root" \
    --arg previous_target "$previous_target" '
    .exec_mode == "cluster_mode" and
    (.args == null or .args == []) and
    (.pm_cwd == ($release_root + "/current") or
      .pm_cwd == ($physical_release_root + "/current") or
      .pm_cwd == $previous_target) and
    (.pm_exec_path == ($release_root + "/current/server.js") or
      .pm_exec_path == ($physical_release_root + "/current/server.js") or
      .pm_exec_path == ($previous_target + "/server.js"))
  ' <<<"$process_shape" >/dev/null; then
    process_kind="managed"
  else
    echo "Refusing to replace an unrecognized 6529seize PM2 process." >&2
    exit 1
  fi
else
  echo "Refusing to deploy with duplicate 6529seize PM2 processes." >&2
  exit 1
fi

restore_previous_link() {
  if [[ -n "$previous_target" ]]; then
    ln -sfn "$previous_target" "$current_link"
  else
    rm -f "$current_link"
  fi
}

read_local_version() {
  local response
  response="$(curl --fail --silent --show-error --max-time 10 \
    http://127.0.0.1:3001/api/version 2>/dev/null || true)"
  jq -r '
    select(.stale == false) |
    .version | select(type == "string" and test("^[a-f0-9]{40}$"))
  ' <<<"$response" 2>/dev/null || true
}

wait_for_local_version() {
  local target_version="$1"
  local actual_version
  for _attempt in {1..24}; do
    actual_version="$(read_local_version)"
    if [[ "$actual_version" == "$target_version" ]]; then
      return 0
    fi
    sleep 5
  done
  return 1
}

delete_6529_process() {
  local remaining_count
  sudo -H -u "$RUN_AS" pm2 delete 6529seize >/dev/null 2>&1 || true
  remaining_count="$(sudo -H -u "$RUN_AS" pm2 jlist | \
    jq '[.[] | select(.name == "6529seize")] | length')"
  [[ "$remaining_count" -eq 0 ]]
}

previous_local_version=""
if [[ "$process_kind" != absent ]]; then
  previous_local_version="$(read_local_version)"
  [[ "$previous_local_version" =~ ^[a-f0-9]{40}$ ]] || {
    echo "Refusing to deploy without an exact healthy pre-mutation local version." >&2
    exit 1
  }
fi

if [[ "$process_kind" == managed && \
  "$previous_target" == "$release_app" && \
  "$previous_local_version" == "$EXPECTED_SHA" ]] && \
  grep -qxF "package_sha256=$EXPECTED_DIGEST" \
    "$release_dir/artifact.env" 2>/dev/null; then
  echo "Exact staging artifact $release_id is already healthy; deployment is idempotent."
  exit 0
fi
if [[ "$previous_target" == "$release_app" ]]; then
  echo "Refusing to replace the active staging release after its identity check failed." >&2
  exit 1
fi

prune_release_cache() {
  local current_release=""
  local retained_rollback=0
  local cached_release cached_release_id
  if [[ -n "$previous_target" ]]; then
    current_release="${previous_target%/app}"
  fi
  if [[ "$process_kind" == managed && -z "$current_release" ]]; then
    echo "Refusing to prune without the exact managed current release." >&2
    return 1
  fi
  while IFS= read -r cached_release; do
    [[ -n "$cached_release" ]] || continue
    if [[ "$cached_release" == "$release_dir" || \
      "$cached_release" == "$current_release" ]]; then
      continue
    fi
    if [[ "$retained_rollback" -eq 0 ]]; then
      retained_rollback=1
      continue
    fi
    cached_release_id="${cached_release##*/}"
    if [[ ! "$cached_release_id" =~ ^[a-f0-9]{40}(-[a-f0-9]{64})?$ || \
      "$cached_release" != "$physical_release_root/releases/$cached_release_id" ]]; then
      echo "Preserving unrecognized staging release cache entry $cached_release_id"
      continue
    fi
    rm -rf -- "$cached_release"
    echo "Pruned rebuildable staging release cache $cached_release_id"
  done < <(
    find "$physical_release_root/releases" -mindepth 1 -maxdepth 1 \
      -type d -printf '%T@ %p\n' 2>/dev/null | sort -nr | cut -d' ' -f2-
  )
}

restore_legacy_process() {
  delete_6529_process || return 1
  restore_previous_link || return 1
  sudo -H -u "$RUN_AS" pm2 start bash --name=6529seize -- \
    -lc "cd \"$REPO_DIR\" && ./bin/6529 run start:standalone" || return 1
  wait_for_local_version "$previous_local_version" || return 1
  sudo -H -u "$RUN_AS" pm2 save || return 1
}

rollback_managed_process() {
  restore_previous_link || return 1
  sudo -H -u "$RUN_AS" pm2 startOrReload \
    "$release_root/ecosystem.config.cjs" \
    --only 6529seize --update-env || return 1
  wait_for_local_version "$previous_local_version" || return 1
  sudo -H -u "$RUN_AS" pm2 save || return 1
}

rollback_absent_process() {
  delete_6529_process || return 1
  restore_previous_link || return 1
  sudo -H -u "$RUN_AS" pm2 save || return 1
}

rollback_process() {
  case "$process_kind" in
    legacy) restore_legacy_process ;;
    managed) rollback_managed_process ;;
    absent) rollback_absent_process ;;
    *) return 1 ;;
  esac
}

prune_release_cache

install -d -o "$RUN_AS" -g "$RUN_AS" "$release_dir"
artifact_tmp="$(mktemp "$release_dir/package.XXXXXX.zip")"
staging_app=""
destinations_file=""
retain_destinations_file=false
runtime_secrets_tmp=""
cleanup() {
  unset review_destinations PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64 \
    ssr_client_id SSR_CLIENT_ID_B64 ssr_client_secret SSR_CLIENT_SECRET_B64
  rm -f "$artifact_tmp"
  if [[ -n "$staging_app" && -d "$staging_app" ]]; then
    rm -rf -- "$staging_app"
  fi
  if [[ "$retain_destinations_file" != true && -n "$destinations_file" ]]; then
    rm -f -- "$destinations_file"
  fi
  if [[ -n "$runtime_secrets_tmp" ]]; then
    rm -f -- "$runtime_secrets_tmp"
  fi
}
trap cleanup EXIT HUP INT TERM
http_status="$(curl --silent --show-error --proto '=https' \
  --connect-timeout 30 \
  --max-time 900 \
  --output "$artifact_tmp" \
  --write-out '%{http_code}' \
  "$ARTIFACT_URL")"
[[ "$http_status" == 200 ]]
echo "$EXPECTED_DIGEST  $artifact_tmp" | sha256sum -c -
staging_app="$(mktemp -d "$release_dir/app.XXXXXX")"
unzip -q "$artifact_tmp" -d "$staging_app"
[[ -f "$staging_app/server.js" ]]
chown -R "$RUN_AS:$RUN_AS" "$staging_app"
rm -rf -- "$release_app"
mv "$staging_app" "$release_app"
staging_app=""
rm -f "$artifact_tmp"
printf 'source_sha=%s\npackage_sha256=%s\n' \
  "$EXPECTED_SHA" "$EXPECTED_DIGEST" > "$release_dir/artifact.env"
chown -R "$RUN_AS:$RUN_AS" "$release_dir"

review_destinations="$(
  printf '%s' "$PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64" | base64 -d
)"
jq -e '
  type == "object" and
  has("staging") and
  (.staging | type == "object") and
  (.staging["stream-review"] | type == "string" and test("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")) and
  (has("production") | not)
' <<<"$review_destinations" >/dev/null
destinations_file="$release_dir/public-review-discussion-destinations.json"
install -m 600 -o "$RUN_AS" -g "$RUN_AS" /dev/null "$destinations_file"
printf '%s\n' "$review_destinations" \
  > "$destinations_file"
chown "$RUN_AS:$RUN_AS" "$destinations_file"
unset review_destinations PUBLIC_REVIEW_DISCUSSION_DESTINATIONS_B64
retain_destinations_file=true

runtime_secrets_tmp="$(mktemp "$release_root/runtime-secrets.XXXXXX.json")"
jq -n \
  --arg ssr_client_id "$ssr_client_id" \
  --arg ssr_client_secret "$ssr_client_secret" \
  '{SSR_CLIENT_ID:$ssr_client_id,SSR_CLIENT_SECRET:$ssr_client_secret}' \
  > "$runtime_secrets_tmp"
chown "$RUN_AS:$RUN_AS" "$runtime_secrets_tmp"
chmod 600 "$runtime_secrets_tmp"
mv -f "$runtime_secrets_tmp" "$runtime_secrets_file"
runtime_secrets_tmp=""
unset ssr_client_id SSR_CLIENT_ID_B64 ssr_client_secret SSR_CLIENT_SECRET_B64

ln -sfn "$release_app" "$current_link"
cat > "$release_root/ecosystem.config.cjs" <<'PM2_CONFIG'
const fs = require('node:fs');
const path = require('node:path');

const currentApp = fs.realpathSync(path.join(__dirname, 'current'));
const runtimeSecretsPath = path.join(__dirname, 'runtime-secrets.json');
const runtimeEnv = JSON.parse(fs.readFileSync(runtimeSecretsPath, 'utf8'));
const requireRuntimeEnv = (name) => {
  const value = runtimeEnv[name];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      `Required staging runtime value ${name} is missing from ${runtimeSecretsPath}.`
    );
  }
  return value;
};
const destinationsPath = path.join(
  path.dirname(currentApp),
  'public-review-discussion-destinations.json'
);
let publicReviewDiscussionDestinations;
try {
  publicReviewDiscussionDestinations = fs.readFileSync(
    destinationsPath,
    'utf8'
  ).trim();
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error;
  }
}

module.exports = {
  apps: [{
    name: '6529seize',
    script: 'server.js',
    cwd: __dirname + '/current',
    exec_mode: 'cluster',
    instances: 1,
    env: {
      PORT: '3001',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      ['SSR_CLIENT_ID']: requireRuntimeEnv('SSR_CLIENT_ID'),
      ['SSR_CLIENT_SECRET']: requireRuntimeEnv('SSR_CLIENT_SECRET'),
      ...(publicReviewDiscussionDestinations
        ? {
            PUBLIC_REVIEW_DISCUSSION_DESTINATIONS:
              publicReviewDiscussionDestinations
          }
        : {})
    }
  }]
};
PM2_CONFIG
chown "$RUN_AS:$RUN_AS" "$release_root/ecosystem.config.cjs"

if [[ "$process_kind" == legacy ]]; then
  if ! delete_6529_process; then
    echo "Refusing to migrate because the legacy process could not be removed." >&2
    exit 1
  fi
  if ! sudo -H -u "$RUN_AS" pm2 start \
    "$release_root/ecosystem.config.cjs" --only 6529seize; then
    if ! restore_legacy_process; then
      echo "CRITICAL: staging migration and legacy rollback both failed." >&2
      exit 2
    fi
    echo "Staging migration failed; the known legacy process was restored." >&2
    exit 1
  fi
else
  if ! sudo -H -u "$RUN_AS" pm2 startOrReload \
    "$release_root/ecosystem.config.cjs" --only 6529seize --update-env; then
    if ! rollback_process; then
      echo "CRITICAL: staging deploy and rollback both failed." >&2
      exit 2
    fi
    echo "Staging deploy failed; the prior process state was restored." >&2
    exit 1
  fi
fi

if ! wait_for_local_version "$EXPECTED_SHA"; then
  if ! rollback_process; then
    echo "CRITICAL: exact-version check and rollback both failed." >&2
    exit 2
  fi
  echo "Instance-local exact-version verification failed; the prior process state was restored." >&2
  exit 1
fi

if ! sudo -H -u "$RUN_AS" pm2 save; then
  if ! rollback_process; then
    echo "CRITICAL: PM2 persistence and rollback both failed." >&2
    exit 2
  fi
  echo "PM2 persistence failed; the prior process state was restored." >&2
  exit 1
fi
