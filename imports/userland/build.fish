#!/usr/bin/env fish
set inFile "imports/userland/iframe-entrypoint.ts"
set outFile (mktemp)
set destFile "imports/userland/iframe-entrypoint-blob.ts"

echo "Compiling" $inFile "..."
./node_modules/typescript/bin/tsc \
    $inFile \
    --target es2020 \
    --outFile $outFile

begin
  echo -n "export const iframeEntrypoint = atob('"
  cat $outFile \
    | base64 -w 0 \
    | tr -d '\n'
  echo "');"
end > $destFile
wc -c $destFile

rm $outFile
