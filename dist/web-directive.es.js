const disconnectKey = '_webDirectiveDisconnectors';
const defaultOptions = {
    prefix: 'w-',
};
class WebDirective {
    constructor(options = {}) {
        this.directives = {};
        this.instances = {};
        this.listenTarget = document.body;
        this.hooks = {
            mounted: {
                before: (directive, node) => {
                    node[disconnectKey] = node[disconnectKey] || {};
                    node[disconnectKey][directive] = this.observeChildren(node);
                    this.instances[directive] = this.instances[directive] || [];
                    this.instances[directive].push(node);
                }
            },
            unmounted: {
                after: (directive, node) => {
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
        this.options = Object.assign({}, defaultOptions, options);
    }
    register(name, handler) {
        const directive = this.getDirectiveAttrName(name);
        this.directives[directive] = handler;
        // If listen not start, just register and back
        if (!this.disconnectCallback) {
            return;
        }
        // If listen already started, mount this directive
        this.mountDirectiveInitial(directive);
    }
    mountDirectiveInitial(directive) {
        [].forEach.call(this.listenTarget.querySelectorAll('[' + directive + ']'), (el) => {
            this.runDirectiveIfExists(directive, el, 'mounted');
        });
    }
    remove(name) {
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
    getDirectiveAttrName(name) {
        return `${this.getPrefix()}${name}`;
    }
    observeRoot(element) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Added Nodes
                [].forEach.call(mutation.addedNodes, (node) => {
                    this.findDirectivesFromNode(node).forEach((directive) => {
                        this.runDirectiveIfExists(directive, node, 'mounted', mutation);
                    });
                    // Find children with all directives
                    for (const directive in this.directives) {
                        if ('querySelectorAll' in node) {
                            node.querySelectorAll(`[${directive}]`).forEach((node) => {
                                this.runDirectiveIfExists(directive, node, 'mounted', mutation);
                            });
                        }
                    }
                });
                [].forEach.call(mutation.removedNodes, (node) => {
                    this.findDirectivesFromNode(node).forEach((directive) => {
                        this.runDirectiveIfExists(directive, node, 'unmounted', mutation);
                    });
                });
                if (mutation.type === 'attributes' && mutation.oldValue == null) {
                    this.runDirectiveIfExists(mutation.attributeName, mutation.target, 'mounted', mutation);
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
    observeChildren(element) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Remove
                if (mutation.type === 'attributes' && !mutation.target.getAttribute(mutation.attributeName)) {
                    this.runDirectiveIfExists(mutation.attributeName, mutation.target, 'unmounted', mutation);
                }
                this.findDirectivesFromNode(mutation.target).forEach((directive) => {
                    // Attributes
                    if (mutation.type === 'attributes' || mutation.type === 'childList') {
                        this.runDirectiveIfExists(directive, mutation.target, 'updated', mutation);
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
    listen(target) {
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
    getDirective(directive) {
        return this.directives[directive];
    }
    runDirectiveIfExists(directive, node, task, mutation = undefined) {
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
    findDirectivesFromNode(node) {
        const directives = [];
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

export { WebDirective as default };
//# sourceMappingURL=web-directive.es.js.map
