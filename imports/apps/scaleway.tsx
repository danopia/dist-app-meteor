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
        textData: `<svg version="1.1" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="m22.146 14.813v7.625c-.042 1.156-.911 2.109-2.052 2.255h-5.333c-.891-.063-1.62-.74-1.745-1.625-.01-.083-.01-.161 0-.24.005-1.005.823-1.813 1.823-1.813h2.323c.734 0 1.333-.599 1.333-1.333v-4.828c-.005-.922.661-1.708 1.573-1.854h.224c1.016-.016 1.849.797 1.854 1.813zm-8.615 2.322v-4.786c0-.74.599-1.333 1.333-1.333h2.469c1.01 0 1.828-.818 1.828-1.828.005-.078.005-.151 0-.229-.161-.917-.953-1.589-1.88-1.599h-5.281c-1.141.146-2.021 1.068-2.104 2.214v7.599c0 1.01.818 1.828 1.823 1.828h.281c.901-.161 1.547-.953 1.531-1.865zm16-5.724v15.255c-.328 2.875-2.646 5.109-5.531 5.333h-10.104c-6.307-.005-11.417-5.12-11.417-11.427v-14.521c0-3.344 2.714-6.052 6.052-6.052h9.573c6.307 0 11.417 5.109 11.417 11.411zm-3.651 0c-.005-4.281-3.479-7.75-7.76-7.76h-9.589c-1.328-.005-2.406 1.073-2.396 2.401v14.521c.021 4.271 3.484 7.724 7.76 7.734h9.917c1.047-.135 1.88-.938 2.052-1.974z" fill="#fff"/></svg>`,
        backgroundColor: '#4f0599',
      },
    },
  },
}, {
  apiVersion: 'manifest.dist.app/v1alpha1',
  kind: 'ApiBinding',
  metadata: {
    name: 'scw',
  },
  spec: {
    apiName: 'instance-api',
    required: true,
    auth: {
      required: true,
      accountTypeId: 'api.scaleway.com',
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
    windowSizing: {
      initialWidth: 350,
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
              distApp.fetch('/ApiBinding/scw/instance/v1/zones/fr-par-2/dashboard').then(async resp => {
                if (!resp.ok) throw new Error("dashboard load failed: HTTP "+resp.status);
                const {dashboard} = await resp.json();
                return dashboard;
              }),
              distApp.fetch('/ApiBinding/scw/instance/v1/zones/fr-par-2/servers').then(async resp => {
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
                  category: 'app.dist.Browsable',
                  data: this.serverUrl(server),
                });
              },
              async handleIpChange(server, wantsIp) {
                if (server.public_ip && wantsIp == false) {
                  const resp = await distApp.fetch('/ApiBinding/scw/instance/v1/zones/fr-par-2/ips/'+server.public_ip.id, {method: 'DELETE'});
                  if (!resp.ok) throw new Error("delete IP failed: HTTP "+resp.status);
                  console.log('IP deleted!');
                } else if (!server.public_ip && wantsIp == true) {
                  const resp = await distApp.fetch('/ApiBinding/scw/instance/v1/zones/fr-par-2/ips', {
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
                const resp = await distApp.fetch('/ApiBinding/scw/instance/v1/zones/fr-par-2/servers/'+serverId+'/action', {
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
      type: 'documentation',
    }, {
      url: 'https://developers.scaleway.com/static/1c8e013ff393a35657718995e10d1469/scaleway.instance.v1.Api.yml',
      type: 'origin',
    }],
  },
  spec: {
    type: 'openapi',
    crossOriginResourceSharing: 'restricted',
    definition: stripIndent`
      # generated by: openapi-subset.ts "https://developers.scaleway.com/static/1c8e013ff393a35657718995e10d1469/scaleway.instance.v1.Api.yml" "specific-paths" "/instance/v1/zones/{zone}/dashboard" "/instance/v1/zones/{zone}/ips" "/instance/v1/zones/{zone}/ips/{ip}#delete" "/instance/v1/zones/{zone}/servers#get" "/instance/v1/zones/{zone}/servers/{server_id}/action#post"
      openapi: 3.0.0
      info:
        title: Instance API
        description: null
        version: v1
      servers:
        - url: 'https://api.scaleway.com'
      tags:
        - name: Servers
          description: >-
            Server types are denomination of the different instances we provide.
            Scaleway offers **Virtual Cloud** and **dedicated GPU** instances.
        - name: IPs
          description: >-
            A flexible IP address is an IP address which you hold independently of any
            server. You can attach it to any of your servers and do live migration of
            the IP address between your servers.
      paths:
        '/instance/v1/zones/{zone}/dashboard':
          get:
            operationId: GetDashboard
            parameters: [{in: path, name: zone, description: The zone you want to target, required: true, schema: {type: string, description: The zone you want to target, enum: [fr-par-1, fr-par-2, fr-par-3, nl-ams-1, nl-ams-2, pl-waw-1]}}, {in: query, name: organization, schema: {$ref: '#/components/schemas/google.protobuf.StringValue'}}, {in: query, name: project, schema: {$ref: '#/components/schemas/google.protobuf.StringValue'}}]
            responses: {'200': {description: '', content: {application/json: {schema: {$ref: '#/components/schemas/scaleway.instance.v1.GetDashboardResponse'}}}}}
            security: [{scaleway: []}]
        '/instance/v1/zones/{zone}/ips':
          get:
            tags: [IPs]
            operationId: ListIps
            summary: List all flexible IPs
            parameters: [{in: path, name: zone, description: The zone you want to target, required: true, schema: {type: string, description: The zone you want to target, enum: [fr-par-1, fr-par-2, fr-par-3, nl-ams-1, nl-ams-2, pl-waw-1]}}, {in: query, name: project, description: The project ID the IPs are reserved in, schema: {type: string, description: The project ID the IPs are reserved in, nullable: true}}, {in: query, name: organization, description: The organization ID the IPs are reserved in, schema: {type: string, description: The organization ID the IPs are reserved in, nullable: true}}, {in: query, name: tags, description: 'Filter IPs with these exact tags (to filter with several tags, use commas to separate them)', schema: {type: string, description: 'Filter IPs with these exact tags (to filter with several tags, use commas to separate them)', nullable: true}}, {in: query, name: name, description: Filter on the IP address (Works as a LIKE operation on the IP address), schema: {type: string, description: Filter on the IP address (Works as a LIKE operation on the IP address), nullable: true}}, {in: query, name: per_page, description: A positive integer lower or equal to 100 to select the number of items to return, schema: {type: number, description: A positive integer lower or equal to 100 to select the number of items to return, nullable: true, default: '50'}}, {in: query, name: page, description: A positive integer to choose the page to return, schema: {type: number, description: A positive integer to choose the page to return, default: 1}}]
            responses: {'200': {description: '', content: {application/json: {schema: {$ref: '#/components/schemas/scaleway.instance.v1.ListIpsResponse'}}}}}
            security: [{scaleway: []}]
          post:
            tags: [IPs]
            operationId: CreateIp
            summary: Reserve a flexible IP
            parameters: [{in: path, name: zone, description: The zone you want to target, required: true, schema: {type: string, description: The zone you want to target, enum: [fr-par-1, fr-par-2, fr-par-3, nl-ams-1, nl-ams-2, pl-waw-1]}}]
            responses: {'201': {description: '', content: {application/json: {schema: {$ref: '#/components/schemas/scaleway.instance.v1.CreateIpResponse'}}}}}
            requestBody: {required: true, content: {application/json: {schema: {type: object, properties: {organization: {type: string, description: The organization ID the IP is reserved in, deprecated: true, x-one-of: ProjectIdentifier}, project: {type: string, description: The project ID the IP is reserved in, x-one-of: ProjectIdentifier}, tags: {type: array, description: The tags of the IP, items: {type: string}}, server: {type: string, description: UUID of the server you want to attach the IP to, nullable: true}}, x-properties-order: [organization, project, tags, server]}}}}
            security: [{scaleway: []}]
        '/instance/v1/zones/{zone}/ips/{ip}':
          delete:
            tags: [IPs]
            operationId: DeleteIp
            summary: Delete a flexible IP
            description: Delete the IP with the given ID.
            parameters: [{in: path, name: zone, description: The zone you want to target, required: true, schema: {type: string, description: The zone you want to target, enum: [fr-par-1, fr-par-2, fr-par-3, nl-ams-1, nl-ams-2, pl-waw-1]}}, {in: path, name: ip, description: The ID or the address of the IP to delete, required: true, schema: {type: string, description: The ID or the address of the IP to delete}}]
            responses: {'204': {description: ''}}
            security: [{scaleway: []}]
        '/instance/v1/zones/{zone}/servers':
          get:
            tags: [Servers]
            operationId: ListServers
            summary: List all servers
            parameters: [{in: path, name: zone, description: The zone you want to target, required: true, schema: {type: string, description: The zone you want to target, enum: [fr-par-1, fr-par-2, fr-par-3, nl-ams-1, nl-ams-2, pl-waw-1]}}, {in: query, name: per_page, description: A positive integer lower or equal to 100 to select the number of items to return, schema: {type: number, description: A positive integer lower or equal to 100 to select the number of items to return, nullable: true, default: '50'}}, {in: query, name: page, description: A positive integer to choose the page to return, schema: {type: number, description: A positive integer to choose the page to return, default: 1}}, {in: query, name: organization, description: List only servers of this organization ID, schema: {type: string, description: List only servers of this organization ID, nullable: true}}, {in: query, name: project, description: List only servers of this project ID, schema: {type: string, description: List only servers of this project ID, nullable: true}}, {in: query, name: name, description: Filter servers by name (for eg. "server1" will return "server100" and "server1" but not "foo"), schema: {type: string, description: Filter servers by name (for eg. "server1" will return "server100" and "server1" but not "foo"), nullable: true}}, {in: query, name: private_ip, description: List servers by private_ip (IP address), schema: {type: string, description: List servers by private_ip (IP address), example: 1.2.3.4, nullable: true}}, {in: query, name: without_ip, description: List servers that are not attached to a public IP, schema: {type: boolean, description: List servers that are not attached to a public IP, nullable: true}}, {in: query, name: commercial_type, description: List servers of this commercial type, schema: {type: string, description: List servers of this commercial type, nullable: true}}, {in: query, name: state, description: List servers in this state, schema: {type: string, description: List servers in this state, enum: [running, stopped, stopped in place, starting, stopping, locked], default: running}}, {in: query, name: tags, description: 'List servers with these exact tags (to filter with several tags, use commas to separate them)', schema: {type: string, description: 'List servers with these exact tags (to filter with several tags, use commas to separate them)', nullable: true}}, {in: query, name: private_network, description: List servers in this Private Network, schema: {type: string, description: List servers in this Private Network, nullable: true}}, {in: query, name: order, description: Define the order of the returned servers, schema: {type: string, description: Define the order of the returned servers, enum: [creation_date_desc, creation_date_asc, modification_date_desc, modification_date_asc], default: creation_date_desc}}]
            responses: {'200': {description: '', content: {application/json: {schema: {$ref: '#/components/schemas/scaleway.instance.v1.ListServersResponse'}}}}}
            security: [{scaleway: []}]
        '/instance/v1/zones/{zone}/servers/{server_id}/action':
          post:
            tags: [Servers]
            operationId: ServerAction
            summary: Perform action
            description: 'Perform power related actions on a server. Be wary that when terminating a server, all the attached volumes (local *and* block storage) are deleted. So, if you want to keep your local volumes, you must use the \`archive\` action instead of \`terminate\`. And if you want to keep block-storage volumes, **you must** detach it beforehand you issue the \`terminate\` call.  For more information, read the [Volumes](#volumes-7e8a39) documentation.'
            parameters: [{in: path, name: zone, description: The zone you want to target, required: true, schema: {type: string, description: The zone you want to target, enum: [fr-par-1, fr-par-2, fr-par-3, nl-ams-1, nl-ams-2, pl-waw-1]}}, {in: path, name: server_id, description: UUID of the server, required: true, schema: {type: string, description: UUID of the server}}]
            responses: {'200': {description: '', content: {application/json: {schema: {$ref: '#/components/schemas/scaleway.instance.v1.ServerActionResponse'}}}}}
            requestBody: {required: true, content: {application/json: {schema: {type: object, properties: {action: {type: string, description: The action to perform on the server, enum: [poweron, backup, stop_in_place, poweroff, terminate, reboot], default: poweron}, name: {type: string, description: "The name of the backup you want to create.\\nThis field should only be specified when performing a backup action.\\n", nullable: true}, volumes: {type: object, description: "For each volume UUID, the snapshot parameters of the volume.\\nThis field should only be specified when performing a backup action.\\n", properties: {<volumeKey>: {$ref: '#/components/schemas/scaleway.instance.v1.ServerActionRequest.VolumeBackupTemplate'}}, additionalProperties: true}}, x-properties-order: [action, name, volumes]}}}}
            security: [{scaleway: []}]
      components:
        schemas:
          google.protobuf.StringValue:
            type: string
            nullable: true
          scaleway.instance.v1.Arch:
            type: string
            enum: [x86_64, arm]
            default: x86_64
          scaleway.instance.v1.Bootscript:
            type: object
            properties: {bootcmdargs: {type: string, description: The bootscript arguments}, default: {type: boolean, description: Dispmay if the bootscript is the default bootscript if no other boot option is configured}, dtb: {type: string, description: Provide information regarding a Device Tree Binary (dtb) for use with C1 servers}, id: {type: string, description: The bootscript ID}, initrd: {type: string, description: The initrd (initial ramdisk) configuration}, kernel: {type: string, description: The server kernel version}, organization: {type: string, description: The bootscript organization ID}, project: {type: string, description: The bootscript project ID}, public: {type: boolean, description: Provide information if the bootscript is public}, title: {type: string, description: The bootscript title}, arch: {type: string, description: The bootscript arch, enum: [x86_64, arm], default: x86_64}, zone: {type: string, description: The zone in which is the bootscript}}
            x-properties-order: [bootcmdargs, default, dtb, id, initrd, kernel, organization, project, public, title, arch, zone]
          scaleway.instance.v1.CreateIpResponse:
            type: object
            properties: {ip: {$ref: '#/components/schemas/scaleway.instance.v1.Ip'}, Location: {type: string}}
            x-properties-order: [ip, Location]
          scaleway.instance.v1.Dashboard:
            type: object
            properties: {volumes_count: {type: number}, running_servers_count: {type: number}, servers_by_types: {type: object, properties: {<servers_by_typeKey>: {type: number}}, additionalProperties: true}, images_count: {type: number}, snapshots_count: {type: number}, servers_count: {type: number}, ips_count: {type: number}, security_groups_count: {type: number}, ips_unused: {type: number}, volumes_l_ssd_count: {type: number}, volumes_b_ssd_count: {type: number}, volumes_l_ssd_total_size: {type: number}, volumes_b_ssd_total_size: {type: number}, private_nics_count: {type: number}, placement_groups_count: {type: number}}
            x-properties-order: [volumes_count, running_servers_count, servers_by_types, images_count, snapshots_count, servers_count, ips_count, security_groups_count, ips_unused, volumes_l_ssd_count, volumes_b_ssd_count, volumes_l_ssd_total_size, volumes_b_ssd_total_size, private_nics_count, placement_groups_count]
          scaleway.instance.v1.GetDashboardResponse:
            type: object
            properties: {dashboard: {$ref: '#/components/schemas/scaleway.instance.v1.Dashboard'}}
            x-properties-order: [dashboard]
          scaleway.instance.v1.Image.State:
            type: string
            enum: [available, creating, error]
            default: available
          scaleway.instance.v1.Ip:
            type: object
            properties: {id: {type: string}, address: {type: string, description: (IPv4 address), example: 1.2.3.4}, reverse: {$ref: '#/components/schemas/google.protobuf.StringValue'}, server: {$ref: '#/components/schemas/scaleway.instance.v1.ServerSummary'}, organization: {type: string}, tags: {type: array, items: {type: string}}, project: {type: string}, zone: {type: string}}
            x-properties-order: [id, address, reverse, server, organization, tags, project, zone]
          scaleway.instance.v1.ListIpsResponse:
            type: object
            properties: {ips: {type: array, description: List of ips, items: {$ref: '#/components/schemas/scaleway.instance.v1.Ip'}}}
            x-properties-order: [ips]
          scaleway.instance.v1.ListServersResponse:
            type: object
            properties: {servers: {type: array, description: List of servers, items: {$ref: '#/components/schemas/scaleway.instance.v1.Server'}}}
            x-properties-order: [servers]
          scaleway.instance.v1.PrivateNIC:
            type: object
            properties: {id: {type: string, description: The private NIC unique ID}, server_id: {type: string, description: The server the private NIC is attached to}, private_network_id: {type: string, description: The private network where the private NIC is attached}, mac_address: {type: string, description: The private NIC MAC address}, state: {type: string, description: The private NIC state, enum: [available, syncing, syncing_error], default: available}}
            x-properties-order: [id, server_id, private_network_id, mac_address, state]
          scaleway.instance.v1.Server:
            type: object
            properties: {id: {type: string, description: The server unique ID}, name: {type: string, description: The server name}, organization: {type: string, description: The server organization ID}, project: {type: string, description: The server project ID}, allowed_actions: {type: array, description: Provide as list of allowed actions on the server, items: {$ref: '#/components/schemas/scaleway.instance.v1.Server.Action'}}, tags: {type: array, description: The server associated tags, items: {type: string}}, commercial_type: {type: string, description: The server commercial type (eg. GP1-M)}, creation_date: {type: string, description: The server creation date (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, dynamic_ip_required: {type: boolean, description: True if a dynamic IP is required}, enable_ipv6: {type: boolean, description: True if IPv6 is enabled}, hostname: {type: string, description: The server host name}, image: {type: object, description: Provide information on the server image, properties: {id: {type: string}, name: {type: string}, arch: {$ref: '#/components/schemas/scaleway.instance.v1.Arch'}, creation_date: {type: string, description: (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, modification_date: {type: string, description: (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, default_bootscript: {$ref: '#/components/schemas/scaleway.instance.v1.Bootscript'}, extra_volumes: {type: object, properties: {<extra_volumeKey>: {$ref: '#/components/schemas/scaleway.instance.v1.Volume'}}, additionalProperties: true}, from_server: {type: string}, organization: {type: string}, public: {type: boolean}, root_volume: {$ref: '#/components/schemas/scaleway.instance.v1.VolumeSummary'}, state: {$ref: '#/components/schemas/scaleway.instance.v1.Image.State'}, project: {type: string}, tags: {type: array, items: {type: string}}, zone: {type: string}}, x-properties-order: [id, name, arch, creation_date, modification_date, default_bootscript, extra_volumes, from_server, organization, public, root_volume, state, project, tags, zone]}, protected: {type: boolean, description: The server protection option is activated}, private_ip: {type: string, description: The server private IP address, nullable: true}, public_ip: {type: object, description: Information about the public IP, properties: {id: {type: string, description: The unique ID of the IP address}, address: {type: string, description: The server public IPv4 IP-Address (IPv4 address), example: 1.2.3.4}, dynamic: {type: boolean, description: True if the IP address is dynamic}}, x-properties-order: [id, address, dynamic]}, modification_date: {type: string, description: The server modification date (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, state: {type: string, description: The server state, enum: [running, stopped, stopped in place, starting, stopping, locked], default: running}, location: {type: object, description: The server location, properties: {cluster_id: {type: string}, hypervisor_id: {type: string}, node_id: {type: string}, platform_id: {type: string}, zone_id: {type: string}}, x-properties-order: [cluster_id, hypervisor_id, node_id, platform_id, zone_id]}, ipv6: {type: object, description: The server IPv6 address, properties: {address: {type: string, description: The server IPv6 IP-Address (IPv6 address), example: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'}, gateway: {type: string, description: The IPv6 IP-addresses gateway (IPv6 address), example: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'}, netmask: {type: string, description: The IPv6 IP-addresses CIDR netmask}}, x-properties-order: [address, gateway, netmask]}, bootscript: {type: object, description: The server bootscript, properties: {bootcmdargs: {type: string, description: The bootscript arguments}, default: {type: boolean, description: Dispmay if the bootscript is the default bootscript if no other boot option is configured}, dtb: {type: string, description: Provide information regarding a Device Tree Binary (dtb) for use with C1 servers}, id: {type: string, description: The bootscript ID}, initrd: {type: string, description: The initrd (initial ramdisk) configuration}, kernel: {type: string, description: The server kernel version}, organization: {type: string, description: The bootscript organization ID}, project: {type: string, description: The bootscript project ID}, public: {type: boolean, description: Provide information if the bootscript is public}, title: {type: string, description: The bootscript title}, arch: {type: string, description: The bootscript arch, enum: [x86_64, arm], default: x86_64}, zone: {type: string, description: The zone in which is the bootscript}}, x-properties-order: [bootcmdargs, default, dtb, id, initrd, kernel, organization, project, public, title, arch, zone]}, boot_type: {type: string, description: The server boot type, enum: [local, bootscript, rescue], default: local}, volumes: {type: object, description: The server volumes, properties: {<volumeKey>: {$ref: '#/components/schemas/scaleway.instance.v1.VolumeServer'}}, additionalProperties: true}, security_group: {type: object, description: The server security group, properties: {id: {type: string}, name: {type: string}}, x-properties-order: [id, name]}, maintenances: {type: array, description: The server planned maintenances, items: {$ref: '#/components/schemas/scaleway.instance.v1.Server.Maintenance'}}, state_detail: {type: string, description: The server state_detail}, arch: {type: string, description: The server arch, enum: [x86_64, arm], default: x86_64}, placement_group: {type: object, description: The server placement group, properties: {id: {type: string, description: The placement group unique ID}, name: {type: string, description: The placement group name}, organization: {type: string, description: The placement group organization ID}, project: {type: string, description: The placement group project ID}, tags: {type: array, description: The placement group tags, items: {type: string}}, policy_mode: {type: string, description: 'Select the failling mode when the placement cannot be respected, either optional or enforced', enum: [optional, enforced], default: optional}, policy_type: {type: string, description: 'Select the behavior of the placement group, either low_latency (group) or max_availability (spread)', enum: [max_availability, low_latency], default: max_availability}, policy_respected: {type: boolean, description: 'Returns true if the policy is respected, false otherwise'}, zone: {type: string, description: The zone in which is the placement group}}, x-properties-order: [id, name, organization, project, tags, policy_mode, policy_type, policy_respected, zone]}, private_nics: {type: array, description: The server private NICs, items: {$ref: '#/components/schemas/scaleway.instance.v1.PrivateNIC'}}, zone: {type: string, description: The zone in which is the server}}
            x-properties-order: [id, name, organization, project, allowed_actions, tags, commercial_type, creation_date, dynamic_ip_required, enable_ipv6, hostname, image, protected, private_ip, public_ip, modification_date, state, location, ipv6, bootscript, boot_type, volumes, security_group, maintenances, state_detail, arch, placement_group, private_nics, zone]
          scaleway.instance.v1.Server.Action:
            type: string
            enum: [poweron, backup, stop_in_place, poweroff, terminate, reboot]
            default: poweron
          scaleway.instance.v1.Server.Maintenance:
            type: object
          scaleway.instance.v1.ServerActionRequest.VolumeBackupTemplate:
            type: object
            properties: {volume_type: {type: string, description: "Overrides the volume_type of the snapshot for this volume.\\nIf omitted, the volume type of the original volume will be used.\\n", enum: [unknown_volume_type, l_ssd, b_ssd, unified], default: unknown_volume_type}}
            x-properties-order: [volume_type]
          scaleway.instance.v1.ServerActionResponse:
            type: object
            properties: {task: {$ref: '#/components/schemas/scaleway.instance.v1.Task'}}
            x-properties-order: [task]
          scaleway.instance.v1.ServerSummary:
            type: object
            properties: {id: {type: string}, name: {type: string}}
            x-properties-order: [id, name]
          scaleway.instance.v1.Task:
            type: object
            properties: {id: {type: string, description: The unique ID of the task}, description: {type: string, description: The description of the task}, progress: {type: number, description: The progress of the task in percent}, started_at: {type: string, description: The task start date (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, terminated_at: {type: string, description: The task end date (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, status: {type: string, description: The task status, enum: [pending, started, success, failure, retry], default: pending}, href_from: {type: string}, href_result: {type: string}, zone: {type: string, description: The zone in which is the task}}
            x-properties-order: [id, description, progress, started_at, terminated_at, status, href_from, href_result, zone]
          scaleway.instance.v1.Volume:
            type: object
            properties: {id: {type: string, description: The volume unique ID}, name: {type: string, description: The volume name}, export_uri: {type: string, description: Show the volume NBD export URI, deprecated: true}, size: {type: number, description: The volume disk size (in bytes)}, volume_type: {type: string, description: The volume type, enum: [l_ssd, b_ssd, unified], default: l_ssd}, creation_date: {type: string, description: The volume creation date (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, modification_date: {type: string, description: The volume modification date (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, organization: {type: string, description: The volume organization ID}, project: {type: string, description: The volume project ID}, tags: {type: array, description: The volume tags, items: {type: string}}, server: {type: object, description: The server attached to the volume, properties: {id: {type: string}, name: {type: string}}, x-properties-order: [id, name]}, state: {type: string, description: The volume state, enum: [available, snapshotting, error, fetching, resizing, saving, hotsyncing], default: available}, zone: {type: string, description: The zone in which is the volume}}
            x-properties-order: [id, name, export_uri, size, volume_type, creation_date, modification_date, organization, project, tags, server, state, zone]
          scaleway.instance.v1.Volume.VolumeType:
            type: string
            enum: [l_ssd, b_ssd, unified]
            default: l_ssd
          scaleway.instance.v1.VolumeServer:
            type: object
            properties: {id: {type: string}, name: {type: string}, export_uri: {type: string}, organization: {type: string}, server: {$ref: '#/components/schemas/scaleway.instance.v1.ServerSummary'}, size: {type: number, description: (in bytes)}, volume_type: {$ref: '#/components/schemas/scaleway.instance.v1.VolumeServer.VolumeType'}, creation_date: {type: string, description: (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, modification_date: {type: string, description: (RFC 3339 format), format: date-time, example: '2022-03-22T12:34:56.123456Z'}, state: {$ref: '#/components/schemas/scaleway.instance.v1.VolumeServer.State'}, project: {type: string}, boot: {type: boolean}, zone: {type: string}}
            x-properties-order: [id, name, export_uri, organization, server, size, volume_type, creation_date, modification_date, state, project, boot, zone]
          scaleway.instance.v1.VolumeServer.State:
            type: string
            enum: [available, snapshotting, error, fetching, resizing, saving, hotsyncing]
            default: available
          scaleway.instance.v1.VolumeServer.VolumeType:
            type: string
            enum: [l_ssd, b_ssd]
            default: l_ssd
          scaleway.instance.v1.VolumeSummary:
            type: object
            properties: {id: {type: string}, name: {type: string}, size: {type: number, description: (in bytes)}, volume_type: {$ref: '#/components/schemas/scaleway.instance.v1.Volume.VolumeType'}}
            x-properties-order: [id, name, size, volume_type]
        securitySchemes:
          scaleway:
            in: header
            name: X-Auth-Token
            type: apiKey
    `,
  },
});
