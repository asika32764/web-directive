
declare global {
  interface Element {
    _webDirectiveDisconnectors?: Record<string, Function>;
  }
}

export interface WebDirectiveOptions {
  prefix?: string;
  enableAttrParams?: boolean;
  enableChildrenUpdated?: boolean;
}

export declare type WebDirectiveBaseHook = (node: HTMLElement, bindings: WebDirectiveBinding) => void;

export interface WebDirectiveBinding<T extends Element = HTMLElement, M extends Record<string, boolean> = Record<string, boolean>> {
  directive: string;
  name: string;
  node: T;
  value: any;
  oldValue: any;
  mutation?: MutationRecord;
  handler: WebDirectiveHandler<T, M>;
  arg: string | null;
  modifiers: M;
}

export type WebDirectiveHandlerHook<T extends Element = HTMLElement, M extends Record<string, boolean> = Record<string, boolean>> = (node: T, bindings: WebDirectiveBinding<T, M>) => void

// Directive
export interface WebDirectiveHandler<T extends Element = HTMLElement, M extends Record<string, boolean> = Record<string, boolean>> {
  mounted?: WebDirectiveHandlerHook<T, M>;
  unmounted?: WebDirectiveHandlerHook<T, M>;
  updated?: WebDirectiveHandlerHook<T, M>;
  childrenUpdated?: WebDirectiveHandlerHook<T, M>;
}
