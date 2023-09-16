import { WebApp } from "meteor/webapp";
import { settings } from "/imports/settings";

WebApp.connectHandlers.use('/manifest.webmanifest', (_req, res, _next) => {
  res.setHeader('content-type', 'application/manifest+json');
  res.write(JSON.stringify({

    "short_name": settings.pwa?.shortName ?? "dist.app",
    "name": settings.pwa?.fullName ?? "dist.app shell (v1alpha1)",

    "start_url": "/",
    "display": "standalone",

    "icons": [
      {
        "src": "/network-icon-128.png",
        "type": "image/png",
        "sizes": "128x128",
      },
      {
        "src": "/network-icon-512.png",
        "type": "image/png",
        "sizes": "512x512",
      },
    ],

    "share_target": settings.pwa?.shareTarget?.enabled ? {
      "method": "GET",
      "action": "/share-target",
      "params": {
        "title": "title",
        "text": "text",
        "url": "url",
      },
    } : undefined,

  }, null, 2));
  res.end();
});
