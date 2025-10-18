import type { WebDirectiveBaseHook, WebDirectiveHandler, WebDirectiveOptions } from './types';

const disconnectKey = '_webDirectiveDisconnectors';

const defaultOptions: Required<WebDirectiveOptions> = {
  prefix: 'w-',
};

interface DirectiveInfo {
  name: string;
  handler: WebDirectiveHandler<any>;
  elements: HTMLElement[];
}

interface ElementInfo {
  el: Element;
  disconnect: () => void;
  directives: string[];
}

class WebDirective {
  directives: Record<string, DirectiveInfo> = {};

  attachedElements: WeakMap<Element, ElementInfo> = new WeakMap();

  directiveMap: Record<string, WebDirectiveHandler[]> = {};

  listenTarget: HTMLElement = document.body;

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
    }
  } = {
    mounted: {
      before: (node, bindings) => {
        const directive = bindings.directive;
        const name = bindings.name;

        let elementInfo = this.attachedElements.get(node);

        if (!elementInfo) {
          this.attachedElements.set(node, elementInfo = {
            el: node,
            disconnect: this.observeAttachedElement(node),
            directives: [],
          });
        }

        if (!elementInfo.directives.includes(directive)) {
          elementInfo.directives.push(directive);
        }

        // const disconnect = this.observeAttachedElement(node);
        //
        // // Todo: can remove this
        // node[disconnectKey] = node[disconnectKey] || {};
        // node[disconnectKey][directive] = disconnect;

        this.directives[name].elements.push(node as HTMLElement);
      }
    },
    unmounted: {
      after: (node, bindings) => {
        const directive = bindings.directive;

        const elementInfo = this.attachedElements.get(node);

        if (elementInfo) {
          const index = elementInfo.directives.indexOf(directive);

          if (index > -1) {
            elementInfo.directives.splice(index, 1);
          }

          if (elementInfo.directives.length === 0) {
            elementInfo.disconnect();
            this.attachedElements.delete(node);
          }
        }

        //
        // if (!node[disconnectKey]) {
        //   return;
        // }
        //
        // if (node[disconnectKey][directive]) {
        //   node[disconnectKey][directive]();
        //   delete node[disconnectKey][directive];
        // }
      }
    }
  };

  constructor(options: WebDirectiveOptions = {}) {
    this.options = Object.assign({}, defaultOptions, options);
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

  register<T extends Element = HTMLElement>(name: string, handler: WebDirectiveHandler<T>) {
    const directive = this.getDirectiveAttrName(name);
    this.directives[directive] = {
      name: directive,
      handler,
      elements: []
    };

    // If listen not start, just register and back
    if (!this.disconnectCallback) {
      return;
    }

    // If listen already started, mount this directive
    this.mountDirectiveInitial(directive);
  }

  private mountDirectiveInitial(directive: string) {
    for (const element of this.listenTarget.querySelectorAll<HTMLElement>('*')) {
      const attributes = element.getAttributeNames();

      for (const attribute of attributes) {
        if (attribute.startsWith(directive)) {
          this.runDirectiveIfExists(attribute, element, 'mounted');
        }
      }
    }
  }

  private observeRoot(element: Element): () => void {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Added Nodes
        for (const node of mutation.addedNodes) {
          // Root node attached directives
          this.runDirectivesOfNode(node as HTMLElement, 'mounted', mutation);

          // Find children with all directives
          if ('querySelectorAll' in node) {
            for (const childNode of (node as HTMLElement).querySelectorAll<HTMLElement>(`*`)) {
              this.runDirectivesOfNode(childNode, 'mounted', mutation);
            }
          }
        }

        // Handle if attributes remove from node
        for (const node of mutation.removedNodes) {
          this.runDirectivesOfNode(node as HTMLElement, 'unmounted', mutation);

          // this.findDirectivesFromNode(node).forEach((directiveWithArgs) => {
          //   this.runDirectiveIfExists(directiveWithArgs, node as HTMLElement, 'unmounted', mutation);
          // });
        }

        // Handle attributes value changed
        const currentValue = (mutation.target as HTMLElement).getAttribute(mutation.attributeName!);

        // If current value is NULL, it means the attribute is removed, so skip it here
        // We will handle the removed case in the observeAttachedElement()
        if (mutation.type === 'attributes' && currentValue != null) {
          this.runDirectiveIfExists(
            mutation.attributeName!,
            mutation.target as HTMLElement,
            mutation.oldValue == null ? 'mounted' : 'updated', 
            mutation
          );
        }
      }
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

  private observeAttachedElement(element: Element): () => void {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Remove
        if (mutation.type === 'attributes' && !(mutation.target as Element).getAttribute(mutation.attributeName!)) {
          this.runDirectiveIfExists(mutation.attributeName!, mutation.target as HTMLElement, 'unmounted', mutation);
        }

        for (const directiveWithArgs of this.findDirectivesFromNode(mutation.target as Element)) {
          // Attributes
          if (mutation.type === 'attributes' || mutation.type === 'childList') {
            this.runDirectiveIfExists(directiveWithArgs, mutation.target as HTMLElement, 'updated', mutation);
          }
        }
      }
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

  remove(name: string) {
    const directive = this.getDirectiveAttrName(name);

    if (this.directives[directive]) {
      this.directives[directive].elements.forEach((element) => {
        this.findDirectivesFromNode(element, directive).forEach((directiveWithArgs) => {
          this.runDirectiveIfExists(directiveWithArgs, element, 'unmounted');
        });
      });

      delete this.directives[directive];
    }
  }

  getPrefix() {
    return this.options.prefix;
  }

  getDirectiveAttrName(name: string): string {
    return `${this.getPrefix()}${name}`;
  }

  disconnect() {
    if (this.disconnectCallback) {
      this.disconnectCallback();
      this.disconnectCallback = undefined;
    }

    for (const directive in this.directives) {
      this.directives[directive].elements.forEach((element) => {
        this.findDirectivesFromNode(element, directive).forEach((directiveWithArgs) => {
          this.runDirectiveIfExists(directiveWithArgs, element, 'unmounted');
        });
      });
    }
  }

  getDirective(directive: string): DirectiveInfo {
    return this.directives[directive];
  }

  private splitDirectiveArgs(directive: string) {
    const [nameWithArg, ...modifierParts] = directive.split('.');
    const [name, arg] = nameWithArg.split(':');

    const modifiers: Record<string, boolean> = {};
    modifierParts.forEach((mod) => {
      modifiers[mod] = true;
    });

    return { name, arg: arg || null, modifiers };
  }

  private runDirectiveIfExists(
    directive: string,
    node: HTMLElement,
    task: 'mounted' | 'unmounted' | 'updated',
    mutation: MutationRecord | undefined = undefined
  ) {
    const { name, arg, modifiers } = this.splitDirectiveArgs(directive);

    const instance = this.getDirective(name);

    if (task === 'mounted') {
      // Add element to directive map
      instance.elements.push(node);
    } else if (task === 'unmounted') {
      // Remove element from directive map
      const index = instance.elements.indexOf(node);

      if (index > -1) {
        instance.elements.splice(index, 1);
      }
    }

    const handler = instance.handler;

    if (handler && task in handler) {
      const bindings = {
        directive,
        name,
        node,
        value: node.getAttribute(directive),
        oldValue: mutation?.oldValue,
        mutation,
        handler,
        arg,
        modifiers
      };

      if (this.hooks?.[task]?.before) {
        this.hooks[task]?.before?.(node, bindings);
      }

      handler[task]?.(node, bindings);

      if (this.hooks?.[task]?.after) {
        this.hooks[task]?.after?.(node, bindings);
      }
    }
  }

  private runDirectivesOfNode(
    node: HTMLElement,
    task: 'mounted' | 'unmounted' | 'updated',
    mutation?: MutationRecord,
    directive?: string,
  ) {
    for (const directiveWithArgs of this.findDirectivesFromNode(node, directive)) {
      this.runDirectiveIfExists(directiveWithArgs, node, task, mutation);
    }
  }

  private findDirectivesFromNode(node: Element, directive?: string): string[] {
    const directives: string[] = [];

    if (!node.getAttributeNames) {
      return [];
    }

    node.getAttributeNames().forEach((e) => {
      if (e.startsWith(this.getPrefix())) {
        if (!directive) {
          directives.push(e);
        } else if (e.startsWith(directive)) {
          directives.push(e);
        }
      }
    });

    return directives;
  }
}

export default WebDirective;
