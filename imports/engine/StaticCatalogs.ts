import { Entity } from "/imports/entities";

import { AppCatalog as CounterDemoCatalog } from "../apps/counter-demo";
import { AppCatalog as HttpClientCatalog } from "../apps/http-client";
import { AppCatalog as TimezonesCatalog } from "../apps/timezones";
import { AppCatalog as ToolbeltCatalog } from "../apps/toolbelt";
import { AppCatalog as WelcomeCatalog } from "../apps/welcome";
import { AppCatalog as WorldClockCatalog } from "../apps/world-clock";
import { AppCatalog as ScalewayCatalog } from "../apps/scaleway";
import { AppCatalog as NotionCatalog } from "../apps/notion";
import { AppCatalog as MarketCatalog } from "../apps/market";
import { AppCatalog as KubeDashCatalog } from "../apps/kube-dash";

export const StaticCatalogs = new Map<string, Array<Entity>>();
StaticCatalogs.set("app:counter-demo", CounterDemoCatalog);
StaticCatalogs.set("app:welcome", WelcomeCatalog);
StaticCatalogs.set("app:toolbelt", ToolbeltCatalog);
StaticCatalogs.set("app:world-clock", WorldClockCatalog);
StaticCatalogs.set("app:http-client", HttpClientCatalog);
StaticCatalogs.set("app:timezones", TimezonesCatalog);
StaticCatalogs.set("app:scaleway", ScalewayCatalog);
StaticCatalogs.set("app:notion", NotionCatalog);
StaticCatalogs.set("app:market", MarketCatalog);
StaticCatalogs.set("app:kubedash", KubeDashCatalog);

export const GuestCatalogs = new Set([
  'app:counter-demo',
  'app:welcome',
  'app:toolbelt',
  'app:world-clock',
  'app:http-client',
  'app:market',
  'app:kubedash',
]);

for (const [name, cat] of StaticCatalogs) {
  for (const entity of cat) {
    entity.metadata.namespace = name;
  }
}
