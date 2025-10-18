
declare global {
  interface Element {
    _webDirectiveDisconnectors?: Record<string, Function>;
  }
}

export interface WebDirectiveOptions {
  prefix?: string;
}

export declare type WebDirectiveBaseHook = (node: HTMLElement, bindings: WebDirectiveBinding) => void;

export interface WebDirectiveBinding<T extends Element = HTMLElement> {
  directive: string;
  name: string;
  node: T;
  value: any;
  oldValue: any;
  mutation?: MutationRecord;
  handler: WebDirectiveHandler<T>;
  arg: string | null;
  modifiers: Record<string, boolean>;
}

export type WebDirectiveHandlerHook<T extends Element = HTMLElement> = (node: T, bindings: WebDirectiveBinding) => void

// Directive
export interface WebDirectiveHandler<T extends Element = HTMLElement> {
  mounted?: WebDirectiveHandlerHook<T>;
  unmounted?: WebDirectiveHandlerHook<T>;
  updated?: WebDirectiveHandlerHook<T>;
}
