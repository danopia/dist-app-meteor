import { html, stripIndent } from "common-tags";
import { Entity } from "/imports/entities";

export const TimezonesCatalog = new Array<Entity>({
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Application',
  metadata: {
    name: 'app',
    title: 'Timezones',
    description: `Displays the world's time zones`,
    tags: ['poc'],
  },
  spec: {
    icon: {
      type: 'glyph',
      glyph: {
        text: '🌎',
        backgroundColor: '#9ff',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'main',
    title: 'Timezones',
    ownerReferences: [{
      apiVersion: 'manifest.dist.app/v1alpha1',
      kind: 'Application',
      name: 'app',
    }],
  },
  spec: {
    intentFilters: [{
      action: 'app.dist.Main',
      category: 'app.dist.Launcher',
    }],
    fetchBindings: [{
      pathPrefix: '/world-time',
      apiName: 'world-time-api',
    }],
    windowSizing: {
      initialWidth: 500,
      minWidth: 200,
      // maxWidth: 1000,
      initialHeight: 150,
      minHeight: 150,
      maxHeight: 150,
    },
    implementation: {
      type: 'iframe',
      sandboxing: ['allow-scripts'],
      securityPolicy: {
        scriptSrc: ['https://widget.time.is'],
      },
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'time.is squares',
        scriptUrls: [
          // 'https://widget.time.is/en.js',
        ],
        bodyHtml: stripIndent(html)`
          <div class="grid">
            Hey!!!
          </div>
        `,
        inlineStyle: stripIndent`
          body {
            background-color: #fff;
            color: #444;
            margin: 0;
            font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
          }
          .grid {
            display: flex;
            height: 100vh;
          }
          .clock {
            padding: 0.5em; flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
          }
          .clock:hover { background-color: rgba(120,120,120,0.1); }
          .grid > div { text-align: center; }
          .location { font-size: 1.25em; color: #666; }
          .time { font-size: 3em; }
          .sun { font-size: 1.5em; }
          .sunrise { color: #696; }
          .sunset { color: #966; }
          .divider { color: #999; padding: 0 0.2em; font-size: 0.8em; }
          a { color: inherit; }

          @media (prefers-color-scheme: dark) {
            body {
              background-color: rgb(25, 25, 25);
              color: rgba(255, 255, 255, 0.87);
            }
            .clock:hover { background-color: rgba(170,170,170,0.1); }
            .location { color: #ccc; }
            .sunrise { color: #9c9; }
            .sunset { color: #c99; }
            .divider { color: #999; }
          }
        `,
        inlineScript: stripIndent(html)`
          const distApp = await DistApp.connect();

          const allZones = await distApp.fetch('/binding/world-time/timezone');
          console.log(await allZones.json());

          await distApp.reportReady();
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Api',
  metadata: {
    name: 'world-time-api',
    links: [{
      url: 'https://worldtimeapi.org/api/',
      type: 'origin',
    }],
  },
  spec: {
    type: 'openapi',
    definition: stripIndent`
      openapi: 3.0.1
      info:
        title: World Time API
        version: '20210108-multicontent'
        description: A simple API to get the current time based on a request with a timezone.
      servers:
        - url: https://worldtimeapi.org/api/
      paths:
        /timezone:
          get:
            responses:
              default:
                $ref: '#/components/responses/SuccessfulListResponse'
            summary: a listing of all timezones.
        /timezone/{area}:
          get:
            parameters:
              - name: area
                schema:
                  type: string
                in: path
                required: true
            responses:
              '200':
                $ref: '#/components/responses/SuccessfulListResponse'
              default:
                $ref: '#/components/responses/ErrorResponse'
            summary: a listing of all timezones available for that area.
        /timezone/{area}/{location}:
          get:
            parameters:
              - name: area
                schema:
                  type: string
                in: path
                required: true
              - name: location
                schema:
                  type: string
                in: path
                required: true
            responses:
              '200':
                $ref: '#/components/responses/SuccessfulDateTimeResponse'
              default:
                $ref: '#/components/responses/ErrorResponse'
            summary: request the current time for a timezone.
        /timezone/{area}/{location}/{region}:
          get:
            parameters:
              - name: area
                schema:
                  type: string
                in: path
                required: true
              - name: location
                schema:
                  type: string
                in: path
                required: true
              - name: region
                schema:
                  type: string
                in: path
                required: true
            responses:
              '200':
                $ref: '#/components/responses/SuccessfulDateTimeResponse'
              default:
                $ref: '#/components/responses/ErrorResponse'
            summary: request the current time for a timezone.
        /ip:
          get:
            responses:
              '200':
                $ref: '#/components/responses/SuccessfulDateTimeResponse'
              default:
                $ref: '#/components/responses/ErrorResponse'
            summary: >-
              request the current time based on the ip of the request. note: this is a
              "best guess" obtained from open-source data.
        /ip/{ipv4}:
          get:
            parameters:
              - name: ipv4
                schema:
                  type: string
                in: path
                required: true
            responses:
              '200':
                $ref: '#/components/responses/SuccessfulDateTimeResponse'
              default:
                $ref: '#/components/responses/ErrorResponse'
            summary: >-
              request the current time based on the ip of the request. note: this is a
              "best guess" obtained from open-source data.
      components:
        responses:
          ErrorResponse:
            description: an error response in JSON or plaintext format
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/ErrorJsonResponse'
              text/plain:
                schema:
                  $ref: '#/components/schemas/ErrorTextResponse'
          SuccessfulListResponse:
            description: the list of available timezones in JSON or plaintext format
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/ListJsonResponse'
              text/plain:
                schema:
                  $ref: '#/components/schemas/ListTextResponse'
          SuccessfulDateTimeResponse:
            description: the current time for the timezone requested in JSON or plaintext format
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/DateTimeJsonResponse'
              text/plain:
                schema:
                  $ref: '#/components/schemas/DateTimeTextResponse'
        schemas:
          ListJsonResponse:
            description: a list of available timezones
            type: array
            items:
              type: string
          ListTextResponse:
            description: a list of available timezones, one per line
            type: string
          DateTimeJsonResponse:
            required:
              - abbreviation
              - client_ip
              - datetime
              - day_of_week
              - day_of_year
              - dst
              - dst_offset
              - timezone
              - unixtime
              - utc_datetime
              - utc_offset
              - week_number
            properties:
              abbreviation:
                description: the abbreviated name of the timezone
                type: string
              client_ip:
                description: the IP of the client making the request
                type: string
              datetime:
                description: an ISO8601-valid string representing the current, local date/time
                type: string
              day_of_week:
                description: current day number of the week, where sunday is 0
                type: integer
              day_of_year:
                description: ordinal date of the current year
                type: integer
              dst:
                description: flag indicating whether the local time is in daylight savings
                type: boolean
              dst_from:
                description: >-
                  an ISO8601-valid string representing the datetime when daylight
                  savings started for this timezone
                type: string
              dst_offset:
                description: >-
                  the difference in seconds between the current local time and
                  daylight saving time for the location
                type: integer
              dst_until:
                description: >-
                  an ISO8601-valid string representing the datetime when daylight
                  savings will end for this timezone
                type: string
              raw_offset:
                description: >-
                  the difference in seconds between the current local time and the
                  time in UTC, excluding any daylight saving difference (see
                  dst_offset)
                type: integer
              timezone:
                description: timezone in \`Area/Location\` or \`Area/Location/Region\` format
                type: string
              unixtime:
                description: number of seconds since the Epoch
                type: integer
              utc_datetime:
                description: an ISO8601-valid string representing the current date/time in UTC
                type: string
              utc_offset:
                description: an ISO8601-valid string representing the offset from UTC
                type: string
              week_number:
                description: the current week number
                type: integer
          DateTimeTextResponse:
            description: >-
              time zone details, as per the DateTimeJsonResponse response, in the
              format \`key: value\`, one item per line
            type: string
          ErrorJsonResponse:
            required:
              - error
            properties:
              error:
                description: details about the error encountered
                type: string
          ErrorTextResponse:
            description: details about the error encountered in plain text
            type: string
    `,
  },
});
