#!/usr/bin/env fish
set inFile "imports/userland/iframe-entrypoint.ts"
set outFile (mktemp)
set destFile "imports/userland/iframe-entrypoint-blob.ts"

echo "Compiling" $inFile "..."
node_modules/.bin/swc \
  $inFile \
  -C jsc.target=es2020 \
  -C module.type=es6 \
  -C minify=true \
  -o $outFile
# ./node_modules/typescript/bin/tsc \
#     $inFile \
#     --target es2020 \
#     --skipLibCheck \
#     --outFile $outFile

begin
  echo "import { Meteor } from 'meteor/meteor';"
  echo "export const iframeEntrypointText = atob(`"
  grep -v sourceMappingURL $outFile | base64 -w 100
  echo "`);"
  echo "export const iframeEntrypointBlob = new Blob(["
  echo "  iframeEntrypointText.replace('{ORIGIN}', new URL(Meteor.absoluteUrl()).origin),"
  echo "], {type: 'text/javascript'});"
  echo "export const iframeEntrypointUrl = URL.createObjectURL(iframeEntrypointBlob);"
end > $destFile
wc -c $destFile

rm $outFile
