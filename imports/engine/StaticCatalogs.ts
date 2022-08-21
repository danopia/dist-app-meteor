import { StaticCatalog } from "../api/catalog";
import { CounterTaskCatalog } from "../apps/counter-task";
import { CounterVolatileCatalog } from "../apps/counter-volatile";
import { ToolbeltCatalog } from "../apps/toolbelt";
import { WelcomeCatalog } from "../apps/welcome";
import { WorldClockCatalog } from "../apps/world-clock";

export const StaticCatalogs = new Map<string, StaticCatalog>();
StaticCatalogs.set("app:counter-task", CounterTaskCatalog);
StaticCatalogs.set("app:counter-volatile", CounterVolatileCatalog);
StaticCatalogs.set("app:welcome", WelcomeCatalog);
StaticCatalogs.set("app:toolbelt", ToolbeltCatalog);
StaticCatalogs.set("app:world-clock", WorldClockCatalog);

for (const [name, cat] of StaticCatalogs) {
  for (const entity of cat.entries) {
    entity.metadata.namespace = name;
  }
}
