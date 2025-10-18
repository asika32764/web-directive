import { WebDirectiveBaseHook } from './types';
import { WebDirectiveHandler } from './types';
import { WebDirectiveOptions } from './types';

declare class WebDirective {
    directives: Record<string, WebDirectiveHandler>;
    instances: Record<string, any[]>;
    listenTarget: HTMLElement;
    options: Required<WebDirectiveOptions>;
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
    constructor(options?: WebDirectiveOptions);
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
    private splitDirectiveArgs;
    private runDirectiveIfExists;
    private findDirectivesFromNode;
}
export default WebDirective;

export { }
