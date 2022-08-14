# database schema

* server stores Catalogs
  * catalog has isolated storage of entitities
    * namespace primitive is used to group entities
    * namespaces can be:
      * source - normal namespace storing local persistent entities
        * read-only at 'runtime', must open dev session to write
        * stores the application's "source code"
      * volatile - empty namespace that can be written at runtime
      <!-- * ~~persistent~~ - site-local namespace which starts out empty
      * exported - an API namespace that can be imported elsewhere
        * can depend on other namespaces, but the users won't get them
      * imported - must be fulfilled to work
        * possibly from another catalog -->
  * catalogs are private by default, must be shared via capabilities
  * each catalog maintains its own OIDC issuer & private key
  * catalog

* server stores Entities
  * cross of Kubernetes and Backstage group/kind/metadata layout
  * always belongs to one catalog
  * group/kind is either compiled into the server or

# shell
* app strip like chromeos
* default to floating windows on larger screens, tiling on smaller screens
* customize tiling as a CSS grid
* minimized windows go under their launcher button
* multiple windows per app, launcher button then shows menu

* show fullscreen button when running in a tab

# runtime

* catalog is downloaded, including dependencies
* dependency tree built - e.g. imports between catalogs
* to load a resource, first load all children

enable server-side rendering of apps
* compiled JS is stored as `AssetBlob`

# network transparency

* a catalog can be dumped to a .tar.gz of YAML
* optionally include dependencies?

## platform APIs

general entity structure:
* entire catalog's entity metadata is loaded at all times
* rest of entity's keys are loaded ad-hoc - implementation detail
* metadata and spec are included when building a bundle
*

# system kinds
* Activity - provides a user interface
* IntentFilter - triggers an Activity to be launched
* Asset - arbitrary octet-stream/blob with MIME type
* API - define an OpenAPI schema]
* Device - ask for a specific API to be mounted
* Config - stores a json blob in status, obeying a json-schema in spec
<!-- * ResourceProvider - can 'present' child entities at runtime -->
* EntityKind - like a CRD
* Library
* External
* Profile

# examples of third-party kinds
these things can be added via imported CustomEntitys
* kubernetes deployment kinds :D
  * like, a literal subset of the kubernetes kinds so things can ask for containers
  * mirror the
* knative kinds for scale-from-zero containers??
* mongodb connection
* meteor collection

# example catalog structure
* `distribute` catalog with the catalog discovery and installation service
  * `Namespace App`
    * `DistApp Main`
    * `IntentFilter Launch`

  * `Namespace Publish`
    * `DistApp Publish`
* `dagd` catalog storing a UI for dagd
  * `Namespace App` - contains the application to be exported
    * `DistApp Main` - app metadata and selector - only one App in Ns
      * references the `Icon` by name
    * `Activity Main` - launchable web app
      * includes an `IntentFilter` for `action.MAIN` `category.LAUNCHER`
      * references the actual `Iframe` via arbitrary kind
      * array of possible entrypoints for web, cli, native, etc
    * `Asset Icon` - an SVG or WebP icon for the launcher / switcher
  * `Namespace UI` -
    * `Iframe Main` - embed and sandbox configuration
      * references `Asset` and also `Icon`
    * `Asset HtmlDocument` - the raw HTML source code to serve
    <!-- * `Service ResponseParser` -->
    <!-- * `Method ParseDnsRecords` - helper -->
  * `Namespace API` -
    * `MongoCollection Observations` - the default dagd URLs and API info
    * `HttpEndpoint TextApi` - the default dagd URLs and API info
      * include v4 and v6 as alternative endpoints
* anonymous catalog

# official catalogs:
## cloud-primitives
normalized APIs to request generic durable resources like:
* document collection
  * with openapi spec
* topic pub/sub
  * with asyncapi spec
* task queue
  * with asyncapi spec
* storage bucket
* key/val store

## vue
* define vue apps and components as yaml
* registers an activity type to render a vue app

## lua
* use fengari to run lua scripts with a proprietary UI

# catalog editing

* yaml editor
* intellisense for the yaml spec would be A+
  * or just go full typescript????
* also have UIs for the kinds

* show app YAMLs in one scrolling view
* allow collapsing a yaml
* convert to IDE when focused
* allow toggling UI?

# misc

intents
* know which intents are satisfyable locally
* if a button lacks an intent, offer downloading a catalog
* intents such as launching an activity in a window

profiles
* a user has a profile namespace where they install their apps
* namespace is uniquely named

git sync
* the entities can be synced with a github repo as YAML
* the entities can be synced via CLI for read/write
  * offer virtual views that optimize for e.g. editing in-entity code blocks

task store/revive
* when working in a task (e.g. text editor), can close the view
* task kept in tray and can be reopened with the previous state
* task can also be stored as a file and organized into folders
* stored tasks can include extra info for archival purposes

dist.app FTUE
* on a fresh pageload, the client runtime launches a bundled welcome app
* welcome app can explain where the user is and what features are inside
* unauthed sessions are local in-memory
* possibility to sync the inmemory session to the server after creating an account

# kubernetes multitenant arch
* catalogs are a distributable unit and version control
* catalogs may belong to a user, or be a library/app catalog that the user mounts
* catalogs have namespaces
* namespaces can contain CRD resources
* namespaces can list CRDs that they contain resources of
* namespaces may be imported from another catalog
  * usually 'default' imported into something like 'github-api'
* the "default" namespace is what gets exported and resurfaced elsewhere
* a runtime catalog can be instantiated using long-term catalogs as configuration
* a RecordStorage or whatever registration in a namespace defines where the data comes from

# distribution
* allow s2s connections between unrelated servers
* every server must have a root OIDC issuer that will protect s2s
* catalogs may also have an Internet/OIDC identity
  * probably subfolder of server identity
  * own signing key
  * namespace/kind.group/name is then the subject in the tokens

# build into meteor app
* run container with git and meteor buildchain
* reactive codegen into tempdir running meteor
* expose meteor maybe on alt port? wildcard subdomain seems complex
* expose API to compile and emit a meteor distributable
* update container code based on github webhook
