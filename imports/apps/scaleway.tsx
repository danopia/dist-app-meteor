import { html, stripIndent } from "common-tags";
import { useVueState } from "./_vue";
import { Entity } from "/imports/entities";

export const ScalewayCatalog = new Array<Entity>({
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Application',
  metadata: {
    name: 'app',
    title: 'Scaleway',
    description: `Toggle Scaleway servers on/off`,
    tags: ['poc'],
  },
  spec: {
    icon: {
      type: 'svg',
      svg: {
        textData: `<svg width="32px" height="32px" version="1.1" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m22.146 14.813v7.625c-.042 1.156-.911 2.109-2.052 2.255h-5.333c-.891-.063-1.62-.74-1.745-1.625-.01-.083-.01-.161 0-.24.005-1.005.823-1.813 1.823-1.813h2.323c.734 0 1.333-.599 1.333-1.333v-4.828c-.005-.922.661-1.708 1.573-1.854h.224c1.016-.016 1.849.797 1.854 1.813zm-8.615 2.322v-4.786c0-.74.599-1.333 1.333-1.333h2.469c1.01 0 1.828-.818 1.828-1.828.005-.078.005-.151 0-.229-.161-.917-.953-1.589-1.88-1.599h-5.281c-1.141.146-2.021 1.068-2.104 2.214v7.599c0 1.01.818 1.828 1.823 1.828h.281c.901-.161 1.547-.953 1.531-1.865zm16-5.724v15.255c-.328 2.875-2.646 5.109-5.531 5.333h-10.104c-6.307-.005-11.417-5.12-11.417-11.427v-14.521c0-3.344 2.714-6.052 6.052-6.052h9.573c6.307 0 11.417 5.109 11.417 11.411zm-3.651 0c-.005-4.281-3.479-7.75-7.76-7.76h-9.589c-1.328-.005-2.406 1.073-2.396 2.401v14.521c.021 4.271 3.484 7.724 7.76 7.734h9.917c1.047-.135 1.88-.938 2.052-1.974z" fill="#fff"/></svg>`,
        backgroundColor: '#4f0599',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Activity',
  metadata: {
    name: 'main',
    title: 'Scaleway Instances',
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
      pathPrefix: '/scw',
      apiName: 'instance-api',
    }],
    windowSizing: {
      initialWidth: 300,
      minWidth: 200,
      // maxWidth: 1000,
      initialHeight: 350,
      minHeight: 150,
      // maxHeight: 150,
    },
    implementation: {
      type: 'iframe',
      securityPolicy: {
        scriptSrc: ['https://unpkg.com'],
      },
      sandboxing: ['allow-scripts'],
      source: {
        type: 'piecemeal',
        htmlLang: 'en',
        metaCharset: 'utf-8',
        headTitle: 'scaleway remote',
        inlineScript: stripIndent(html)`
          import { createApp, reactive, watchEffect } from "https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js";
          const distApp = await DistApp.connect();
          ${useVueState}

          const context = await useVueState('context', {
            region: 'fr-par-2',
            // resourceList: 'instances',
            // resourceId: null,
          });

          async function loadData() {
            const [
              dashboard,
              servers,
            ] = await Promise.all([
              distApp.fetch('/binding/scw/instance/v1/zones/fr-par-2/dashboard').then(async resp => {
                if (!resp.ok) throw new Error("dashboard load failed: HTTP "+resp.status);
                const {dashboard} = await resp.json();
                return dashboard;
              }),
              distApp.fetch('/binding/scw/instance/v1/zones/fr-par-2/servers').then(async resp => {
                if (!resp.ok) throw new Error("servers load failed: HTTP "+resp.status);
                const {servers} = await resp.json();
                console.log('scaleway servers:', servers);
                return servers;
              }),
            ]);
            return {dashboard, servers};
          }

          const {dashboard, servers} = await loadData();

          const app = createApp({
            data: () => ({
              context: context(),
              dashboard,
              servers,
            }),
            created() {
              setInterval(() => {
                this.reloadData();
              }, 60 * 1000);
            },
            methods: {
              hasIp(server) {
                return !!server.public_ip?.id;
              },
              serverUrl(server) {
                return "https://"+server.id+".pub.instances.scw.cloud";
              },
              openServerUrl(server) {
                distApp.launchIntent({
                  action: 'app.dist.View',
                  catagory: 'app.dist.Browsable',
                  data: this.serverUrl(server),
                });
              },
              async handleIpChange(server, wantsIp) {
                if (server.public_ip && wantsIp == false) {
                  const resp = await distApp.fetch('/binding/scw/instance/v1/zones/fr-par-2/ips/'+server.public_ip.id, {method: 'DELETE'});
                  if (!resp.ok) throw new Error("delete IP failed: HTTP "+resp.status);
                  console.log('IP deleted!');
                } else if (!server.public_ip && wantsIp == true) {
                  const resp = await distApp.fetch('/binding/scw/instance/v1/zones/fr-par-2/ips', {
                    method: 'POST',
                    headers: {
                      'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                      project: server.project,
                      tags: ['ad-hoc'],
                      server: server.id,
                    }),
                  });
                  if (!resp.ok) throw new Error("create IP failed: HTTP "+resp.status+" "+await resp.text());
                  console.log('IP created!');
                }
                this.reloadData();
              },
              async doAction(serverId, actionId) {
                const resp = await distApp.fetch('/binding/scw/instance/v1/zones/fr-par-2/servers/'+serverId+'/action', {
                  method: 'POST',
                  headers: {
                    'content-type': 'application/json',
                  },
                  body: JSON.stringify({
                    action: actionId,
                  }),
                });
                if (!resp.ok) throw new Error("server action "+actionId+" failed: HTTP "+resp.status);
                console.log('Server action completed');
                this.reloadData();
              },
              async reloadData() {
                const newData = await loadData();
                this.servers = newData.servers;
                this.dashboard = newData.dashboard;
              },
            },
          });

          app.mount('body');
          await distApp.reportReady();
        `,
        bodyHtml: stripIndent(html)`
          <select name="region" v-model="context.region">
            <optgroup label="France - Paris">
              <option>fr-par-1</option>
              <option>fr-par-2</option>
              <option>fr-par-3</option>
            </optgroup>
            <optgroup label="The Netherlands - Amsterdam">
              <option>nl-ams-1</option>
              <option>nl-ams-2</option>
            </optgroup>
            <optgroup label="Poland - Warsaw">
              <option>pl-waw-1</option>
            </optgroup>
          </select>
          <button type="button" @click="reloadData">Refresh data</button>

          <table width="100%" style="text-align: center;">
            <tr>
              <th>servers</th>
              <th>IPs</th>
              <th>volumes</th>
            </tr>
            <tr>
              <td>{{ dashboard.running_servers_count }} of {{ dashboard.servers_count }}</td>
              <td>{{ dashboard.ips_count - dashboard.ips_unused }} of {{ dashboard.ips_count }}</td>
              <td>{{ dashboard.volumes_count }}</td>
            </tr>
          </table>

          <table class="instance-list" width="100%">
            <tr>
              <td></td>
              <td>server</td>
              <!--td>size</td-->
              <td>IPv4</td>
              <td></td>
            </tr>
            <tr v-for="server in servers">
              <td style="line-height: 0;" v-bind:title="server.state +': '+ server.state_detail">
                <div v-bind:class="'server-state '+ (server.state_detail || server.state)" />
              </td>
              <td>
                <div style="color: rgb(190, 125, 254);">{{ server.name }}</div>
                <div style="color: rgb(127,127,127); font-size: 0.8em;">{{ server.commercial_type }}</div>
              </td>
              <!--td>{{ server.commercial_type }}</td-->
              <td><input type="checkbox" v-bind:checked="hasIp(server)" @change="evt => handleIpChange(server,evt.target.checked)" /></td>
              <td>
              <button type="button"
                  v-if="server.state == 'running'"
                  @click="openServerUrl(server)"
                >Go</button>
              <button type="button"
                  v-if="server.allowed_actions.includes('poweron')"
                  @click="doAction(server.id, 'poweron')"
                >Start</button>
              <button type="button"
                  v-if="server.allowed_actions.includes('poweroff')"
                  @click="doAction(server.id, 'poweroff')"
                >Stop</button>
              </td>
            </tr>
          </table>
          <!--table>
            <tr><th>running_servers_count</th><td>{{ dashboard.running_servers_count }}</td></tr>
            <tr><th>servers_count</th><td>{{ dashboard.servers_count }}</td></tr>
            <tr v-for="(servers_count, type) in dashboard.servers_by_types">
              <th><code>{{ type }}</th><td>{{ servers_count }}</td>
            </tr>
            <tr><th>volumes_count</th><td>{{ dashboard.volumes_count }}</td></tr>
            <tr><th>snapshots_count</th><td>{{ dashboard.snapshots_count }}</td></tr>
            <tr><th>ips_count</th><td>{{ dashboard.ips_count }}</td></tr>
            <tr><th>ips_unused</th><td>{{ dashboard.ips_unused }}</td></tr>
            <tr><th>images_count</th><td>{{ dashboard.images_count }}</td></tr>
            <tr><th>placement_groups_count</th><td>{{ dashboard.placement_groups_count }}</td></tr>
            <tr><th>security_groups_count</th><td>{{ dashboard.security_groups_count }}</td></tr>
          </table-->
        `,
        inlineStyle: stripIndent`
          body {
            background-color: #fff;
            color: #444;
            margin: 0;
            font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: rgb(25, 25, 25);
              color: rgba(255, 255, 255, 0.87);
            }
          }
          table {
            border-collapse: collapse;
            margin-top: 1em;
          }
          .instance-list th,
          .instance-list td {
            text-align: left;
            padding: 0.5em 0.2em;
          }
          .instance-list tr:hover {
            background-color: rgba(120,120,120,0.2);
          }
          .instance-list td:first-child { padding-left: 1em; }
          .instance-list td:last-child { padding-right: 1em; }

          .server-state {
            width: 0.75em;
            aspect-ratio: 1;
            border-radius: 50%;
            display: inline-block;
            background-color: rgb(59, 63, 78);
            border: 1px solid gray;
          }
          .server-state.booted {
            background-color: rgb(27, 160, 130);
          }
          .server-state.booting {
            background-color: rgb(227, 160, 130);
          }
          .server-state.provisioning,
          .server-state.stopping,
          .server-state.stopped {
            background-color: rgb(32, 71, 158);
          }
        `,
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'Api',
  metadata: {
    name: 'instance-api',
    links: [{
      url: 'https://developers.scaleway.com/en/products/instance/api/',
      type: 'origin',
    }],
  },
  spec: {
    type: 'openapi',
    definition: stripIndent`
      openapi: 3.0.0
      info:
        title: Instance API
        version: v1
      servers:
      - url: https://api.scaleway.com
        x-cors-enabled: false
      components:
        securitySchemes:
          scaleway:
            in: header
            name: X-Auth-Token
            type: apiKey
      paths:
        /instance/v1/zones/{zone}/dashboard:
          get:
            operationId: GetDashboard
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: query
              name: organization
              schema:
                $ref: '#/components/schemas/google.protobuf.StringValue'
            - in: query
              name: project
              schema:
                $ref: '#/components/schemas/google.protobuf.StringValue'
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.GetDashboardResponse'
            security:
            - scaleway: []
        /instance/v1/zones/{zone}/ips:
          get:
            tags:
            - IPs
            operationId: ListIps
            summary: List all flexible IPs
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.ListIpsResponse'
            security:
            - scaleway: []
          post:
            tags:
            - IPs
            operationId: CreateIp
            summary: Reserve a flexible IP
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            responses:
              "201":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.CreateIpResponse'
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    type: object
            security:
            - scaleway: []
        /instance/v1/zones/{zone}/ips/{ip}:
          get:
            tags:
            - IPs
            operationId: GetIp
            summary: Get a flexible IP
            description: Get details of an IP with the given ID or address.
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: path
              name: ip
              description: The IP ID or address to get
              required: true
              schema:
                type: string
                description: The IP ID or address to get
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.GetIpResponse'
            security:
            - scaleway: []
          patch:
            tags:
            - IPs
            operationId: UpdateIp
            summary: Update a flexible IP
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: path
              name: ip
              description: IP ID or IP address
              required: true
              schema:
                type: string
                description: IP ID or IP address
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.UpdateIpResponse'
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    type: object
            security:
            - scaleway: []
          delete:
            tags:
            - IPs
            operationId: DeleteIp
            summary: Delete a flexible IP
            description: Delete the IP with the given ID.
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: path
              name: ip
              description: The ID or the address of the IP to delete
              required: true
              schema:
                type: string
                description: The ID or the address of the IP to delete
            responses:
              "204":
                description: ""
            security:
            - scaleway: []
        /instance/v1/zones/{zone}/servers:
          get:
            tags:
            - Servers
            operationId: ListServers
            summary: List all servers
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.ListServersResponse'
            security:
            - scaleway: []
          post:
            tags:
            - Servers
            operationId: CreateServer
            summary: Create a server
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            responses:
              "201":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.CreateServerResponse'
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    type: object
            security:
            - scaleway: []
        /instance/v1/zones/{zone}/servers/{server_id}:
          get:
            tags:
            - Servers
            operationId: GetServer
            summary: Get a server
            description: Get the details of a specified Server.
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: path
              name: server_id
              description: UUID of the server you want to get
              required: true
              schema:
                type: string
                description: UUID of the server you want to get
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.GetServerResponse'
            security:
            - scaleway: []
          patch:
            tags:
            - Servers
            operationId: UpdateServer
            summary: Update a server
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: path
              name: server_id
              description: UUID of the server
              required: true
              schema:
                type: string
                description: UUID of the server
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.UpdateServerResponse'
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    type: object
            security:
            - scaleway: []
          delete:
            tags:
            - Servers
            operationId: DeleteServer
            summary: Delete a server
            description: Delete a server with the given ID.
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: path
              name: server_id
              required: true
              schema:
                type: string
            responses:
              "204":
                description: ""
            security:
            - scaleway: []
        /instance/v1/zones/{zone}/servers/{server_id}/action:
          get:
            tags:
            - Servers
            operationId: ListServerActions
            summary: List server actions
            description: List all actions that can currently be performed on a server.
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: path
              name: server_id
              required: true
              schema:
                type: string
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.ListServerActionsResponse'
            security:
            - scaleway: []
          post:
            tags:
            - Servers
            operationId: ServerAction
            summary: Perform action
            description: Perform power related actions on a server. Be wary that when terminating
              a server, all the attached volumes (local *and* block storage) are deleted.
              So, if you want to keep your local volumes, you must use the \`archive\` action
              instead of \`terminate\`. And if you want to keep block-storage volumes, **you
              must** detach it beforehand you issue the \`terminate\` call.  For more information,
              read the [Volumes](#volumes-7e8a39) documentation.
            parameters:
            - in: path
              name: zone
              description: The zone you want to target
              required: true
              schema:
                type: string
            - in: path
              name: server_id
              description: UUID of the server
              required: true
              schema:
                type: string
                description: UUID of the server
            responses:
              "200":
                description: ""
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/scaleway.instance.v1.ServerActionResponse'
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    type: object
            security:
            - scaleway: []
    `,
  },
});
