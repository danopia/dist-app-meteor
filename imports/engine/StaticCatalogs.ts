import { Entity } from "/imports/entities";

import { CounterTaskCatalog as CounterDemoCatalog } from "../apps/counter-demo";
import { HttpClientCatalog } from "../apps/http-client";
import { TimezonesCatalog } from "../apps/timezones";
import { ToolbeltCatalog } from "../apps/toolbelt";
import { WelcomeCatalog } from "../apps/welcome";
import { WorldClockCatalog } from "../apps/world-clock";
import { ScalewayCatalog } from "../apps/scaleway";
import { NotionCatalog } from "../apps/notion";
import { AppCatalog as MarketCatalog } from "../apps/market";

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

for (const [name, cat] of StaticCatalogs) {
  for (const entity of cat) {
    entity.metadata.namespace = name;
  }
}
