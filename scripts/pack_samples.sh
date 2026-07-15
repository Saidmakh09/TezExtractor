#!/usr/bin/env bash
# Packs samples/ into an encrypted blob (samples.enc) that is safe to commit,
# and stores the freshly generated key as the SAMPLES_KEY GitHub Actions
# secret. CI decrypts the blob at run time; the plaintext documents never
# enter the repository. Rerun after changing samples/ (a new key is generated
# and the secret updated every run; nothing sensitive is printed or stored).
set -euo pipefail
cd "$(dirname "$0")/.."

KEY=$(openssl rand -hex 32)
tar czf - samples | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -pass "pass:$KEY" -out samples.enc
gh secret set SAMPLES_KEY --body "$KEY"

echo "samples.enc written ($(du -h samples.enc | cut -f1)) and the SAMPLES_KEY secret was updated."
echo "Commit samples.enc to ship the sample set to CI."
