#!/usr/bin/bash -eux

#./node_modules/.bin/tsc private/apps/src/market/build.ts --outDir private/apps/build

meteor node node_modules/.bin/tsc \
  -p private/apps/tsconfig.json \
  --outDir private/apps/build

meteor node \
  private/apps/build/private/apps/src/market/build.js \
| tee imports/apps/market.ts \
| cut -c-${COLUMNS:-80}

echo 'Recompiled apps.'
