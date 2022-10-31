import { readFileSync } from 'node:fs';
import { join as joinPath, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

import type {
  ActivityEntity,
  ApiBindingEntity,
  ApplicationEntity,
  IframeImplementationSpec,
} from "../../../imports/entities/manifest";

export class AppBuilder {
  apiBinding(name: string, opts: {
    labels?: Record<string,string>;
    spec: ApiBindingEntity['spec'];
  }) {
    console.log('  '+JSON.stringify({
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'ApiBinding',
      metadata: {
        name,
        labels: opts.labels,
      },
      spec: opts.spec,
    })+',');
  }
  piecemealSourceFromFiles(dirname: string, filePrefix: string): IframeImplementationSpec['source'] {
    const subDir = relative(__dirname, dirname);
    const assetDir = joinPath('apps', 'src', subDir);

    const html = readFileSync(joinPath('private', assetDir, `${filePrefix}.html`), { encoding: 'utf-8' });
    const css = readFileSync(joinPath('private', assetDir, `${filePrefix}.css`), { encoding: 'utf-8' });
    // const js = readFileSync(joinPath('private', assetDir, `${filePrefix}.js`), { encoding: 'utf-8' });

    execFileSync("node_modules/.bin/swc", [
      `private/apps/src/market/${filePrefix}.js`,
      "-C", "module.type=es6",
      "-C", "jsc.target=es2018",
      "-s", "false", // inline makes meteor build unhappy
      "-d", `private/apps/swc`,
      // private/apps/swc/market/ui.js/apps/src/market/ui.js
    ], {
      stdio: [0, 2, 2],
    });
    const js = readFileSync(joinPath('private', 'apps', 'swc', assetDir, `${filePrefix}.js`), { encoding: 'utf-8' });

    return {
      type: 'piecemeal',
      htmlLang: 'en',
      metaCharset: 'utf-8',
      headTitle: 'dist.app instance',
      inlineScript: js,
      bodyHtml: html,
      inlineStyle: css,
    };
  }

  constructor() {
    console.log(`import type { Entity } from "/imports/entities";`);
    console.log(`export const AppCatalog: Entity[] = [`);
  }
  done() {
    console.log(`];`);
  }

  app(name: string, opts: {
    title: string;
    description?: string;
    tags?: string[];
    spec: ApplicationEntity['spec'],
  }) {
    console.log('  '+JSON.stringify({
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      metadata: {
        name: name,
        title: opts.title,
        description: opts.description,
        tags: opts.tags,
      },
      spec: opts.spec,
    })+',');
    return {
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: name,
    };
  }

  activity(name: string, opts: {
    title: string;
    appRef?: {};
    spec: ActivityEntity['spec'],
  }) {
    console.log('  '+JSON.stringify({
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Activity',
      metadata: {
        name: name,
        title: opts.title,
        ownerReferences: opts.appRef ? [opts.appRef] : [],
      },
      spec: opts.spec,
    })+',');
  }
}
