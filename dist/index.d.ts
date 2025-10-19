declare interface DirectiveInfo {
    name: string;
    handler: WebDirectiveHandler<any>;
    elements: HTMLElement[];
}

export declare function nextTick(): Promise<void>;

export declare function singleton<E extends Element, T = any>(el: E, name: string): T | undefined;

export declare function singleton<E extends Element, T = any>(el: E, name: string, factory: false): T | undefined;

export declare function singleton<E extends Element, T = any>(el: E, name: string, factory: (el: E) => T): T;

export declare function useCurrentContext(): {
    el: Element;
    binding: WebDirectiveBinding<HTMLElement, Record<string, boolean>>;
};

export declare function useEventListener(el: Element, event: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;

declare class WebDirective {
    private directives;
    private attachedElements;
    listenTarget: HTMLElement;
    options: Required<WebDirectiveOptions>;
    private disconnectCallback?;
    static currentContext: {
        el: Element;
        binding: WebDirectiveBinding;
    } | null;
    private hooks;
    constructor(options?: WebDirectiveOptions);
    listen(target?: HTMLElement): void;
    register<T extends Element = HTMLElement, M extends Record<string, boolean> = Record<string, boolean>>(name: string, handler: WebDirectiveHandler<T, M>): void;
    /**
     * This method is to listen the root element for any changes.
     * The listen event contains:
     * - Child added/removed, and will scan all directives from added/removed nodes
     * - Self Attributes changed
     *
     * This listener will run forever until disconnect() is called.
     */
    private observeRoot;
    /**
     * This method is to listen an element which is attached at least 1 or more directives.
     * The listen event contains:
     * - Self attributes changed
     * - Children changed (if enabled)
     *
     * And this listener will be removed when all directives are unmounted from this element.
     */
    private observeAttachedElement;
    remove(name: string): void;
    getPrefix(): string;
    getDirectiveAttrName(name: string): string;
    disconnect(): void;
    getDirectiveInfo(directive: string): DirectiveInfo | undefined;
    private splitDirectiveArgs;
    private runDirectiveIfExists;
    private findAndRunDirectivesOfNode;
    private findAndRunDirectivesOfSubtree;
    private findDirectivesFromNode;
}
export default WebDirective;

export declare interface WebDirectiveBinding<T extends Element = HTMLElement, M extends Record<string, boolean> = Record<string, boolean>> {
    directive: string;
    name: string;
    node: T;
    value: any;
    oldValue: any;
    mutation?: MutationRecord;
    handler: WebDirectiveHandler<T, M>;
    arg: string | null;
    modifiers: M;
    instance: WebDirective;
}

export declare interface WebDirectiveHandler<T extends Element = HTMLElement, M extends Record<string, boolean> = Record<string, boolean>> {
    mounted?: WebDirectiveHandlerHook<T, M>;
    unmounted?: WebDirectiveHandlerHook<T, M>;
    updated?: WebDirectiveHandlerHook<T, M>;
    childrenUpdated?: WebDirectiveHandlerHook<T, M>;
}

declare type WebDirectiveHandlerHook<T extends Element = HTMLElement, M extends Record<string, boolean> = Record<string, boolean>> = (node: T, bindings: WebDirectiveBinding<T, M>) => void;

export declare interface WebDirectiveOptions {
    prefix?: string;
    eventPrefix?: string;
    enableAttrParams?: boolean;
    enableChildrenUpdated?: boolean;
}

export { }
