import { Entity } from "./entities";

export class StaticCatalog {
  constructor(public readonly entries: Array<Entity>) {}
}
