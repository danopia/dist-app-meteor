import { createContext } from "react";
import { Runtime } from "../runtime/Runtime";

export const RuntimeContext = createContext<Runtime | null>(null);
