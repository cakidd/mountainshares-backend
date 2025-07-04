#!/usr/bin/env bash
set -euo pipefail

[[ -f package.json ]] || { echo "Run from repo root"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm not found"; exit 1; }
command -v vercel >/dev/null || { echo "Vercel CLI missing"; exit 1; }
command -v stripe >/dev/null || { echo "Stripe CLI missing"; exit 1; }

# 1 – make sure prod deps exist (drop -w which needs a workspace)
pnpm add express cors dotenv --save-exact --silent

# 2 – ensure handler exported
HANDLER='if (!process.env.VERCEL) { require("dotenv").config(); }
module.exports = async function handler(req, res) {
  res.status(200).json({ ok: true });
};'
FILE=api/index.js
grep -q "module.exports" "$FILE" || {
  printf '%s\n\n%s\n' "$HANDLER" "$(cat "$FILE")" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
}

# 3 – commit if anything changed
git add package.json pnpm-lock.yaml "$FILE" || true
git commit -m "auto: ensure deps + export for stripe webhook" --allow-empty > /dev/null 2>&1 || true

# 4 – build & deploy
vercel build --yes
URL=$(vercel deploy --prebuilt --yes | grep -Eo 'https://[^ ]+\.vercel\.app' | head -1)

echo "✅  Deployed to $URL"

# 5 – point Stripe test webhook to new URL
stripe webhook-endpoints update \
  "$(stripe webhook-endpoints list -r 1 --column=id | tail -1)" \
  --url "$URL/api/stripe-webhook"

# 6 – fire test event and tail logs
(vercel logs "$URL" & LOGPID=$!
 stripe trigger checkout.session.completed \
   --override checkout_session:metadata.customerWallet=$DEPLOY
 sleep 5
 kill $LOGPID )
