import { DependencyList, useEffect } from "react";

export function useBodyClass(className: string, deps?: DependencyList) {
  useEffect(() => {
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, deps);
}
