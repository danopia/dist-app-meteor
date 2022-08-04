import { Meteor } from 'meteor/meteor';
import { EntitiesCollection, Entity } from '/imports/db/entities';

async function upsertEntity(entity: Entity) {
  const _id = `${entity.kind}.${entity.apiVersion}:${entity.metadata.namespace ?? ''}/${entity.metadata.name}`;
  EntitiesCollection.upsert({
    _id,
  }, {
    _id,
    ...entity,
  });
}

Meteor.startup(async () => {
  await upsertEntity({
    apiVersion: 'core/v1',
    kind: 'Namespace',
    metadata: {
      name: 'hello-world',
      tags: ['application'],
    },
  });
  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Activity',
    metadata: {
      name: 'main',
      namespace: 'hello-world',
      description: 'Shows an example webpage in a frame.',
    },
    spec: {
      type: 'frame',
      urlPatterns: [
        `web+dist://hello-world`,
      ],
      frame: {
        sourceUrl: `https://example.com`,
        messaging: 'none',
      },
    },
  });

  await upsertEntity({
    apiVersion: 'core/v1',
    kind: 'Namespace',
    metadata: {
      name: 'wikipedia-en',
      tags: ['application'],
    },
  });
  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Activity',
    metadata: {
      name: 'main',
      namespace: 'wikipedia-en',
      description: 'Embeds wikipedia.',
    },
    spec: {
      type: 'frame',
      urlPatterns: [
        `web+dist://hello-world`,
      ],
      frame: {
        sourceUrl: `https://en.wikipedia.org/wiki/Main_Page`,
        messaging: 'none',
      },
    },
  });

  await upsertEntity({
    apiVersion: 'core/v1',
    kind: 'Namespace',
    metadata: {
      name: 'deno-visualizer',
      tags: ['application'],
    },
  });
  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Activity',
    metadata: {
      name: 'main',
      namespace: 'deno-visualizer',
      description: 'Embeds wikipedia.',
    },
    spec: {
      type: 'frame',
      urlPatterns: [
        `web+dist://hello-world`,
      ],
      frame: {
        sourceUrl: `https://deno-visualizer.danopia.net/`,
        messaging: 'none',
      },
    },
  });

  await upsertEntity({
    apiVersion: 'core/v1',
    kind: 'Namespace',
    metadata: {
      name: 'toolbelt',
      tags: ['application'],
    },
  });
  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Activity',
    metadata: {
      name: 'main',
      namespace: 'toolbelt',
      description: 'Embeds wikipedia.',
    },
    spec: {
      type: 'frame',
      urlPatterns: [
        `web+dist://hello-world`,
      ],
      frame: {
        sourceUrl: `https://devmode.cloud/toolbelt/`,
        messaging: 'none',
      },
    },
  });

  await upsertEntity({
    apiVersion: 'core/v1',
    kind: 'Namespace',
    metadata: {
      name: 'xkcd',
      tags: ['application'],
    },
  });
  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Activity',
    metadata: {
      name: 'latest',
      namespace: 'xkcd',
      description: 'Shows the latest XKCD comic.',
    },
    spec: {
      type: 'frame',
      urlPatterns: [],
      frame: {
        sourceUrl: `data:text/html;base64,`+Buffer.from(`
        <h1>hi</h1>`).toString('base64'),
        messaging: 'none',
      },
    },
  });
  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Endpoint',
    metadata: {
      name: 'api',
      namespace: 'xkcd',
      description: 'Shows the latest XKCD comic.',
    },
    spec: {
      type: 'fetch',
      target: {
        type: 'endpoint',
        endpointChoices: [{
          name: 'XKCD',
          url: 'https://xkcd.com',
        }],
      },
      allowedUrlPatterns: [
        '/info.0.json',
        '/:number/info.0.json',
      ],
      allowedRequestHeaders: [
        'accept',
      ],
    },
  })

  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Activity',
    metadata: {
      name: 'jwt',
      namespace: 'toolbelt',
      description: 'JWT decode tool.',
    },
    spec: {
      type: 'frame',
      urlPatterns: [],
      frame: {
        sourceUrl: `data:text/html;base64,CjwhZG9jdHlwZSBodG1sPgoKPHRpdGxlPmp3dCB0b29sPC90aXRsZT4KCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+CiAgYm9keSB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzOwogICAgY29sb3I6ICNmZmY7CiAgICBtYXJnaW46IDA7CiAgICBkaXNwbGF5OiBmbGV4OwogICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICAgIGhlaWdodDogMTAwdmg7CiAgICBwYWRkaW5nOiAyZW07CiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94OwogICAgbWluLXdpZHRoOiA0MGVtOwogICAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTsKICB9CiAgaDEgewogICAgbWFyZ2luOiAwLjNlbSAxZW07CiAgICBjb2xvcjogIzk5OTsKICB9CiAgZm9ybSB7CiAgICBkaXNwbGF5OiBncmlkOwogICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgOGVtIDFmcjsKICAgIGdyaWQtZ2FwOiAxZW07CiAgICBncmlkLXRlbXBsYXRlLXJvd3M6IDhlbSAxZnI7CgogICAgbWFyZ2luOiAxZW07CiAgICBmbGV4OiAxOwogIH0KICB0ZXh0YXJlYSB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMTExOwogICAgY29sb3I6ICNmZmY7CiAgICBwYWRkaW5nOiAwLjJlbSAwLjVlbTsKICB9CiAgdGV4dGFyZWEubGVmdCB7CiAgICBncmlkLWNvbHVtbjogMTsKICAgIGdyaWQtcm93OiBzcGFuIDI7CiAgfQogIHRleHRhcmVhLnJpZ2h0IHsKICAgIGdyaWQtY29sdW1uOiAzOwogIH0KICBidXR0b24gewogICAgZ3JpZC1jb2x1bW46IDI7CiAgICBncmlkLXJvdzogc3BhbiAyOwogICAgYmFja2dyb3VuZC1jb2xvcjogIzU1NTsKICAgIGZvbnQtZmFtaWx5OiBpbmhlcml0OwogICAgY29sb3I6ICNmZmY7CiAgfQo8L3N0eWxlPgoKPGgxPiYjMTI4MTA0OyYjODIwNTsmIzEyODE4Nzsgand0IGluc3BlY3RvciB0b29sPC9oMT4KCjxmb3JtIGlkPSJkZWNvZGUiPgogIDx0ZXh0YXJlYSBjbGFzcz0ibGVmdCIgbmFtZT0idG9rZW4iIHBsYWNlaG9sZGVyPSJqd3QgYm9keSI+PC90ZXh0YXJlYT4KICA8YnV0dG9uIHR5cGU9InN1Ym1pdCI+SW5zcGVjdCE8L2J1dHRvbj4KICA8dGV4dGFyZWEgY2xhc3M9InJpZ2h0IiBuYW1lPSJoZWFkZXIiIHBsYWNlaG9sZGVyPSJoZWFkZXIgZGF0YSI+PC90ZXh0YXJlYT4KICA8dGV4dGFyZWEgY2xhc3M9InJpZ2h0IiBuYW1lPSJib2R5IiBwbGFjZWhvbGRlcj0iYm9keSBkYXRhIj48L3RleHRhcmVhPgo8L2Zvcm0+Cgo8c2NyaXB0IHR5cGU9InRleHQvamF2YXNjcmlwdCI+CiAgY29uc3Qgand0Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW25hbWU9dG9rZW5dJyk7CiAgY29uc3QgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTsKCiAgZnVuY3Rpb24gZGVjb2RlSldUKGp3dCkgewogICAgY29uc3QgcGFydHMgPSBqd3Quc3BsaXQoJy4nKTsKICAgIGlmIChwYXJ0cy5sZW5ndGggIT0gMykgewogICAgICBhbGVydCgndGhhdHMgbm8gand0IScpOwogICAgICByZXR1cm47CiAgICB9CgogICAgY29uc3QgaGVhZGVyID0gSlNPTi5wYXJzZShhdG9iKHBhcnRzWzBdKSk7CiAgICBjb25zdCBib2R5ID0gSlNPTi5wYXJzZShhdG9iKHBhcnRzWzFdKSk7CiAgICBjb25zb2xlLmxvZyhoZWFkZXIsIGJvZHkpOwogICAgLy9ldnQudGFyZ2V0LmRlY29kZWQudmFsdWUgPSBkZWNvZGVkOwoKICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tuYW1lPWhlYWRlcl0nKS52YWx1ZSA9IEpTT04uc3RyaW5naWZ5KGhlYWRlciwgbnVsbCwgMik7CiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbmFtZT1ib2R5XScpLnZhbHVlID0gSlNPTi5zdHJpbmdpZnkoYm9keSwgbnVsbCwgMik7CiAgfQoKICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2dCA9PiB7CiAgICBldnQucHJldmVudERlZmF1bHQoKTsKICAgIHRyeSB7CiAgICAgIGRlY29kZUpXVChqd3RCb3gudmFsdWUpOwogICAgfSBjYXRjaCAoZXJyKSB7CiAgICAgIGFsZXJ0KGVycik7CiAgICB9CiAgfSk7CgogIGp3dEJveC5mb2N1cygpOwogIGp3dEJveC5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIGV2dCA9PiB7CiAgICB0cnkgewogICAgICBqd3RCb3gudmFsdWUgPSAnJzsKICAgICAgZGVjb2RlSldUKGV2dC5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQnKSk7CiAgICB9IGNhdGNoIChlcnIpIHsKICAgICAgYWxlcnQoZXJyKTsKICAgIH0KICB9KTsKCjwvc2NyaXB0Pg==`,
        messaging: 'none',
      },
    },
  });

  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Activity',
    metadata: {
      name: 'base64',
      namespace: 'toolbelt',
      description: 'Base64 encode/decode tool.',
    },
    spec: {
      type: 'frame',
      urlPatterns: [],
      frame: {
        sourceUrl: `data:text/html;base64,CjwhZG9jdHlwZSBodG1sPgoKPHRpdGxlPmJhc2U2NCB0b29sPC90aXRsZT4KCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+CiAgYm9keSB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzOwogICAgY29sb3I6ICNmZmY7CiAgICBtYXJnaW46IDA7CiAgICBkaXNwbGF5OiBmbGV4OwogICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICAgIGhlaWdodDogMTAwdmg7CiAgICBwYWRkaW5nOiAyZW07CiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94OwogICAgbWluLXdpZHRoOiA0MGVtOwogICAgZm9udC1mYW1pbHk6IG1vbm9zcGFjZTsKICB9CiAgaDEgewogICAgbWFyZ2luOiAwLjNlbSAxZW07CiAgICBjb2xvcjogIzk5OTsKICB9CiAgZm9ybSB7CiAgICBkaXNwbGF5OiBncmlkOwogICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgOGVtIDFmcjsKICAgIGdyaWQtZ2FwOiAxZW07CiAgICBncmlkLWF1dG8tcm93czogbWlubWF4KDNlbSwgYXV0byk7CgogICAgbWFyZ2luOiAxZW07CiAgICBmbGV4OiAxOwogIH0KICB0ZXh0YXJlYSB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMTExOwogICAgY29sb3I6ICNmZmY7CiAgICBwYWRkaW5nOiAwLjJlbSAwLjVlbTsKICB9CiAgdGV4dGFyZWEubGVmdCB7CiAgICBncmlkLWNvbHVtbjogMTsKICAgIGdyaWQtcm93OiBzcGFuIDI7CiAgfQogIHRleHRhcmVhLnJpZ2h0IHsKICAgIGdyaWQtY29sdW1uOiAzOwogIH0KICBidXR0b24gewogICAgZ3JpZC1jb2x1bW46IDI7CiAgICBncmlkLXJvdzogc3BhbiAyOwogICAgYmFja2dyb3VuZC1jb2xvcjogIzU1NTsKICAgIGZvbnQtZmFtaWx5OiBpbmhlcml0OwogICAgY29sb3I6ICNmZmY7CiAgfQo8L3N0eWxlPgoKPGgxPiYjMTI4MTA0OyYjODIwNTsmIzEyODE4NzsgYmFzZTY0IGVuY29kZS9kZWNvZGUgdG9vbDwvaDE+Cgo8Zm9ybSBpZD0iZGVjb2RlIj4KICA8dGV4dGFyZWEgY2xhc3M9ImxlZnQiIG5hbWU9ImVuY29kZWQiIHBsYWNlaG9sZGVyPSJiYXNlNjQgZW5jb2RlZCI+PC90ZXh0YXJlYT4KICA8YnV0dG9uIHR5cGU9InN1Ym1pdCI+RGVjb2RlITwvYnV0dG9uPgogIDx0ZXh0YXJlYSBjbGFzcz0icmlnaHQiIG5hbWU9ImRlY29kZWQiIHBsYWNlaG9sZGVyPSJkZWNvZGVkIj48L3RleHRhcmVhPgogIDx0ZXh0YXJlYSBjbGFzcz0icmlnaHQiIG5hbWU9ImJ5dGVzIiBwbGFjZWhvbGRlcj0iaGV4IGJ5dGVzIj48L3RleHRhcmVhPgo8L2Zvcm0+Cgo8Zm9ybSBpZD0iZW5jb2RlIj4KICA8dGV4dGFyZWEgY2xhc3M9ImxlZnQiIG5hbWU9ImRlY29kZWQiIHBsYWNlaG9sZGVyPSJwbGFpbiB0ZXh0Ij48L3RleHRhcmVhPgogIDxidXR0b24gdHlwZT0ic3VibWl0Ij5FbmNvZGUhPC9idXR0b24+CiAgPHRleHRhcmVhIGNsYXNzPSJyaWdodCIgbmFtZT0iZW5jb2RlZCIgcGxhY2Vob2xkZXI9ImVuY29kZWQiPjwvdGV4dGFyZWE+CiAgPHRleHRhcmVhIGNsYXNzPSJyaWdodCIgbmFtZT0iYnl0ZXMiIHBsYWNlaG9sZGVyPSJoZXggYnl0ZXMiPjwvdGV4dGFyZWE+CjwvZm9ybT4KCjxzY3JpcHQgdHlwZT0idGV4dC9qYXZhc2NyaXB0Ij4KICBmdW5jdGlvbiByYXdUb0J5dGVzKHJhdykgewogICAgY29uc3QgYnl0ZXMgPSBbXTsKICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmF3Lmxlbmd0aDsgaSsrKSB7CiAgICAgIGJ5dGVzLnB1c2gocmF3LmNvZGVQb2ludEF0KGkpKTsKICAgIH0KICAgIHJldHVybiBieXRlcy5tYXAoeCA9PiB4LnRvU3RyaW5nKDE2KSkuam9pbignICcpOwogIH0KCiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlY29kZScpLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2dCA9PiB7CiAgICBldnQucHJldmVudERlZmF1bHQoKTsKICAgIHRyeSB7CiAgICAgIGNvbnN0IGVuY29kZWQgPSBldnQudGFyZ2V0LmVuY29kZWQudmFsdWU7CiAgICAgIGNvbnN0IGRlY29kZWQgPSBhdG9iKGVuY29kZWQpOwogICAgICBldnQudGFyZ2V0LmRlY29kZWQudmFsdWUgPSBkZWNvZGVkOwogICAgICBldnQudGFyZ2V0LmJ5dGVzLnZhbHVlID0gcmF3VG9CeXRlcyhkZWNvZGVkKTsKICAgIH0gY2F0Y2ggKGVycikgewogICAgICBhbGVydChlcnIpOwogICAgfQogIH0pOwoKICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZW5jb2RlJykuYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZXZ0ID0+IHsKICAgIHRyeSB7CiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpOwogICAgICBjb25zdCBkZWNvZGVkID0gZXZ0LnRhcmdldC5kZWNvZGVkLnZhbHVlOwogICAgICBjb25zdCBlbmNvZGVkID0gYnRvYShkZWNvZGVkKTsKICAgICAgZXZ0LnRhcmdldC5lbmNvZGVkLnZhbHVlID0gZW5jb2RlZDsKICAgICAgZXZ0LnRhcmdldC5ieXRlcy52YWx1ZSA9IHJhd1RvQnl0ZXMoZGVjb2RlZCk7CiAgICB9IGNhdGNoIChlcnIpIHsKICAgICAgYWxlcnQoZXJyKTsKICAgIH0KICB9KTsKPC9zY3JpcHQ+`,
        messaging: 'none',
      },
    },
  });

  await upsertEntity({
    apiVersion: 'dist.app/v1alpha1',
    kind: 'Activity',
    metadata: {
      name: 'dagd',
      namespace: 'toolbelt',
      description: 'da.gd network lookup tool.',
    },
    spec: {
      type: 'frame',
      urlPatterns: [],
      frame: {
        sourceUrl: `data:text/html;base64,PCFkb2N0eXBlIGh0bWw+Cjx0aXRsZT5kYS5nZCB0b29sPC90aXRsZT4KCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+CiAgYm9keSB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzOwogICAgY29sb3I6ICNmZmY7CiAgICBtYXJnaW46IDA7CiAgICBwYWRkaW5nOiAwIDJlbTsKICAgIGRpc3BsYXk6IGZsZXg7CiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOwogICAgaGVpZ2h0OiAxMDB2aDsKICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7CiAgfQogIGJvZHksIGlucHV0LCBzZWxlY3QsIGJ1dHRvbiB7CiAgICBmb250LWZhbWlseTogbW9ub3NwYWNlOwogIH0KICBoMSB7CiAgICBtYXJnaW46IDAuM2VtIDFlbTsKICAgIGNvbG9yOiAjOTk5OwogIH0KICBzZWN0aW9uIHsKICAgIGZvbnQtc2l6ZTogMS4zZW07CiAgICBtYXJnaW46IDFlbTsKICAgIHBhZGRpbmc6IDFlbTsKICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMjAwLCAyMDAsIDIwMCwgMC4zKTsKICB9CiAgaW5wdXQsIHRleHRhcmVhIHsKICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMjIyOwogICAgY29sb3I6ICNmZmY7CiAgICBmb250LXNpemU6IDFlbTsKICAgIHBhZGRpbmc6IDAuM2VtIDAuNWVtOwogICAgYm9yZGVyOiAxcHggc29saWQgIzk5OTsKICAgIG92ZXJmbG93LXk6IGhpZGRlbjsKICB9CiAgaW5wdXRbcmVhZG9ubHldLCB0ZXh0YXJlYVtyZWFkb25seV0gewogICAgYm9yZGVyLXdpZHRoOiAwOwogICAgYmFja2dyb3VuZC1jb2xvcjogIzU1NTsKICAgIGZvbnQtZmFtaWx5OiBpbmhlcml0OwogICAgY29sb3I6ICNmZmY7CiAgfQogIGJ1dHRvbiB7CiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDQ0OwogICAgY29sb3I6ICNmZmY7CiAgICBmb250LXNpemU6IDAuOWVtOwogICAgYm9yZGVyOiAxcHggc29saWQgIzY2NjsKICAgIHBhZGRpbmc6IDAuMmVtIDAuN2VtOwogICAgbWFyZ2luLXRvcDogMC4zZW07CiAgICB0ZXh0LWFsaWduOiBsZWZ0OwogICAgZmxleDogMTsKICB9CiAgLm11bHRpLWJ1dHRvbiB7CiAgICBkaXNwbGF5OiBmbGV4OwogIH0KICAubXVsdGktYnV0dG9uIC5hbHQtYnV0dG9uIHsKICAgIGZsZXg6IDAgMTsKICB9CgogIEBtZWRpYSAobWluLXdpZHRoOiA4MDBweCkgewogICAgI2FwcCB7CiAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgIGZsZXg6IDE7CiAgICB9CiAgICAjYWN0aW9uLWNvbCB7CiAgICAgIGZsZXgtYmFzaXM6IDMwZW07CiAgICAgIG92ZXJmbG93LXk6IGF1dG87CiAgICAgIHBhZGRpbmc6IDJlbSAwOwogICAgfQogICAgI2hpc3RvcnktY29sIHsKICAgICAgZmxleC1iYXNpczogNTBlbTsKICAgICAgZmxleDogMTsKICAgICAgb3ZlcmZsb3cteTogc2Nyb2xsOwogICAgICBwYWRkaW5nLXRvcDogNWVtOwogICAgICBoZWlnaHQ6IDEwMHZoOwogICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94OwogICAgfQogIH0KCiAgaDMgewogICAgbWFyZ2luOiAwLjJlbSAwIDAuNGVtOwogIH0KICBoMzpub3QoOmZpcnN0LWNoaWxkKSB7CiAgICBwYWRkaW5nLXRvcDogMS4yZW07CiAgfQogIGEuZGVlcGxpbmsgewogICAgbWFyZ2luLXJpZ2h0OiAwLjRlbTsKICB9CiAgaDQgewogICAgZGlzcGxheTogaW5saW5lOwogICAgbWFyZ2luOiAwZW0gMCAwLjJlbTsKICB9CiAgLmdldC1hdHRyaWJ1dGUgewogICAgZGlzcGxheTogZmxleDsKICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgfQogIC5lbnRyeSB0ZXh0YXJlYSB7CiAgICB3aWR0aDogMTAwJTsKICAgIHJlc2l6ZTogdmVydGljYWw7CiAgfQogIC5lcnJvci1tc2cgewogICAgY29sb3I6ICNmMzMgIWltcG9ydGFudDsKICB9CiAgYSB7CiAgICBjb2xvcjogI2NjYzsKICB9Cgo8L3N0eWxlPgoKPGRpdiBpZD0iYXBwIj4KICA8ZGl2IGlkPSJhY3Rpb24tY29sIj4KICAgIDxoMT4mIzEyODEwNDsmIzgyMDU7JiMxMjgxODc7IGRhLmdkIHF1ZXJ5IHRvb2w8L2gxPgoKICAgIDxzZWN0aW9uIGNsYXNzPSJnZXQtYXR0cmlidXRlIj4KICAgICAgPGgzPkF0dHJpYnV0ZSBMb29rdXA8L2gzPgogICAgICA8YnV0dG9uIGRhdGEtcXVlcnk9ImF0dHIiIGRhdGEtcGF0aD0iL3VhIj5Vc2VyLUFnZW50PC9idXR0b24+CiAgICAgIDxidXR0b24gZGF0YS1xdWVyeT0iYXR0ciIgZGF0YS1wYXRoPSIvaGVhZGVycyI+UmVxdWVzdCBIZWFkZXJzPC9idXR0b24+CgogICAgICA8ZGl2IGNsYXNzPSJtdWx0aS1idXR0b24iPgogICAgICAgIDxidXR0b24gZGF0YS1xdWVyeT0iYXR0ciIgZGF0YS1wYXRoPSIvaXAiPklQIEFkZHJlc3M8L2J1dHRvbj4KICAgICAgICA8YnV0dG9uIGRhdGEtcXVlcnk9ImF0dHIiIGRhdGEtcGF0aD0iL2lwIgogICAgICAgICAgICAgICAgZGF0YS1wcm90bz0iNCIgY2xhc3M9ImFsdC1idXR0b24iPklQdjQ8L2J1dHRvbj4KICAgICAgICA8YnV0dG9uIGRhdGEtcXVlcnk9ImF0dHIiIGRhdGEtcGF0aD0iL2lwIgogICAgICAgICAgICAgICAgZGF0YS1wcm90bz0iNiIgY2xhc3M9ImFsdC1idXR0b24iPklQdjY8L2J1dHRvbj4KICAgICAgICA8IS0tYnV0dG9uIGRhdGEtcXVlcnk9ImF0dHIiIGRhdGEtcGF0aD0iL2lwIgogICAgICAgICAgICAgICAgZGF0YS1wcm90bz0id2c2OSIgY2xhc3M9ImFsdC1idXR0b24iPndnNjk8L2J1dHRvbi0tPgogICAgICA8L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9Im11bHRpLWJ1dHRvbiI+CiAgICAgICAgPGJ1dHRvbiBkYXRhLXF1ZXJ5PSJhdHRyIiBkYXRhLXBhdGg9Ii9pc3AiPklTUCBOYW1lPC9idXR0b24+CiAgICAgICAgPGJ1dHRvbiBkYXRhLXF1ZXJ5PSJhdHRyIiBkYXRhLXBhdGg9Ii9pc3AiCiAgICAgICAgICAgICAgICBkYXRhLXByb3RvPSI0IiBjbGFzcz0iYWx0LWJ1dHRvbiI+SVB2NDwvYnV0dG9uPgogICAgICAgIDxidXR0b24gZGF0YS1xdWVyeT0iYXR0ciIgZGF0YS1wYXRoPSIvaXNwIgogICAgICAgICAgICAgICAgZGF0YS1wcm90bz0iNiIgY2xhc3M9ImFsdC1idXR0b24iPklQdjY8L2J1dHRvbj4KICAgICAgICA8IS0tYnV0dG9uIGRhdGEtcXVlcnk9ImF0dHIiIGRhdGEtcGF0aD0iL2lzcCIKICAgICAgICAgICAgICAgIGRhdGEtcHJvdG89IndnNjkiIGNsYXNzPSJhbHQtYnV0dG9uIj53ZzY5PC9idXR0b24tLT4KICAgICAgPC9kaXY+CgoKICAgICAgPGgzPk5hbWUgUXVlcmllczwvaDM+CiAgICAgIDxpbnB1dCBpZD0iaW5wdXQtbmFtZSIgdHlwZT0idGV4dCIgYXV0b2ZvY3VzIHJlcXVpcmVkCiAgICAgICAgICAgICBwbGFjZWhvbGRlcj0iaG9zdG5hbWUgb3IgSVAgYWRkcmVzcyIgLz4KICAgICAgPGJ1dHRvbiBkYXRhLXF1ZXJ5PSJuYW1lIiBkYXRhLXBhdGg9Ii93IiBkYXRhLWlucHV0PSIjaW5wdXQtbmFtZSI+V0hPSVM8L2J1dHRvbj4KICAgICAgPGJ1dHRvbiBkYXRhLXF1ZXJ5PSJuYW1lIiBkYXRhLXBhdGg9Ii9ob3N0IiBkYXRhLWlucHV0PSIjaW5wdXQtbmFtZSI+UmVzb2x2ZSBIb3N0PC9idXR0b24+CiAgICAgIDxidXR0b24gZGF0YS1xdWVyeT0ibmFtZSIgZGF0YS1wYXRoPSIvZG5zIiBkYXRhLWlucHV0PSIjaW5wdXQtbmFtZSI+RE5TIFF1ZXJ5PC9idXR0b24+CiAgICAgIDxidXR0b24gZGF0YS1xdWVyeT0ibmFtZSIgZGF0YS1wYXRoPSIvaXNwIiBkYXRhLWlucHV0PSIjaW5wdXQtbmFtZSI+SVNQIE5hbWU8L2J1dHRvbj4KCgogICAgICA8aDM+VVJMIFF1ZXJpZXM8L2gzPgogICAgICA8aW5wdXQgaWQ9ImlucHV0LXVybCIgdHlwZT0idGV4dCIgYXV0b2ZvY3VzIHJlcXVpcmVkCiAgICAgICAgICAgICBwbGFjZWhvbGRlcj0idXJsLCBob3N0bmFtZSwgb3IgSVAgYWRkcmVzcyIgLz4KICAgICAgPGJ1dHRvbiBkYXRhLXF1ZXJ5PSJ1cmwiIGRhdGEtcGF0aD0iL3VwIiBkYXRhLWlucHV0PSIjaW5wdXQtdXJsIj5IVFRQIGNoZWNrPC9idXR0b24+CiAgICAgIDxidXR0b24gZGF0YS1xdWVyeT0idXJsIiBkYXRhLXBhdGg9Ii9oZWFkZXJzIiBkYXRhLWlucHV0PSIjaW5wdXQtdXJsIj5SZXNwb25zZSBIZWFkZXJzPC9idXR0b24+CiAgICA8L3NlY3Rpb24+CiAgPC9kaXY+CgogIDxkaXYgaWQ9Imhpc3RvcnktY29sIj4KICAgIDxzZWN0aW9uIGNsYXNzPSJpbnRybyI+CiAgICAgIDxhIGhyZWY9Imh0dHBzOi8vZGEuZ2QiPnBvd2VyZWQgYnkgZGEuZ2Q8L2E+CiAgICA8L3NlY3Rpb24+CiAgPC9kaXY+CjwvZGl2PgoKPHNjcmlwdCB0eXBlPSJ0ZXh0L2phdmFzY3JpcHQiPgoKICBjb25zdCBoaXN0b3J5Q29sID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2hpc3RvcnktY29sJyk7CiAgZnVuY3Rpb24gYWRkRW50cnkgKGFjdGlvbikgewoKICAgIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDQnKTsKICAgIGNvbnN0IHByb2dyZXNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJvZ3Jlc3MnKTsKICAgIGNvbnN0IG91dHB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7CiAgICBvdXRwdXQucmVhZE9ubHkgPSB0cnVlOwogICAgb3V0cHV0LnJvd3MgPSAxOwogICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RpbWUnKTsKCiAgICBjb25zdCBoZWFkYm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBoZWFkYm94LmNsYXNzTGlzdC5hZGQoJ2VudHJ5LWhlYWQnKTsKICAgIGhlYWRib3guYXBwZW5kQ2hpbGQodGl0bGUpOwoKICAgIGNvbnN0IGJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlY3Rpb24nKTsKICAgIGJveC5jbGFzc0xpc3QuYWRkKCdlbnRyeScpOwogICAgYm94LmFwcGVuZENoaWxkKGhlYWRib3gpOwogICAgYm94LmFwcGVuZENoaWxkKHByb2dyZXNzKTsKICAgIGhpc3RvcnlDb2wuaW5zZXJ0QmVmb3JlKGJveCwgaGlzdG9yeUNvbC5jaGlsZHJlblswXSk7CgogICAgY29uc3QgZmluYWxpemVCb3ggPSAoKSA9PiB7CiAgICAgIGJveC5yZW1vdmVDaGlsZChwcm9ncmVzcyk7CgogICAgICBib3guYXBwZW5kQ2hpbGQob3V0cHV0KTsKICAgICAgYm94LmFwcGVuZENoaWxkKHRpbWUpOwogICAgICBzZXRUaW1lb3V0KCgpID0+IHsKICAgICAgICBvdXRwdXQuc3R5bGUuaGVpZ2h0ID0gb3V0cHV0LnNjcm9sbEhlaWdodCsncHgnOwogICAgICB9LCAwKTsKICAgIH0KCiAgICByZXR1cm4gewogICAgICBkZWVwbGluayhwYXRoKSB7CiAgICAgICAgY29uc3QgZGVlcGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7CiAgICAgICAgZGVlcGxpbmsuaHJlZiA9ICdodHRwczovL2RhLmdkL3VpIycgKyBlbmNvZGVVUkkocGF0aCk7CiAgICAgICAgZGVlcGxpbmsuaW5uZXJUZXh0ID0gJyMnOwogICAgICAgIGRlZXBsaW5rLmNsYXNzTGlzdC5hZGQoJ2RlZXBsaW5rJyk7CiAgICAgICAgaGVhZGJveC5pbnNlcnRCZWZvcmUoZGVlcGxpbmssIHRpdGxlKTsKICAgICAgfSwKICAgICAgdGl0bGUodGV4dCkgeyB0aXRsZS5pbm5lclRleHQgPSB0ZXh0OyB9LAogICAgICBwcm9taXNlKHApIHsKICAgICAgICBwLnRoZW4odGV4dCA9PiB7CiAgICAgICAgICBvdXRwdXQudmFsdWUgPSB0ZXh0LnRyaW0oKTsKICAgICAgICAgIGZpbmFsaXplQm94KCk7CiAgICAgICAgfSwgZXJyID0+IHsKICAgICAgICAgIG91dHB1dC5jbGFzc0xpc3QuYWRkKCdlcnJvci1tc2cnKTsKICAgICAgICAgIG91dHB1dC52YWx1ZSA9IGVyci5tZXNzYWdlIHx8IEpTT04uc3RyaW5naWZ5KGVyciwgbnVsbCwgMik7CiAgICAgICAgICBmaW5hbGl6ZUJveCgpOwogICAgICAgIH0pOwogICAgICB9LAogICAgfTsKICB9OwoKICBjb25zdCBpbnB1dE5hbWUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQtbmFtZScpOwogIGNvbnN0IGlucHV0VXJsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2lucHV0LXVybCcpOwoKICBmdW5jdGlvbiBkb0FjdGlvbiAoYWN0aW9uKSB7CiAgICB2YXIgZW50cnkgPSBhZGRFbnRyeShhY3Rpb24ucXVlcnkpOwoKICAgIHN3aXRjaCAoYWN0aW9uLnF1ZXJ5KSB7CiAgICAgIGNhc2UgJ2F0dHInOgogICAgICAgIHZhciBwcm90byA9ICdodHRwcyc7CiAgICAgICAgdmFyIGhvc3RuYW1lID0gJ2RhLmdkJzsKICAgICAgICB2YXIgdGl0bGUgPSAnYXR0cmlidXRlIHF1ZXJ5OiAnK2FjdGlvbi5wYXRoOwogICAgICAgIGlmIChhY3Rpb24ucHJvdG8gPT09ICd3ZzY5JykgewogICAgICAgICAgcHJvdG8gPSAnaHR0cCc7CiAgICAgICAgICBob3N0bmFtZSA9ICdkYWdkLnJpY2sudHVuLndnNjkubmV0JzsKICAgICAgICAgIHRpdGxlICs9IGAgKHVzaW5nIHdnNjkgVlBOKWA7CiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24ucHJvdG8pIHsKICAgICAgICAgIGhvc3RuYW1lID0gYWN0aW9uLnByb3RvICsgJy4nICsgaG9zdG5hbWU7CiAgICAgICAgICB0aXRsZSArPSBgICh1c2luZyBJUHYke2FjdGlvbi5wcm90b30pYDsKICAgICAgICB9CgogICAgICAgIGVudHJ5LmRlZXBsaW5rKGFjdGlvbi5wYXRoKTsKICAgICAgICBlbnRyeS50aXRsZSh0aXRsZSk7CiAgICAgICAgZW50cnkucHJvbWlzZSgKICAgICAgICAgIGZldGNoKHByb3RvKyc6Ly8nK2hvc3RuYW1lK2FjdGlvbi5wYXRoKQogICAgICAgICAgLnRoZW4oeCA9PiB4LnRleHQoKSkpOwogICAgICAgIGJyZWFrOwoKICAgICAgY2FzZSAnbmFtZSc6CiAgICAgICAgbGV0IG5hbWU7CiAgICAgICAgdHJ5IHsKICAgICAgICAgIG5hbWUgPSBjbGVhbk5hbWUoaW5wdXROYW1lLnZhbHVlKTsKICAgICAgICB9IGNhdGNoIChlcnIpIHsKICAgICAgICAgIHJldHVybiBlbnRyeS5wcm9taXNlKFByb21pc2UucmVqZWN0KGVycikpOwogICAgICAgIH0KCiAgICAgICAgZW50cnkuZGVlcGxpbmsoYWN0aW9uLnBhdGgrJy8nK25hbWUpOwogICAgICAgIGVudHJ5LnRpdGxlKCduYW1lIHF1ZXJ5OiAnK2FjdGlvbi5wYXRoKycvJytuYW1lKTsKICAgICAgICBpZiAobmFtZSkgewogICAgICAgICAgZW50cnkucHJvbWlzZSgKICAgICAgICAgICAgZmV0Y2goJ2h0dHBzOi8vZGEuZ2QnK2FjdGlvbi5wYXRoKycvJytuYW1lKQogICAgICAgICAgICAudGhlbih4ID0+IHgudGV4dCgpKSk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIGVudHJ5LnByb21pc2UoCiAgICAgICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTmFtZSBpcyByZXF1aXJlZCcpKSk7CiAgICAgICAgICBpbnB1dE5hbWUuZm9jdXMoKTsKICAgICAgICB9CiAgICAgICAgYnJlYWs7CgogICAgICBjYXNlICd1cmwnOgogICAgICAgIGNvbnN0IHVybCA9IGlucHV0VXJsLnZhbHVlOwogICAgICAgIGVudHJ5LmRlZXBsaW5rKGFjdGlvbi5wYXRoKycvJyt1cmwpOwogICAgICAgIGVudHJ5LnRpdGxlKCd1cmwgcXVlcnk6ICcrYWN0aW9uLnBhdGgrJy8nK3VybCk7CiAgICAgICAgaWYgKHVybCkgewogICAgICAgICAgZW50cnkucHJvbWlzZSgKICAgICAgICAgICAgZmV0Y2goJ2h0dHBzOi8vZGEuZ2QnK2FjdGlvbi5wYXRoKycvJyt1cmwpCiAgICAgICAgICAgIC50aGVuKHggPT4geC50ZXh0KCkpKTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgZW50cnkucHJvbWlzZSgKICAgICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdVUkwgaXMgcmVxdWlyZWQnKSkpOwogICAgICAgICAgaW5wdXRVcmwuZm9jdXMoKTsKICAgICAgICB9CiAgICAgICAgYnJlYWs7CgogICAgICBkZWZhdWx0OgogICAgICAgIGVudHJ5LnRpdGxlKCdhY3Rpb246ICcrYWN0aW9uKTsKICAgICAgICBlbnRyeS5wcm9taXNlKAogICAgICAgICAgUHJvbWlzZS5yZWplY3QoJ1Vua25vd24gY2xpZW50IGFjdGlvbicpKTsKICAgICAgICBicmVhazsKICAgIH0KICB9CgogIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoImNsaWNrIiwgZXZlbnQgPT4gewogICAgdmFyIGVsZW1lbnQgPSBldmVudC50YXJnZXQ7CiAgICB3aGlsZSAoZWxlbWVudCkgewogICAgICBpZiAoZWxlbWVudC5ub2RlTmFtZSA9PT0gJ0JVVFRPTicgJiYgJ3F1ZXJ5JyBpbiBlbGVtZW50LmRhdGFzZXQpIHsKICAgICAgICByZXR1cm4gZG9BY3Rpb24oZWxlbWVudC5kYXRhc2V0KTsKICAgICAgfQogICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlOwogICAgfQogIH0sIGZhbHNlKTsKCiAgZnVuY3Rpb24gY2xlYW5OYW1lKGlucHV0KSB7CiAgICAvLyBjbGVhbiB1cCBhIFVSTCBpbnRvIGEgbmFtZQogICAgaWYgKGlucHV0LmluY2x1ZGVzKCc6Ly8nKSkgewogICAgICBsZXQgbWF0Y2ggPSBpbnB1dC5tYXRjaCgvOlwvXC8oW146XC9dKykvKTsKICAgICAgaWYgKG1hdGNoICYmIGNvbmZpcm0oCmBJIGNsZWFuZWQgdGhhdCBVUkkgeW91IGdhdmUgbWUgaW50byBhIGhvc3RuYW1lLlxuCklucHV0OiAke2lucHV0fQpDbGVhbmVkOiAke21hdGNoWzFdfVxuClNvdW5kIGdvb2QsIGJvc3M/YCkpIHsKICAgICAgICByZXR1cm4gbWF0Y2hbMV07CiAgICAgIH0KICAgIH0KCiAgICBpZiAoaW5wdXQuaW5jbHVkZXMoJy8nKSB8fCAhKGlucHV0Lm1hdGNoKC9bOi5dLykpKSB7CiAgICAgIGFsZXJ0KGBUaGF0IGlucHV0IHlvdSBnYXZlIG1lIGRvZXNuJ3QgbG9vayBsaWtlIGEgRE5TIG5hbWUgb3IgSVAgYWRkcmVzcy4gV2FubmEgdHJ5IGFnYWluP2ApOwogICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkbid0IHVuZGVyc3RhbmQgJHtKU09OLnN0cmluZ2lmeShpbnB1dCl9IGFzIGEgbmFtZSwgc2VsZmlzaGx5IHJlZnVzaW5nIHRvIHNlbmQgdG8gZGFnZGApOwogICAgfQoKICAgIHJldHVybiBpbnB1dDsKICB9CgogIGZ1bmN0aW9uIGRvQWN0aW9uRm9yVXJsICh1cmwpIHsKICAgIGNvbnN0IFtfLCBwYXRoLCAuLi5hcmddID0gdXJsLnNwbGl0KCcvJyk7CiAgICBpZiAoIXBhdGggfHwgIXBhdGgubGVuZ3RoID09PSAwKSByZXR1cm47CgogICAgbGV0IHNlbGVjdG9yID0gYGJ1dHRvbltkYXRhLXF1ZXJ5XVtkYXRhLXBhdGg9Ii8ke3BhdGh9Il1gOwogICAgaWYgKGFyZy5sZW5ndGggPiAwKSBzZWxlY3RvciArPSBgW2RhdGEtaW5wdXRdYDsKCiAgICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTsKICAgIGlmICghYnV0dG9uKSByZXR1cm47CgogICAgaWYgKGJ1dHRvbi5kYXRhc2V0LmlucHV0KSB7CiAgICAgIGNvbnN0IGlucHV0Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihidXR0b24uZGF0YXNldC5pbnB1dCk7CiAgICAgIGlmICghaW5wdXRCb3gpIHJldHVybjsKICAgICAgaW5wdXRCb3gudmFsdWUgPSBhcmcuam9pbignLycpOwogICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsKICAgICAgICBpbnB1dEJveC5mb2N1cygpOwogICAgICB9LCAxKTsKICAgIH0KCiAgICBidXR0b24uY2xpY2soKTsKICB9CgogIGNvbnN0IGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDsKICBpZiAoaGFzaCAmJiBoYXNoLmxlbmd0aCA+IDEpIHsKICAgIGRvQWN0aW9uRm9yVXJsKGhhc2guc2xpY2UoMSkpOwogIH0KCjwvc2NyaXB0Pg==`,
        messaging: 'none',
      },
    },
  });


});
