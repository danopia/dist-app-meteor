import { createContext } from "react";
import { EntityEngine } from "../engine/EntityEngine";

export const RuntimeContext = createContext<EntityEngine>(new EntityEngine());
