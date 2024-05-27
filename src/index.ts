import type { WebDirectiveBaseHook, WebDirectiveHandler, WebDirectiveOptions } from './types';

const disconnectKey = '_webDirectiveDisconnectors';

const defaultOptions: WebDirectiveOptions = {
  prefix: 'w-',
};

class WebDirective {
  directives: Record<string, WebDirectiveHandler> = {};

  instances: Record<string, any[]> = {};

  listenTarget: HTMLElement = document.body;

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
    }
  } = {
    mounted: {
      before: (directive: string, node: Element) => {
        node[disconnectKey] = node[disconnectKey] || {};
        node[disconnectKey][directive] = this.observeChildren(node);

        this.instances[directive] = this.instances[directive] || [];
        this.instances[directive].push(node);
      }
    },
    unmounted: {
      after: (directive, node: Element) => {
        if (!node[disconnectKey]) {
          return;
        }

        if (node[disconnectKey][directive]) {
          node[disconnectKey][directive]();
          delete node[disconnectKey][directive];
        }
      }
    }
  };

  constructor(options: Partial<WebDirectiveOptions> = {}) {
    this.options = Object.assign({}, defaultOptions, options);
  }

  register(name: string, handler: WebDirectiveHandler) {
    const directive = this.getDirectiveAttrName(name);
    this.directives[directive] = handler;

    // If listen not start, just register and back
    if (!this.disconnectCallback) {
      return;
    }

    // If listen already started, mount this directive
    this.mountDirectiveInitial(directive);
  }

  private mountDirectiveInitial(directive: string) {

    [].forEach.call(
      this.listenTarget.querySelectorAll<HTMLElement>('[' + directive + ']'),
      (el: HTMLElement) => {
        this.runDirectiveIfExists(directive, el, 'mounted');
      }
    );
  }

  remove(name: string) {
    const directive = this.getDirectiveAttrName(name);

    if (this.instances[directive]) {
      this.instances[directive].forEach((node) => {
        this.runDirectiveIfExists(directive, node, 'unmounted');
      });

      delete this.instances[directive];
    }

    delete this.directives[directive];
  }

  getPrefix() {
    return this.options.prefix;
  }

  getDirectiveAttrName(name: string): string {
    return `${this.getPrefix()}${name}`;
  }

  private observeRoot(element: Element): () => void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Added Nodes
        [].forEach.call(mutation.addedNodes, (node: Node) => {
          this.findDirectivesFromNode(node as Element).forEach((directive) => {
            this.runDirectiveIfExists(directive, node as HTMLElement, 'mounted', mutation);
          });

          // Find children with all directives
          for (const directive in this.directives) {
            if ('querySelectorAll' in node) {
              (node as HTMLElement).querySelectorAll<HTMLElement>(`[${directive}]`).forEach((node: HTMLElement) => {
                this.runDirectiveIfExists(directive, node, 'mounted', mutation);
              });
            }
          }
        });

        [].forEach.call(mutation.removedNodes, (node: Element) => {
          this.findDirectivesFromNode(node).forEach((directive) => {
            this.runDirectiveIfExists(directive, node as HTMLElement, 'unmounted', mutation);
          });
        });

        if (mutation.type === 'attributes' && mutation.oldValue == null) {
          this.runDirectiveIfExists(mutation.attributeName!, mutation.target as HTMLElement, 'mounted', mutation);
        }
      });
    });

    observer.observe(element, {
      attributes: true,
      attributeOldValue: true,
      childList: true,
      characterData: false,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }

  private observeChildren(element: Element): () => void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Remove
        if (mutation.type === 'attributes' && !(mutation.target as Element).getAttribute(mutation.attributeName!)) {
          this.runDirectiveIfExists(mutation.attributeName!, mutation.target as HTMLElement, 'unmounted', mutation);
        }

        this.findDirectivesFromNode(mutation.target as Element).forEach((directive) => {
          // Attributes
          if (mutation.type === 'attributes' || mutation.type === 'childList') {
            this.runDirectiveIfExists(directive, mutation.target as HTMLElement, 'updated', mutation);
          }
        });
      });
    });

    observer.observe(element, {
      attributes: true,
      childList: true,
      characterData: true,
      attributeOldValue: true,
      characterDataOldValue: true,
      attributeFilter: Object.keys(this.directives)
    });

    return () => {
      observer.disconnect();
    };
  }

  listen(target?: HTMLElement): void {
    if (this.disconnectCallback) {
      throw new Error('This instance has already listening.');
    }

    this.listenTarget = target || document.body;

    this.disconnectCallback = this.observeRoot(this.listenTarget);

    // Mount registered directive before listen.
    for (const directive in this.directives) {
      this.mountDirectiveInitial(directive);
    }
  }

  disconnect() {
    if (this.disconnectCallback) {
      this.disconnectCallback();
      this.disconnectCallback = undefined;
    }
  }

  getDirective(directive: string): WebDirectiveHandler {
    return this.directives[directive];
  }

  private runDirectiveIfExists(
    directive: string,
    node: HTMLElement,
    task: 'mounted' | 'unmounted' | 'updated',
    mutation: MutationRecord | undefined = undefined
  ) {
    const handler = this.getDirective(directive);

    if (handler && task in handler) {
      if (this.hooks?.[task]?.before) {
        this.hooks[task]?.before?.(directive, node);
      }

      handler[task]?.(node, {
        directive,
        node,
        value: node.getAttribute(directive),
        oldValue: mutation?.oldValue,
        mutation,
        dir: handler
      });

      if (this.hooks?.[task]?.after) {
        this.hooks[task]?.after?.(directive, node);
      }
    }
  }

  private findDirectivesFromNode(node: Element): string[] {
    const directives: string[] = [];

    if (!node.getAttributeNames) {
      return [];
    }

    node.getAttributeNames().forEach((e) => {
      if (e.startsWith(this.getPrefix())) {
        directives.push(e);
      }
    });

    return directives;
  }
}

export default WebDirective;
