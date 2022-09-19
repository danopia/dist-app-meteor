import 'react';

declare module "react" {
  interface IframeHTMLAttributes<T> {
    csp?: string;
  }
}
