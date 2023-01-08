import { html } from "common-tags";
import { useVueState } from "../apps/_vue";
import { IframeImplementationSpec } from "../entities/manifest";
import { iframeEntrypointText } from "../userland/iframe-entrypoint-blob";

export function compileIframeSrc(implementation: IframeImplementationSpec): string {

  if (implementation.source.type == 'internet-url') {
    const parsed = new URL(implementation.source.url);
    if (parsed.protocol !== 'https:') throw new Error(`Only HTTPS allowed`);
    return implementation.source.url;
  }

  if (implementation.source.type == 'piecemeal') {
    const docHtml = [
      `<!doctype html>`,

      ...(implementation.source.htmlLang ? [
        html`<html lang="${implementation.source.htmlLang}">`,
      ] : []),
      ...(implementation.source.metaCharset ? [
        html`<meta charset="${implementation.source.metaCharset}" />`,
      ] : []),
      html`<title>${implementation.source.headTitle ?? 'Embedded dist.app'}</title>`,

      ...(implementation.source.inlineStyle ? [
        `  <style type="text/css">`,
        implementation.source.inlineStyle,
        `  </style>`,
      ] : []),

      ...(implementation.source.importMap ? [
        `<script type="importmap">`,
        JSON.stringify(implementation.source.importMap, null, 2),
        `</script>`,
      ] : []),

      ...(implementation.source.scriptUrls?.flatMap(url => [
        html`<script src="${url}"></script>`,
      ]) ?? []),
      `<script type="module">${iframeEntrypointText.replace('{ORIGIN}', JSON.stringify(location.origin).slice(1, -1))}</script>`,
      ...(implementation.source.inlineScript ? [
        `  <script type="module" defer>`,
        implementation.source.inlineScript
          .replace('\n"useVueState";\n', `\n${useVueState}\n`) // TODO: this sucks
          .replace(/^/gm, '    '),
        `  </script>`,
      ] : []),

      `<body>`,
      (implementation.source.bodyHtml ? [
        implementation.source.bodyHtml.replace(/^/gm, '  '),
      ] : []),
      `</body>`,

    ].join('\n');
    return docHtml;
  }

  throw new Error('Function not implemented.');
}
