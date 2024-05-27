
declare global {
  interface Element {
    _webDirectiveDisconnectors?: Record<string, Function>;
  }
}

export interface WebDirectiveOptions {
  prefix?: string;
}

export declare type WebDirectiveBaseHook = (directive: string, node: HTMLElement) => void;

export interface WebDirectiveBinding<T extends Element = HTMLElement> {
  directive: string;
  node: T;
  value: any;
  oldValue: any;
  mutation?: MutationRecord;
  dir: WebDirectiveHandler<T>;
}

export type WebDirectiveHandlerHook<T extends Element = HTMLElement> = (node: T, bindings: WebDirectiveBinding) => void

// Directive
export interface WebDirectiveHandler<T extends Element = HTMLElement> {
  mounted?: WebDirectiveHandlerHook<T>;
  unmounted?: WebDirectiveHandlerHook<T>;
  updated?: WebDirectiveHandlerHook<T>;
}
