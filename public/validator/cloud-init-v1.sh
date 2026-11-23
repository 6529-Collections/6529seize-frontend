#!/bin/bash
# 6529 Validator: first-start setup for a cloud server running Ubuntu.
# Tested on Ubuntu 22.04 (amd64) and 24.04 (arm64) at AWS.
# It runs once, as root. Its output goes to /var/log/cloud-init-output.log.
# To run it again: delete /root/.6529-validator-setup-done, then run
# sudo bash /root/6529-setup.sh
set -euo pipefail
if [ -e /root/.6529-validator-setup-done ]; then
    echo "6529 validator: already set up. To run it again, delete /root/.6529-validator-setup-done first."
    exit 0
fi
export DEBIAN_FRONTEND=noninteractive
fail() { echo "6529 validator: $*" >&2; exit 1; }
if ! command -v dpkg >/dev/null || ! command -v apt-get >/dev/null; then
    fail "this script is for Ubuntu or Debian. Nothing was installed."
fi
command -v python3 >/dev/null || fail "this script needs python3. Nothing was installed."
# A 2 GB swap file: catching up after a long time off can briefly need more
# than 4 GB of memory, and swap makes that slow instead of stopping it.
# It needs room: below 4 GB free on the disk, there's no swap file.
if [ -z "$(swapon --show --noheadings)" ] && [ ! -e /swapfile ]; then
    FREE_KB=$(df -Pk / | awk 'NR == 2 {print $4}') || FREE_KB=0
    if [ "${FREE_KB:-0}" -lt 4194304 ]; then
        echo "6529 validator: less than 4 GB free on the disk, so no swap file."
    elif fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    else
        rm -f /swapfile
        echo "6529 validator: no swap file, going on without one."
    fi
fi
ARCH=$(dpkg --print-architecture)   # amd64 or arm64
mkdir -p /var/cache/6529-validator-setup
chmod 755 /var/cache/6529-validator-setup
cd /var/cache/6529-validator-setup
# HTTPS only, with retries: 6529.io can ask to try again in a minute.
CURL=(curl -fsSL --proto '=https' --proto-redir '=https' --retry 5 --retry-delay 10 --retry-connrefused)
# The newest release in 6529's list of releases, and its .deb for this machine.
"${CURL[@]}" -o releases.json https://6529.io/validator/releases.json \
    || fail "couldn't download the list of releases. Nothing was installed."
SELECTED=$(python3 - "$ARCH" <<'PY'
import json, re, sys
arch = sys.argv[1]
def stop(why):
    sys.exit("6529 validator: " + why + " Nothing was installed.")
# The package's own name: 6529-validator_<its version>_<arch>.deb.
package = re.compile(r"6529-validator_[0-9][0-9A-Za-z.~+-]*_" + re.escape(arch) + r"\.deb")
try:
    feed = json.load(open("releases.json"))
    release = feed["releases"][0]
    version = str(release["version"])
    unsafe = [str(entry.get("version")) for entry in feed.get("unsafe_versions") or []]
    debs = [(f["name"], f["sha256"]) for f in release["files"]
            if package.fullmatch(str(f["name"]))]
except Exception:
    stop("couldn't read the list of releases.")
if version in unsafe:
    stop("the newest release, " + version + ", is marked unsafe.")
if not debs:
    stop("the newest release, " + version + ", has no .deb for this machine (" + arch + ").")
name, sha256 = debs[0]
if not (re.fullmatch(r"[A-Za-z0-9._+-]+", version)
        and re.fullmatch(r"[0-9a-f]{64}", str(sha256))):
    stop("the list of releases has an entry this script can't use.")
print(version, name, sha256)
PY
)
read -r VERSION FILE SUM <<< "$SELECTED"
TYPE=$("${CURL[@]}" -w '%{content_type}' -o "$FILE" "https://6529.io/validator/download/$VERSION/$FILE") \
    || fail "couldn't download $FILE. Nothing was installed."
# With its password gate on, 6529.io answers with its password page.
case $TYPE in
    text/html*) fail "6529.io asks for a password before it hands out $FILE. Nothing was installed." ;;
esac
echo "$SUM  $FILE" | sha256sum -c - \
    || fail "$FILE doesn't match its SHA-256 in the list of releases. Nothing was installed."
# apt-get update doesn't wait while another apt holds its lists, as on a
# server's first minutes: up to 6 tries, 20 seconds apart.
TRIES=1
until apt-get -o DPkg::Lock::Timeout=600 -o Acquire::Retries=3 update; do
    [ "$TRIES" -lt 6 ] || fail "apt-get update failed 6 times. Nothing was installed."
    TRIES=$((TRIES + 1))
    sleep 20
done
apt-get -o DPkg::Lock::Timeout=600 -o Acquire::Retries=3 install -y "./$FILE" \
    || fail "apt-get couldn't install $FILE."
# Data-center mode, with the page at 127.0.0.1:6530 on this server.
cd /
runuser -u validator6529 -- validator init --data-dir /var/lib/6529-validator \
    --mode datacenter --ui-bind 127.0.0.1:6530 --force \
    || fail "the validator is installed, but setting up data-center mode failed."
systemctl restart 6529-validator \
    || fail "the validator is set up, but it didn't restart: run sudo systemctl restart 6529-validator"
touch /root/.6529-validator-setup-done
echo "6529 validator $VERSION installed in data-center mode."
