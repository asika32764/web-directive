declare global {
  interface Element {
    _webDirectiveDisconnectors?: Record<string, Function>;
  }
}

interface WebDirectiveOptions {
  prefix?: string;
}

declare type WebDirectiveBaseHook = (directive: string, node: HTMLElement) => void;

interface WebDirectiveBinding<T extends Element = HTMLElement> {
  directive: string;
  node: T;
  value: any;
  oldValue: any;
  mutation?: MutationRecord;
  dir: WebDirectiveHandler<T>;
}

type WebDirectiveHandlerHook<T extends Element = HTMLElement> = (node: T, bindings: WebDirectiveBinding) => void

// Directive
interface WebDirectiveHandler<T extends Element = HTMLElement> {
  mounted?: WebDirectiveHandlerHook<T>;
  unmounted?: WebDirectiveHandlerHook<T>;
  updated?: WebDirectiveHandlerHook<T>;
}

declare class WebDirective {
    directives: Record<string, WebDirectiveHandler>;
    instances: Record<string, any[]>;
    listenTarget: HTMLElement;
    options: WebDirectiveOptions;
    disconnectCallback?: (() => void);
    hooks: {
        mounted: {
            before?: WebDirectiveBaseHook;
            after?: WebDirectiveBaseHook;
        };
        unmounted: {
            before?: WebDirectiveBaseHook;
            after?: WebDirectiveBaseHook;
        };
        updated?: {
            before?: WebDirectiveBaseHook;
            after?: WebDirectiveBaseHook;
        };
    };
    constructor(options?: Partial<WebDirectiveOptions>);
    register(name: string, handler: WebDirectiveHandler): void;
    private mountDirectiveInitial;
    remove(name: string): void;
    getPrefix(): string;
    getDirectiveAttrName(name: string): string;
    private observeRoot;
    private observeChildren;
    listen(target?: HTMLElement): void;
    disconnect(): void;
    getDirective(directive: string): WebDirectiveHandler;
    private runDirectiveIfExists;
    private findDirectivesFromNode;
}

export { WebDirective as default };
