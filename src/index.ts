import type { WebDirectiveBaseHook, WebDirectiveHandler, WebDirectiveOptions } from './types';

export { singleton, nextTick } from './utilities';

const disconnectKey = '_webDirectiveDisconnectors';

const defaultOptions: Required<WebDirectiveOptions> = {
  prefix: 'w-',
  enableAttrParams: false,
  enableChildrenUpdated: false,
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

type HookTask = 'mounted' | 'unmounted' | 'updated' | 'childrenUpdated';

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
    },
    childrenUpdated?: {
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
      this.findAndRunDirectivesOfSubtree(this.listenTarget, 'mounted', undefined, directive);
    }
  }

  register<T extends Element = HTMLElement, M extends Record<string, boolean> = Record<string, boolean>>(
    name: string,
    handler: WebDirectiveHandler<T, M>
  ) {
    const directive = this.getDirectiveAttrName(name);
    this.directives[directive] = {
      name: directive,
      handler: handler as WebDirectiveHandler<T, Record<string, boolean>>,
      elements: []
    };

    // If listen not start, just register and back
    if (!this.disconnectCallback) {
      return;
    }

    // If listen already started, mount this directive
    this.findAndRunDirectivesOfSubtree(this.listenTarget, 'mounted', undefined, directive);
  }

  // private mountDirectiveInitial(directive: string) {
  //   this.findAndRunDirectivesOfSubtree(this.listenTarget, 'unmounted');
  //
  //   // if (this.options.enableAttrParams) {
  //   //   for (const element of this.listenTarget.querySelectorAll<HTMLElement>('*')) {
  //   //     this.findAndRunDirectivesFromNode(element, 'mounted', undefined, directive);
  //   //
  //   //     // const attributes = element.getAttributeNames();
  //   //     //
  //   //     // for (const attribute of attributes) {
  //   //     //   if (attribute.startsWith(directive)) {
  //   //     //     this.runDirectiveIfExists(attribute, element, 'mounted');
  //   //     //   }
  //   //     // }
  //   //   }
  //   //
  //   //   return;
  //   // }
  //   //
  //   // for (const element of this.listenTarget.querySelectorAll<HTMLElement>(`[${directive}]`)) {
  //   //   this.runDirectiveIfExists(directive, element, 'mounted');
  //   // }
  // }

  /**
   * This method is to listen the root element for any changes.
   * The listen event contains:
   * - Child added/removed, and will scan all directives from added/removed nodes
   * - Self Attributes changed
   *
   * This listener will run forever until disconnect() is called.
   */
  private observeRoot(element: Element): () => void {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Added Nodes
        for (const node of mutation.addedNodes) {
          // Run self mounted
          this.findAndRunDirectivesOfNode(node as HTMLElement, 'mounted', mutation);

          // Run all subtree mounted
          this.findAndRunDirectivesOfSubtree(node as HTMLElement, 'mounted', mutation);
        }

        // Handle if attributes remove from node
        for (const node of mutation.removedNodes) {
          // Run self unmounted
          this.findAndRunDirectivesOfNode(node as HTMLElement, 'unmounted', mutation);

          // Run all subtree unmounted
          this.findAndRunDirectivesOfSubtree(node as HTMLElement, 'unmounted', mutation);

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
      childList: this.options.enableChildrenUpdated,
      characterData: false,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }

  /**
   * This method is to listen an element which is attached at least 1 or more directives.
   * The listen event contains:
   * - Self attributes changed
   * - Children changed (if enabled)
   *
   * And this listener will be removed when all directives are unmounted from this element.
   */
  private observeAttachedElement(element: Element): () => void {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Attributes updated
        if (
          mutation.type === 'attributes'
          && mutation.attributeName
          && mutation.target === element
        ) {
          if (!(mutation.target as Element).getAttribute(mutation.attributeName!)) {
            // Remove
            this.runDirectiveIfExists(mutation.attributeName!, mutation.target as HTMLElement, 'unmounted', mutation);
          } else {
            // Attribute value changed
            this.runDirectiveIfExists(mutation.attributeName!, mutation.target as HTMLElement, 'updated', mutation);
          }
        }

        // Children changed. Let's run all attributes
        if (this.options.enableChildrenUpdated && mutation.type === 'childList') {
          for (const directiveWithArgs of this.findDirectivesFromNode(element)) {
            this.runDirectiveIfExists(directiveWithArgs, element as HTMLElement, 'childrenUpdated', mutation);
          }
        }
      }
    });

    observer.observe(element, {
      attributes: true,
      childList: this.options.enableChildrenUpdated,
      subtree: this.options.enableChildrenUpdated,
      characterData: true,
      attributeOldValue: true,
      characterDataOldValue: true,
      // attributeFilter: Object.keys(this.directives)
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

  getDirectiveInfo(directive: string): DirectiveInfo | undefined {
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
    task: HookTask,
    mutation: MutationRecord | undefined = undefined
  ) {
    const { name, arg, modifiers } = this.splitDirectiveArgs(directive);

    const info = this.getDirectiveInfo(name);

    if (!info) {
      return;
    }

    if (task === 'mounted') {
      // Add element to directive map
      info.elements.push(node);
    } else if (task === 'unmounted') {
      // Remove element from directive map
      const index = info.elements.indexOf(node);

      if (index > -1) {
        info.elements.splice(index, 1);
      }
    }

    const handler = info.handler;

    if (task in handler) {
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

  private findAndRunDirectivesOfNode(
    node: HTMLElement,
    task: HookTask,
    mutation?: MutationRecord,
    directive?: string,
  ) {
    for (const directiveWithArgs of this.findDirectivesFromNode(node, directive)) {
      this.runDirectiveIfExists(directiveWithArgs, node, task, mutation);
    }
  }

  private findAndRunDirectivesOfSubtree(node: Element, task: HookTask, mutation?: MutationRecord, directive?: string) {
    if (!('querySelectorAll' in node)) {
      return;
    }

    if (this.options.enableAttrParams) {
      for (const childNode of node.querySelectorAll<HTMLElement>('*')) {
        this.findAndRunDirectivesOfNode(childNode, task, mutation, directive);
      }
    } else {
      const directives = directive ? [directive] : Object.keys(this.directives);

      for (const directive of directives) {
        for (const element of node.querySelectorAll<HTMLElement>(`[${directive}]`)) {
          this.runDirectiveIfExists(directive, element, task);
        }
      }
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
