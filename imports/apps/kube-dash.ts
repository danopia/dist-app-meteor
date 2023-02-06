import type { Entity } from "/imports/entities";
export const AppCatalog: Entity[] = [
  {"apiVersion":"manifest.dist.app/v1alpha1","kind":"Application","metadata":{"name":"app","title":"Kube Dash","description":"A playground for Kubernetes interactions","tags":["poc"]},"spec":{"icon":{"type":"svg","svg":{"textData":"<svg version=\"1.1\" viewBox=\"0 0 723 723\" xmlns=\"http://www.w3.org/2000/svg\">\n <g transform=\"translate(-6.3 -175)\">\n  <path d=\"m368 175c-11 .00099-20 10-20 22 2e-5.19.039.37.043.56-.016 1.7-.098 3.7-.043 5.2.27 7.1 1.8 13 2.8 19 1.7 14 3.1 26 2.2 37-.85 4.1-3.9 7.8-6.6 10l-.47 8.5c-12 1-24 2.8-37 5.6-52 12-98 39-132 75-2.2-1.5-6.1-4.3-7.3-5.2-3.6.49-7.2 1.6-12-1.2-9-6.1-17-14-27-25-4.6-4.8-7.9-9.4-13-14-1.2-1.1-3.1-2.5-4.5-3.6-4.2-3.4-9.2-5.1-14-5.3-6.2-.21-12 2.2-16 7.1-7 8.7-4.7 22 5 30 .098.078.2.14.3.22 1.3 1.1 3 2.5 4.2 3.4 5.8 4.2 11 6.4 17 9.8 12 7.5 22 14 30 21 3.1 3.3 3.6 9.1 4.1 12l6.5 5.8c-35 52-51 117-41 182l-8.5 2.5c-2.2 2.9-5.4 7.4-8.7 8.8-10 3.3-22 4.5-36 6-6.6.55-12 .22-19 1.6-1.5.29-3.7.85-5.4 1.3-.059.012-.11.03-.17.043-.092.021-.21.066-.3.086-12 2.9-20 14-17 25 2.5 11 14 17 26 15 .086-.02.21-.023.3-.043.14-.031.25-.096.39-.13 1.7-.37 3.8-.77 5.2-1.2 6.9-1.8 12-4.6 18-6.9 13-4.8 24-8.8 35-10 4.5-.35 9.2 2.8 12 4.1l8.8-1.5c20 63 63 114 116 145l-3.7 8.8c1.3 3.4 2.8 8 1.8 11-3.9 10-11 21-18 33-3.7 5.5-7.5 9.8-11 16-.8 1.5-1.8 3.8-2.6 5.4-5.2 11-1.4 24 8.6 29 10 4.8 22-.26 28-11 .008-.016.035-.027.043-.043.006-.012-.006-.031 0-.043.77-1.6 1.9-3.7 2.5-5.1 2.9-6.6 3.8-12 5.8-19 5.3-13 8.3-28 16-36 2-2.4 5.3-3.3 8.7-4.2l4.6-8.3c47 18 99 23 152 11 12-2.7 23-6.2 35-10 1.3 2.3 3.7 6.7 4.3 7.8 3.5 1.1 7.2 1.7 10 6.3 5.5 9.4 9.3 21 14 34 2 6.3 3 12 5.9 19 .65 1.5 1.7 3.6 2.5 5.2 5.4 11 18 16 28 11 10-4.8 14-18 8.6-29-.77-1.6-1.8-3.9-2.6-5.4-3.3-6.3-7.1-11-11-16-7.6-12-14-22-18-32-1.6-5.2.28-8.5 1.6-12-.76-.88-2.4-5.8-3.4-8.2 56-33 97-86 116-146 2.6.41 7.2 1.2 8.6 1.5 3-2 5.8-4.6 11-4.2 11 1.6 22 5.6 35 10 6.2 2.4 11 5.1 18 7 1.5.39 3.6.76 5.2 1.1.13.033.25.099.39.13.09.02.22.023.3.043 12 2.6 24-4 26-15 2.5-11-5.2-22-17-25-1.7-.39-4.2-1.1-5.9-1.4-7-1.3-13-1-19-1.6-14-1.5-26-2.7-36-6-4.2-1.6-7.3-6.7-8.7-8.8l-8.2-2.4c4.2-31 3.1-62-4.2-94-7.4-32-20-62-38-87 2.1-1.9 6-5.4 7.2-6.4.33-3.6.046-7.4 3.8-11 7.9-7.5 18-14 30-21 5.7-3.4 11-5.5 17-9.8 1.3-.96 3.1-2.5 4.4-3.6 9.7-7.7 12-21 5-30-7-8.7-20-9.5-30-1.8-1.4 1.1-3.2 2.5-4.5 3.6-5.4 4.7-8.8 9.3-13 14-10 10-18 19-27 25-3.9 2.3-9.7 1.5-12 1.3l-7.7 5.5c-44-46-103-75-168-81-.18-2.7-.41-7.6-.47-9-2.6-2.5-5.8-4.7-6.6-10-.88-11 .59-23 2.3-37 .94-6.6 2.5-12 2.8-19 .06-1.6-.037-4-.043-5.7-.00098-12-9-22-20-22zm-25 157-6 106-.43.22c-.4 9.5-8.2 17-18 17-3.9 0-7.5-1.3-10-3.4l-.17.086-87-62c27-26 61-46 100-55 7.2-1.6 14-2.8 22-3.7zm51 0c46 5.7 88 26 121 58l-86 61-.3-.13c-7.7 5.6-18 4.2-24-3.3-2.4-3.1-3.7-6.7-3.9-10l-.086-.043zm-204 98 79 71-.086.43c7.2 6.2 8.2 17 2.2 25-2.4 3.1-5.7 5.1-9.2 6.1l-.086.35-102 29c-5.2-47 6-93 30-132zm356 .043c12 19 21 40 26 64 5.2 23 6.6 46 4.4 68l-102-29-.086-.43c-9.2-2.5-15-12-13-21 .87-3.8 2.9-7.1 5.7-9.5l-.043-.22 79-71zm-194 76h32l20 25-7.2 32-29 14-29-14-7.2-32zm104 86c1.4-.07 2.8.055 4.1.3l.17-.22 105 18c-15 43-45 81-84 106l-41-99 .13-.17c-3.7-8.7.003-19 8.6-23 2.2-1.1 4.5-1.7 6.8-1.8zm-177 .43c8 .11 15 5.7 17 14 .87 3.8.45 7.6-.99 11l.3.39-40 98c-38-24-68-61-84-105l104-18 .17.22c1.2-.21 2.3-.32 3.5-.3zm88 43c2.8-.1 5.6.47 8.3 1.8 3.5 1.7 6.3 4.4 8 7.6h.39l51 93c-6.7 2.2-14 4.1-21 5.7-39 8.9-78 6.2-114-5.9l51-93h.086c3.1-5.8 8.9-9.2 15-9.4z\" fill=\"#fff\" />\n </g>\n</svg>\n","backgroundColor":"#326ce5"}}}},
  {"apiVersion":"manifest.dist.app/v1alpha1","kind":"Activity","metadata":{"name":"main","title":"Kube Dash","ownerReferences":[{"apiVersion":"manifest.dist.app/v1alpha1","kind":"Application","name":"app"}]},"spec":{"intentFilters":[{"action":"app.dist.Main","category":"app.dist.Launcher"}],"implementation":{"type":"iframe","sandboxing":["allow-scripts"],"securityPolicy":{"scriptSrc":["https://unpkg.com","https://uber.danopia.net","data:"],"connectSrc":["https://dist-app-backend-kubernetes.devmode.cloud","wss://dist-app-backend-kubernetes.devmode.cloud"]},"source":{"type":"piecemeal","htmlLang":"en","metaCharset":"utf-8","headTitle":"dist.app instance","inlineScript":"import { createApp, reactive, watchEffect, ref, computed } from \"vue\";\nimport { autoResult, subscribe } from \"meteor-vue3\";\nconst distApp = await DistApp.connect();\n\"useVueState\";\nconst ddp = DDP.connect('https://dist-app-backend-kubernetes.devmode.cloud/');\nMeteor.subscribe = ddp.subscribe.bind(ddp);\nconst coll = new Mongo.Collection('resources', ddp);\nconst NodeTable = {\n    setup () {\n        const { ready  } = subscribe('/resources/watch', {\n            apiVersion: 'v1',\n            kind: 'Node'\n        });\n        return {\n            ready,\n            nodes: autoResult(()=>coll.find({\n                    kind: 'Node',\n                    apiVersion: 'v1'\n                }))\n        };\n    },\n    methods: {\n        nodeRoles (map) {\n            return Array.from(map.keys()).filter((x)=>x.startsWith('node-role.kubernetes.io/')).map((x)=>x.split('/')[1]).sort().join(', ');\n        },\n        parseMem (str) {\n            return `${Math.round(parseInt(str) / 1024 / 1024 * 10) / 10} Gi`;\n        }\n    },\n    template: `\n    <h2>Nodes!</h2>\n    <progress v-if=\"!ready\" indeterminate />\n    <table>\n      <thead>\n        <th>Name</th>\n        <th>Roles</th>\n        <th>CPUs</th>\n        <th>Memory</th>\n        <th>OS</th>\n      </thead>\n      <tbody>\n        <tr v-for=\"node of nodes\">\n          <td>{{node.metadata.name}}</td>\n          <td>{{nodeRoles(node.metadata.labels)}}</td>\n          <td>{{node.status.capacity.cpu}}</td>\n          <td>{{parseMem(node.status.capacity.memory)}}</td>\n          <td>{{node.status.nodeInfo.osImage}}</td>\n        </tr>\n      </tbody>\n    </table>\n  `\n};\nconst BuildHistoryList = {\n    props: {\n        configMetadata: Object\n    },\n    data () {\n        return {\n            configs: autoResult(()=>coll.find({\n                    'apiVersion': 'build.danopia.net/v1',\n                    'kind': 'Build',\n                    'metadata.namespace': this.configMetadata.namespace,\n                    'metadata.ownerReferences': {\n                        $elemMatch: {\n                            'kind': 'BuildConfig',\n                            'name': this.configMetadata.name\n                        }\n                    }\n                }, {\n                    sort: {\n                        'metadata.creationTimestamp': -1\n                    },\n                    limit: 5\n                }))\n        };\n    },\n    methods: {\n        buildNum (build) {\n            var _build_metadata_annotations_get;\n            return (_build_metadata_annotations_get = build.metadata.annotations.get('k8s.danopia.net.io/build.number')) !== null && _build_metadata_annotations_get !== void 0 ? _build_metadata_annotations_get : build.metadata.annotations.get('build.danopia.net/number');\n        },\n        timeAgo (dateS) {\n            const daysAgo = (new Date().valueOf() - new Date(dateS).valueOf()) / 1000 / 60 / 60 / 24;\n            return `${Math.round(daysAgo)}d`;\n        },\n        duration (nanos) {\n            if (!nanos) return '-';\n            const seconds = Math.floor(nanos / 1000000000);\n            const minutes = Math.floor(seconds / 60);\n            const justSecs = seconds - minutes * 60;\n            return `${minutes}m${justSecs}s`;\n        },\n        async triggerBuild () {\n            await ddp.callAsync('/resources/json-merge-patch', {\n                'apiVersion': 'build.danopia.net/v1',\n                'kind': 'BuildConfig',\n                'metadata': {\n                    'namespace': this.configMetadata.namespace,\n                    'name': this.configMetadata.name,\n                    'labels': {\n                        'build.danopia.net/trigger-now': 'true'\n                    }\n                }\n            });\n        },\n        phaseOf (build) {\n            if (!build.status) return 'Unknown';\n            return build.status.phase;\n        },\n        isABuildPending () {\n            var _this_configMetadata_labels;\n            return ((_this_configMetadata_labels = this.configMetadata.labels) === null || _this_configMetadata_labels === void 0 ? void 0 : _this_configMetadata_labels.get('build.danopia.net/trigger-now')) == 'true';\n        }\n    },\n    template: `\n    <div class=\"build-card-row\">\n      <div class=\"build-card card-trigger\">\n        <button @click=\"triggerBuild()\">\n          <svg fill=\"#000000\" height=\"2em\" width=\"2em\" version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 60 60\" xml:space=\"preserve\">\n            <g>\n              <path d=\"M45.563,29.174l-22-15c-0.307-0.208-0.703-0.231-1.031-0.058C22.205,14.289,22,14.629,22,15v30 c0,0.371,0.205,0.711,0.533,0.884C22.679,45.962,22.84,46,23,46c0.197,0,0.394-0.059,0.563-0.174l22-15 C45.836,30.64,46,30.331,46,30S45.836,29.36,45.563,29.174z M24,43.107V16.893L43.225,30L24,43.107z\"/>\n              <path d=\"M30,0C13.458,0,0,13.458,0,30s13.458,30,30,30s30-13.458,30-30S46.542,0,30,0z M30,58C14.561,58,2,45.439,2,30 S14.561,2,30,2s28,12.561,28,28S45.439,58,30,58z\"/>\n            </g>\n          </svg>\n        </button>\n      </div>\n      <div class=\"build-card card-pending\" v-if=\"isABuildPending()\">\n        Trigger pending...\n      </div>\n      <div :class=\"'build-card card-build status-'+phaseOf(build)\" v-for=\"build of this.configs\">\n        <div>#{{buildNum(build)}} <span class=\"phase\">{{phaseOf(build)}}</span></div>\n        <div>{{timeAgo(build.status?.startTimestamp)}} ago</div>\n        <div>Took {{duration(build.status?.duration)}}</div>\n      </div>\n    </div>\n  `\n};\nconst BuildConfigTable = {\n    data () {\n        const configSpec = {\n            apiVersion: 'build.danopia.net/v1',\n            kind: 'BuildConfig'\n        };\n        const buildSpec = {\n            apiVersion: 'build.danopia.net/v1',\n            kind: 'Build'\n        };\n        const { ready: ready1  } = subscribe('/resources/watch', configSpec);\n        const { ready: ready2  } = subscribe('/resources/watch', buildSpec);\n        return {\n            ready: ready1 && ready2,\n            configs: autoResult(()=>coll.find(configSpec))\n        };\n    },\n    components: {\n        BuildHistoryList\n    },\n    template: `\n    <h2>Build Configs</h2>\n    <progress v-if=\"!ready\" indeterminate />\n    <table>\n      <thead>\n        <th>Name</th>\n        <th>Source</th>\n        <th>Strategy</th>\n        <th>Triggers</th>\n        <th>Last build</th>\n      </thead>\n      <tbody>\n        <template v-for=\"node of configs\">\n          <tr>\n            <td>{{node.metadata.namespace}}/{{node.metadata.name}}</td>\n            <td>{{node.spec.source.type}}: {{node.spec.source.git.uri}}</td>\n            <td>{{node.spec.strategy.type}}</td>\n            <td>{{node.spec.triggers ? 'Yes' : 'No'}}</td>\n            <td>{{node.status.lastVersion}}</td>\n          </tr>\n          <tr>\n            <td colspan=\"5\">\n              <BuildHistoryList :config-metadata=\"node.metadata\" />\n            </td>\n          </tr>\n        </template>\n      </tbody>\n    </table>\n  `\n};\nconst LeaseTable = {\n    data () {\n        const { ready  } = subscribe('/resources/watch', {\n            apiVersion: 'coordination.k8s.io/v1',\n            kind: 'Lease'\n        });\n        return {\n            ready,\n            leases: autoResult(()=>coll.find({\n                    kind: 'Lease',\n                    apiVersion: 'coordination.k8s.io/v1'\n                })),\n            intervals: {},\n            lastRenews: {},\n            justRenewed: {}\n        };\n    },\n    watch: {\n        leases (leases) {\n            this.justRenewed = {};\n            for (const lease of leases){\n                const lastRenew = this.lastRenews[lease.metadata.uid];\n                const thisRenew = new Date(lease.spec.renewTime);\n                if (lastRenew && lastRenew.valueOf() === thisRenew.valueOf()) continue;\n                this.intervals[lease.metadata.uid] = Math.round((thisRenew - lastRenew) / 1000);\n                this.lastRenews[lease.metadata.uid] = thisRenew;\n                // strobe the CSS class:\n                this.justRenewed[lease.metadata.uid] = true;\n                setTimeout(()=>{\n                    this.justRenewed[lease.metadata.uid] = false;\n                }, 100);\n            }\n        }\n    },\n    methods: {\n        timeFor (date) {\n            return new Date(date).toLocaleTimeString();\n        },\n        healthOf (lease) {\n            const interval = this.intervals[lease.metadata.uid];\n            if (!interval) return 'unknown';\n            const lastRenew = new Date(lease.spec.renewTime);\n            const lateDate = lastRenew.valueOf() + interval * 1000 * 1.2;\n            const expireDate = lastRenew.valueOf() + lease.spec.leaseDurationSeconds * 1000;\n            const nowDate = Date.now();\n            if (nowDate > expireDate) return 'expired';\n            if (nowDate > lateDate) return 'late';\n            return 'current';\n        }\n    },\n    template: `\n    <h2>All Kubernetes Leases</h2>\n    <progress v-if=\"!ready\" indeterminate />\n    <table>\n      <thead>\n        <th></th>\n        <th>Lease</th>\n        <th>Renewed</th>\n        <th>Interval</th>\n        <th>Lifespan</th>\n        <th>Holder</th>\n      </thead>\n      <tbody>\n        <tr v-for=\"lease of leases\">\n          <td><span :class=\"'icon icon-'+healthOf(lease)\" /></td>\n          <td>{{lease.metadata.namespace}}/{{lease.metadata.name}}</td>\n          <td :class=\"justRenewed[lease.metadata.uid] ? 'just-renewed' : 'idle'\">\n            {{timeFor(lease.spec.renewTime)}}\n          </td>\n          <td style=\"text-align: right;\">\n            <template v-if=\"intervals[lease.metadata.uid]\">\n              {{intervals[lease.metadata.uid]}}\n              <span style=\"color: rgba(127,127,127,1);\">s</span>\n            </template>\n          </td>\n          <td style=\"text-align: right;\">\n            {{lease.spec.leaseDurationSeconds}}\n            <span style=\"color: rgba(127,127,127,1);\">s</span>\n          </td>\n          <td>\n            <div style=\"width: 5em;\">\n              <div style=\"text-align: center;text-overflow: clip;overflow: hidden;white-space: nowrap;\">{{ lease.spec.holderIdentity }}</div>\n            </div>\n          </td>\n        </tr>\n      </tbody>\n    </table>\n  `\n};\nconst BlockDeviceAttrTable = {\n    props: {\n        drives: []\n    },\n    computed: {\n        driveColumns () {\n            const drives = this.drives;\n            let curLeader = null;\n            return drives.map((x)=>{\n                const thisCol = {\n                    uid: x.metadata.uid,\n                    nodeName: x.spec.nodeName,\n                    devicePath: x.spec.devicePath,\n                    nodeColumns: 0\n                };\n                if ((curLeader === null || curLeader === void 0 ? void 0 : curLeader.nodeName) === thisCol.nodeName) {\n                    curLeader.nodeColumns++;\n                } else {\n                    thisCol.nodeColumns = 1;\n                    curLeader = thisCol;\n                }\n                return thisCol;\n            });\n        },\n        nodeColumns () {\n            return this.driveColumns.filter((x)=>x.nodeColumns > 0);\n        },\n        allAttrs () {\n            let _a, _b, _c, _d;\n            const drives = this.drives;\n            const attrs = new Set();\n            for (const rep of drives){\n                for (const attr of (_c = (_b = (_a = rep.status) === null || _a === void 0 ? void 0 : _a.smartReport) === null || _b === void 0 ? void 0 : _b.attributes) !== null && _c !== void 0 ? _c : []){\n                    attrs.add((_d = attr.id) !== null && _d !== void 0 ? _d : -1);\n                }\n            }\n            return Array.from(attrs).sort((a, b)=>a - b).map((attrId)=>{\n                const matches = drives.map((r)=>{\n                    let _a, _b, _c;\n                    return (_c = (_b = (_a = r.status) === null || _a === void 0 ? void 0 : _a.smartReport) === null || _b === void 0 ? void 0 : _b.attributes) === null || _c === void 0 ? void 0 : _c.find((a)=>a.id === attrId);\n                }).map((r)=>r ? Object.assign(Object.assign({}, r), fullValue(r)) : r);\n                return {\n                    attrId: attrId,\n                    info: matches.filter((m)=>m)[0],\n                    reports: matches.map((x)=>x ? Object.assign(Object.assign({}, x), fullValue(x)) : x)\n                };\n            });\n        }\n    },\n    methods: {\n        respace (str) {\n            return str.replace(/_/g, ' ');\n        },\n        healthAttrs (attr) {\n            if (!attr.currentHealth) return;\n            const value = Math.min(attr.currentHealth, 100);\n            const percentage = (value - attr.threshold) / (100 - attr.threshold) * 100;\n            const hsl = `${percentage}, 100%, 60%`;\n            const hsl2 = `${percentage}, 100%, 10%`;\n            return {\n                title: `${attr.currentHealth}% current, ${attr.worstHealth}% worst, ${attr.threshold}% threshold`,\n                class: 'health-cell',\n                style: {\n                    'background-image': `linear-gradient( 180deg,\n          hsla(${hsl2},1),\n          hsla(${hsl2},1) 90%,\n          rgba(0,0,0,0) 90%,\n          rgba(0,0,0,0)\n        ),\n        linear-gradient( 90deg,\n          hsla(${hsl},1),\n          hsla(${hsl},1) ${percentage}%,\n          hsla(${hsl2},1) ${percentage}%,\n          hsla(${hsl2},1)\n        )`.replace(/\\n +/g, ' ')\n                }\n            };\n        }\n    },\n    template: `\n    <table border cellpadding=4 style=\"border-spacing: 1px;\">\n      <tr>\n        <th colspan=2 rowspan=2>S.M.A.R.T. Attribute</th>\n        <th v-for=\"drive of nodeColumns\" :colspan=\"drive.nodeColumns * 2\" :key=\"drive.nodeName\">\n          {{drive.nodeName}}\n        </th>\n        <th rowspan=2>Attribute Type</th>\n      </tr>\n      <tr>\n        <th v-for=\"drive of driveColumns\" colspan=2 :key=\"drive.uid\">\n          {{drive.devicePath}}\n        </th>\n      </tr>\n      <tr v-for=\"attr in allAttrs\" :key=\"attr.attrId\">\n        <td>{{attr.attrId}}</td>\n        <td>{{respace(attr.info.name)}}</td>\n        <template v-for=\"(rep, idx) in attr.reports\" :key=\"idx\">\n          <td v-if=\"rep\" v-bind=\"healthAttrs(rep)\">{{rep.currentHealth}}</td>\n          <td v-if=\"rep\" :title=\"'Raw '+rep.name+': '+rep.rawValue\">{{rep.val}}<div class=\"minmax\" v-if=\"rep.max\"><div class=\"max\">{{rep.max}}</div><div class=\"min\">{{rep.min}}</div></div></td>\n          <td v-if=\"!rep\" colspan=2></td>\n        </template>\n        <td>{{respace(attr.info.type)}}</td>\n      </tr>\n    </table>\n  `\n};\nconst BlockDeviceTable = {\n    setup () {\n        const { ready  } = subscribe('/resources/watch', {\n            apiVersion: 'cloudydeno.github.io/v1',\n            kind: 'BlockDevice'\n        });\n        return {\n            ready,\n            allDrives: autoResult(()=>coll.find({\n                    kind: 'BlockDevice',\n                    apiVersion: 'cloudydeno.github.io/v1'\n                }))\n        };\n    },\n    computed: {\n        spinningDrives () {\n            return this.allDrives.filter((x)=>x.spec.rotationRate !== 'SSD');\n        },\n        solidDrives () {\n            return this.allDrives.filter((x)=>x.spec.rotationRate === 'SSD');\n        }\n    },\n    components: {\n        AttrTable: BlockDeviceAttrTable\n    },\n    template: `\n    <h2>S.M.A.R.T. Drive Monitoring</h2>\n    <progress v-if=\"!ready\" indeterminate />\n    <table border cellpadding=4 style=\"border-spacing: 0;\">\n      <tr>\n        <th colspan=2>Device Location</th>\n        <th>Model</th>\n        <!--th>Serial</th-->\n        <th>Capacity</th>\n        <th colspan=2>Sector sizes</th>\n        <th>RPM</th>\n        <th>Link</th>\n        <th>Form factor</th>\n        <th>S.M.A.R.T.</th>\n      </tr>\n      <tr v-for=\"drive in allDrives\" :key=\"drive.metadata.uid\">\n        <td>{{drive.spec.nodeName}}</td>\n        <td>{{drive.spec.devicePath}}</td>\n        <td>{{drive.spec.deviceModel}}</td>\n        <!--<td>{{drive.spec.serialNumber}}</td>-->\n        <td style=\"text-align: right;\" :title=\"drive.spec.userCapacity+' bytes'\">\n          {{parseFloat(drive.spec.userCapacityHuman.split(\" \")[0])}}\n          <span :class=\"'capacity-'+drive.spec.userCapacityHuman.split(' ')[1]\">{{drive.spec.userCapacityHuman.split(\" \")[1]}}</span>\n        </td>\n        <td style=\"text-align: right;\">{{drive.spec.logicalSectorSize}}</td>\n        <td style=\"text-align: right;\">{{drive.spec.physicalSectorSize}}</td>\n        <td style=\"text-align: center;\" v-if=\"drive.spec.rotationRate === 'SSD'\">&mdash;</td>\n        <td v-else>{{drive.spec.rotationRate}}</td>\n        <td>{{drive.status.sataStatus.split(',')[0]}}</td>\n        <td>{{drive.spec.formFactor}}</td>\n        <td>{{drive.status.smartReport.overallAssessment}}</td>\n        <!-- <td>{{drive.status.smartEnabled}}</td> -->\n      </tr>\n    </table>\n\n    <template v-if=\"spinningDrives.length > 0\">\n      <br/>\n      <h2>Spinning Disk Health Attributes</h2>\n      <AttrTable :drives=\"spinningDrives\" />\n    </template>\n\n    <template v-if=\"solidDrives.length > 0\">\n      <br/>\n      <h2>Solid-state Disk Health Attributes</h2>\n      <AttrTable :drives=\"solidDrives\" />\n    </template>\n  `\n};\nfunction fullValue(attr) {\n    var _attr_rawValue, _attr_name;\n    const match = (_attr_rawValue = attr.rawValue) === null || _attr_rawValue === void 0 ? void 0 : _attr_rawValue.match(/(\\d+) \\(Min\\/Max (\\d+)\\/(\\d+)\\)/);\n    if (match) return {\n        val: `${match[1]}°C`,\n        min: `${match[2]}°`,\n        max: `${match[3]}°`\n    };\n    if ((_attr_name = attr.name) === null || _attr_name === void 0 ? void 0 : _attr_name.endsWith('_Hours')) {\n        var _attr_rawValue1;\n        const hours = parseInt((_attr_rawValue1 = attr.rawValue) !== null && _attr_rawValue1 !== void 0 ? _attr_rawValue1 : '0');\n        if (hours > 24) {\n            const days = Math.round(hours / 24);\n            if (days >= 1000) {\n                return {\n                    val: `${Math.round(days / 365 * 10) / 10} years`\n                };\n            }\n            return {\n                val: `${days} days`\n            };\n        }\n        return {\n            val: `${hours} hours`\n        };\n    }\n    var _attr_rawValue2;\n    const num = parseInt((_attr_rawValue2 = attr.rawValue) !== null && _attr_rawValue2 !== void 0 ? _attr_rawValue2 : '0');\n    if (num > 2.5 * 1000000000) return {\n        val: Math.round(num / 1000000000 * 10) / 10 + ' bn'\n    };\n    if (num > 2.5 * 1000000) return {\n        val: Math.round(num / 1000000 * 10) / 10 + ' m'\n    };\n    if (num > 2.5 * 1000) return {\n        val: Math.round(num / 1000 * 10) / 10 + ' k'\n    };\n    return {\n        val: `${num}`\n    };\n}\nconst app = createApp({\n    data: await useVueState('root', {\n        currentFrame: 'home'\n    }),\n    methods: {},\n    components: {\n        NodeTable,\n        BuildConfigTable,\n        LeaseTable,\n        BlockDeviceTable\n    }\n});\napp.mount('#app');\nawait distApp.reportReady();\n\n\n//#sourceMappingURL=data:application/json;charset=utf-8;base64,IntcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcImZpbGVcIjpcInN0ZG91dFwifSI=","bodyHtml":"<div id=\"app\">\n  <div class=\"navbar\">\n    <button @click=\"currentFrame = 'nodes'\">Nodes</button>\n    <button @click=\"currentFrame = 'build-configs'\">Build Configs</button>\n    <button @click=\"currentFrame = 'leases'\">Leases</button>\n    <button @click=\"currentFrame = 'block-devices'\">Block Devices</button>\n  </div>\n  <node-table v-if=\"currentFrame == 'nodes'\"></node-table>\n  <build-config-table v-if=\"currentFrame == 'build-configs'\"></build-config-table>\n  <lease-table v-if=\"currentFrame == 'leases'\"></lease-table>\n  <block-device-table v-if=\"currentFrame == 'block-devices'\"></block-device-table>\n</div>\n","inlineStyle":"body { background: #000; color: #eee; }\n.health-cell {\n  padding: 0.2em 0.5em 0.3em;\n  text-align: center;\n  border: 0;\n}\n.minmax {\n  display: inline-block;\n  font-size: 0.7em;\n  padding-left: 1em;\n  margin: -4px 0;\n  line-height: 1;\n  vertical-align: middle;\n}\n.minmax .max { color: #ffab91; }\n.minmax .min { color: #90caf9; }\n\n.capacity-GB {\n  color: #999;\n}\n\n\n@keyframes spin1 { 100% { transform:rotate(360deg); } }\n@keyframes idle { 100% {} }\n\n.just-renewed {\n  color: #fff;\n  /* animation: spin1 1s linear 1; */\n  /* text-shadow: 5px 5px rgba(100,100,100,0.5); */\n}\n.idle {\n  color: #666;\n  transition: 1s linear color;\n  /* animation: idle 1s linear 1; */\n}\n\n.build-card-row {\n  display: flex;\n  flex-direction: row;\n  gap: 0.5em;\n}\n.card-build {\n  padding: 0.5em;\n  background-color: rgba(120,120,120,0.25);\n}\n.card-build:hover {\n  background-color: rgba(120,120,120,0.5);\n}\n.card-build.status-Failed {\n  background-color: rgba(250,120,120,0.25);\n}\n.card-build.status-Failed .phase {\n  color: #f99;\n}\n.card-build.status-Complete {\n  background-color: rgba(120,250,120,0.25);\n}\n.card-build.status-Complete .phase {\n  color: #9f9;\n}\n.card-trigger {\n  /* grid-template-areas: \"main\"; */\n  display: grid;\n}\n.card-trigger button {\n  /* grid-area: main; */\n  background: none;\n  color: #fff;\n  cursor: pointer;\n  display: grid;\n  align-items: center;\n  border: 0;\n}\n.card-trigger button:hover {\n  background-color: rgba(120,120,120,0.5);\n}\n.card-trigger button svg {\n  fill: #eee;\n}\n\ntable {\n  border-collapse: collapse;\n}\ntd {\n  padding: 0.2em 0.5em;\n}\n.icon {\n  display: block;\n  width: 0.75em;\n  height: 0.75em;\n  border-radius: 50% 50%;\n  border: 1px solid grey;\n}\n.icon-current {\n  background-color: green;\n}\n.icon-late {\n  background-color: yellow;\n}\n.icon-expired {\n  background-color: red;\n}\n","importMap":{"imports":{"vue":"https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js","meteor-vue3":"https://uber.danopia.net/dist-app-poc/meteor-vue3.js?b"}},"scriptUrls":["https://uber.danopia.net/dist-app-poc/meteor-client-bundle.js?ad"]}}}},
  {"apiVersion":"manifest.dist.app/v1alpha1","kind":"Activity","metadata":{"name":"build-list","title":"Build List","ownerReferences":[{"apiVersion":"manifest.dist.app/v1alpha1","kind":"Application","name":"app"}]},"spec":{"implementation":{"type":"iframe","sandboxing":["allow-scripts"],"securityPolicy":{"scriptSrc":["https://unpkg.com","https://uber.danopia.net","data:"],"connectSrc":["https://dist-app-backend-kubernetes.devmode.cloud","wss://dist-app-backend-kubernetes.devmode.cloud"]},"source":{"type":"piecemeal","htmlLang":"en","metaCharset":"utf-8","headTitle":"dist.app instance","inlineScript":"import { createApp, reactive, watchEffect, ref, computed } from \"vue\";\nimport { autoResult, subscribe } from \"meteor-vue3\";\nconst distApp = await DistApp.connect();\n\"useVueState\";\nconst ddp = DDP.connect('https://dist-app-backend-kubernetes.devmode.cloud/');\nMeteor.subscribe = ddp.subscribe.bind(ddp);\nconst coll = new Mongo.Collection('resources', ddp);\nconst BuildHistoryList = {\n    props: {\n        configMetadata: Object\n    },\n    data () {\n        return {\n            configs: autoResult(()=>coll.find({\n                    'apiVersion': 'build.danopia.net/v1',\n                    'kind': 'Build',\n                    'metadata.namespace': this.configMetadata.namespace,\n                    'metadata.ownerReferences': {\n                        $elemMatch: {\n                            'kind': 'BuildConfig',\n                            'name': this.configMetadata.name\n                        }\n                    }\n                }, {\n                    sort: {\n                        'metadata.creationTimestamp': -1\n                    },\n                    limit: 5\n                }))\n        };\n    },\n    methods: {\n        buildNum (build) {\n            var _build_metadata_annotations_get;\n            return (_build_metadata_annotations_get = build.metadata.annotations.get('k8s.danopia.net.io/build.number')) !== null && _build_metadata_annotations_get !== void 0 ? _build_metadata_annotations_get : build.metadata.annotations.get('build.danopia.net/number');\n        },\n        timeAgo (dateS) {\n            const daysAgo = (new Date().valueOf() - new Date(dateS).valueOf()) / 1000 / 60 / 60 / 24;\n            return `${Math.round(daysAgo)}d`;\n        },\n        duration (nanos) {\n            if (!nanos) return '-';\n            const seconds = Math.floor(nanos / 1000000000);\n            const minutes = Math.floor(seconds / 60);\n            const justSecs = seconds - minutes * 60;\n            return `${minutes}m${justSecs}s`;\n        },\n        async triggerBuild () {\n            await ddp.callAsync('/resources/json-merge-patch', {\n                'apiVersion': 'build.danopia.net/v1',\n                'kind': 'BuildConfig',\n                'metadata': {\n                    'namespace': this.configMetadata.namespace,\n                    'name': this.configMetadata.name,\n                    'labels': {\n                        'build.danopia.net/trigger-now': 'true'\n                    }\n                }\n            });\n        },\n        phaseOf (build) {\n            if (!build.status) return 'Unknown';\n            return build.status.phase;\n        },\n        isABuildPending () {\n            var _this_configMetadata_labels;\n            return ((_this_configMetadata_labels = this.configMetadata.labels) === null || _this_configMetadata_labels === void 0 ? void 0 : _this_configMetadata_labels.get('build.danopia.net/trigger-now')) == 'true';\n        }\n    },\n    template: `\n    <div class=\"build-card-row\">\n      <div class=\"build-card card-trigger\">\n        <button @click=\"triggerBuild()\">\n          <svg fill=\"#000000\" height=\"2em\" width=\"2em\" version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 60 60\" xml:space=\"preserve\">\n            <g>\n              <path d=\"M45.563,29.174l-22-15c-0.307-0.208-0.703-0.231-1.031-0.058C22.205,14.289,22,14.629,22,15v30 c0,0.371,0.205,0.711,0.533,0.884C22.679,45.962,22.84,46,23,46c0.197,0,0.394-0.059,0.563-0.174l22-15 C45.836,30.64,46,30.331,46,30S45.836,29.36,45.563,29.174z M24,43.107V16.893L43.225,30L24,43.107z\"/>\n              <path d=\"M30,0C13.458,0,0,13.458,0,30s13.458,30,30,30s30-13.458,30-30S46.542,0,30,0z M30,58C14.561,58,2,45.439,2,30 S14.561,2,30,2s28,12.561,28,28S45.439,58,30,58z\"/>\n            </g>\n          </svg>\n        </button>\n      </div>\n      <div class=\"build-card card-pending\" v-if=\"isABuildPending()\">\n        Trigger pending...\n      </div>\n      <div :class=\"'build-card card-build status-'+phaseOf(build)\" v-for=\"build of this.configs\">\n        <div>#{{buildNum(build)}} <span class=\"phase\">{{phaseOf(build)}}</span></div>\n        <div>{{timeAgo(build.status?.startTimestamp)}} ago</div>\n        <div>Took {{duration(build.status?.duration)}}</div>\n      </div>\n    </div>\n  `\n};\nconst app = createApp({\n    data () {\n        const configSpec = {\n            apiVersion: 'build.danopia.net/v1',\n            kind: 'BuildConfig'\n        };\n        const buildSpec = {\n            apiVersion: 'build.danopia.net/v1',\n            kind: 'Build'\n        };\n        const { ready: ready1  } = subscribe('/resources/watch', configSpec);\n        const { ready: ready2  } = subscribe('/resources/watch', buildSpec);\n        return {\n            ready: ready1 && ready2,\n            configs: autoResult(()=>coll.find(configSpec))\n        };\n    },\n    methods: {},\n    components: {\n        BuildHistoryList\n    }\n});\napp.mount('#app');\nawait distApp.reportReady();\n\n\n//#sourceMappingURL=data:application/json;charset=utf-8;base64,IntcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcImZpbGVcIjpcInN0ZG91dFwifSI=","bodyHtml":"<div id=\"app\">\n  <progress v-if=\"!ready\" indeterminate></progress>\n  <table>\n    <thead>\n      <th>Name</th>\n      <th>Source</th>\n      <th>Strategy</th>\n      <th>Triggers</th>\n      <th>Last build</th>\n    </thead>\n    <tbody>\n      <template v-for=\"node of configs\">\n        <tr>\n          <td>{{node.metadata.namespace}}/{{node.metadata.name}}</td>\n          <td>{{node.spec.source.type}}: {{node.spec.source.git.uri}}</td>\n          <td>{{node.spec.strategy.type}}</td>\n          <td>{{node.spec.triggers ? 'Yes' : 'No'}}</td>\n          <td>{{node.status.lastVersion}}</td>\n        </tr>\n        <tr>\n          <td colspan=\"5\">\n            <build-history-list :config-metadata=\"node.metadata\"></build-history-list>\n          </td>\n        </tr>\n      </template>\n    </tbody>\n  </table>\n</div>\n","inlineStyle":"body {\n  background: #000;\n  color: #eee;\n  font-family: sans-serif;\n}\n\n.build-card-row {\n  display: flex;\n  flex-direction: row;\n  gap: 0.5em;\n}\n.card-build {\n  padding: 0.5em;\n  background-color: rgba(120,120,120,0.25);\n}\n.card-build:hover {\n  background-color: rgba(120,120,120,0.5);\n}\n.card-build.status-Failed {\n  background-color: rgba(250,120,120,0.25);\n}\n.card-build.status-Failed .phase {\n  color: #f99;\n}\n.card-build.status-Complete {\n  background-color: rgba(120,250,120,0.25);\n}\n.card-build.status-Complete .phase {\n  color: #9f9;\n}\n.card-trigger {\n  /* grid-template-areas: \"main\"; */\n  display: grid;\n}\n.card-trigger button {\n  /* grid-area: main; */\n  background: none;\n  color: #fff;\n  cursor: pointer;\n  display: grid;\n  align-items: center;\n  border: 0;\n}\n.card-trigger button:hover {\n  background-color: rgba(120,120,120,0.5);\n}\n.card-trigger button svg {\n  fill: #eee;\n}\n\ntable {\n  border-collapse: collapse;\n  width: 100%;\n}\ntd {\n  padding: 0.2em 0.5em;\n}\n.icon {\n  display: block;\n  width: 0.75em;\n  height: 0.75em;\n  border-radius: 50% 50%;\n  border: 1px solid grey;\n}\n","importMap":{"imports":{"vue":"https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js","meteor-vue3":"https://uber.danopia.net/dist-app-poc/meteor-vue3.js"}},"scriptUrls":["https://uber.danopia.net/dist-app-poc/meteor-client-bundle.js?ad"]}}}},
];
