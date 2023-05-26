import { Entity } from "/imports/entities";

import { AppCatalog as HttpClientCatalog } from "../apps/http-client";
import { AppCatalog as ToolbeltCatalog } from "../apps/toolbelt";
import { AppCatalog as WelcomeCatalog } from "../apps/welcome";
import { AppCatalog as MarketCatalog } from "../apps/market";

export const StaticCatalogs = new Map<string, Array<Entity>>();
StaticCatalogs.set("app:welcome", WelcomeCatalog);
StaticCatalogs.set("app:toolbelt", ToolbeltCatalog);
StaticCatalogs.set("app:http-client", HttpClientCatalog);
StaticCatalogs.set("app:market", MarketCatalog);

export const GuestCatalogs = new Set([
  'app:welcome',
  'app:toolbelt',
  'app:http-client',
  'app:market',
]);

for (const [name, cat] of StaticCatalogs) {
  for (const entity of cat) {
    entity.metadata.namespace = name;
  }
}
