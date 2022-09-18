
declare namespace React {
  //@ts-expect-error not sure how to override this correctly
  interface IframeHTMLAttributes {
    csp?: string;
  }
}
