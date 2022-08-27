import { Entity } from "/imports/entities";

import { CounterTaskCatalog } from "../apps/counter-task";
import { CounterVolatileCatalog } from "../apps/counter-volatile";
import { HttpClientCatalog } from "../apps/http-client";
import { TimezonesCatalog } from "../apps/timezones";
import { ToolbeltCatalog } from "../apps/toolbelt";
import { WelcomeCatalog } from "../apps/welcome";
import { WorldClockCatalog } from "../apps/world-clock";

export const StaticCatalogs = new Map<string, Array<Entity>>();
StaticCatalogs.set("app:counter-task", CounterTaskCatalog);
StaticCatalogs.set("app:counter-volatile", CounterVolatileCatalog);
StaticCatalogs.set("app:welcome", WelcomeCatalog);
StaticCatalogs.set("app:toolbelt", ToolbeltCatalog);
StaticCatalogs.set("app:world-clock", WorldClockCatalog);
StaticCatalogs.set("app:http-client", HttpClientCatalog);
StaticCatalogs.set("app:timezones", TimezonesCatalog);

for (const [name, cat] of StaticCatalogs) {
  for (const entity of cat) {
    entity.metadata.namespace = name;
  }
}
