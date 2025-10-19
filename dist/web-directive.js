function b() {
  if (!h.currentContext)
    throw new Error("No active context found.");
  return h.currentContext;
}
const u = `__webDirective.${g()}`;
function x(o, s, t) {
  const i = o;
  if (i[u] ??= {}, t === !1) {
    const e = i[u][s];
    return delete i[u][s], e;
  }
  return !i[u][s] && t && (i[u][s] = t(o)), i[u][s];
}
function g() {
  return Math.random().toString(36).substring(2, 10);
}
function E(o, s, t, i) {
  const { el: e, binding: n } = b();
  o.addEventListener(s, t, i);
  const r = () => {
    o.removeEventListener(s, t, i);
  };
  return e.addEventListener("__wd:unmounted:" + n.directive, (d) => {
    r();
  }, { once: !0 }), r;
}
function p(o) {
  return o.replace(/-([a-z])/g, (s) => s[1].toUpperCase());
}
function A(o) {
  return o.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
function C() {
  return Promise.resolve().then();
}
const D = {
  prefix: "w-",
  eventPrefix: "wd:",
  enableAttrParams: !1,
  enableChildrenUpdated: !1
}, f = class f {
  constructor(s = {}) {
    this.directives = {}, this.attachedElements = /* @__PURE__ */ new WeakMap(), this.listenTarget = document.body, this.hooks = {
      mounted: {
        before: (t, i) => {
          const e = i.directive;
          i.name;
          let n = this.attachedElements.get(t);
          n || this.attachedElements.set(t, n = {
            el: t,
            disconnect: this.observeAttachedElement(t),
            directives: []
          }), n.directives.includes(e) || n.directives.push(e);
        }
      },
      unmounted: {
        after: (t, i) => {
          const e = i.directive, n = this.attachedElements.get(t);
          if (n) {
            const r = n.directives.indexOf(e);
            r > -1 && n.directives.splice(r, 1), n.directives.length === 0 && (n.disconnect(), this.attachedElements.delete(t));
          }
        }
      }
    }, this.options = Object.assign({}, D, s);
  }
  listen(s) {
    if (this.disconnectCallback)
      throw new Error("This instance has already listening.");
    this.listenTarget = s || document.body;
    const t = this.observeRoot(this.listenTarget);
    this.disconnectCallback = () => {
      t();
      for (const i in this.directives)
        for (const e of this.directives[i].elements)
          for (const n of this.findDirectivesFromNode(e, i))
            this.runDirectiveIfExists(n, e, "unmounted");
    };
    for (const i in this.directives)
      this.findAndRunDirectivesOfSubtree(this.listenTarget, "mounted", void 0, i);
  }
  register(s, t) {
    const i = this.getDirectiveAttrName(s);
    this.directives[i] = {
      name: i,
      handler: t,
      elements: []
    }, this.disconnectCallback && this.findAndRunDirectivesOfSubtree(this.listenTarget, "mounted", void 0, i);
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
  observeRoot(s) {
    const t = new MutationObserver((i) => {
      for (const e of i) {
        for (const r of e.addedNodes)
          this.findAndRunDirectivesOfNode(r, "mounted", e), this.findAndRunDirectivesOfSubtree(r, "mounted", e);
        for (const r of e.removedNodes)
          this.findAndRunDirectivesOfNode(r, "unmounted", e), this.findAndRunDirectivesOfSubtree(r, "unmounted", e);
        const n = e.target.getAttribute(e.attributeName);
        e.type === "attributes" && n != null && this.runDirectiveIfExists(
          e.attributeName,
          e.target,
          e.oldValue == null ? "mounted" : "updated",
          e
        );
      }
    });
    return t.observe(s, {
      attributes: !0,
      attributeOldValue: !0,
      childList: this.options.enableChildrenUpdated,
      characterData: !1,
      subtree: !0
    }), () => {
      t.disconnect();
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
  observeAttachedElement(s) {
    const t = new MutationObserver((i) => {
      for (const e of i)
        if (e.type === "attributes" && e.attributeName && e.target === s && (e.target.getAttribute(e.attributeName) ? this.runDirectiveIfExists(e.attributeName, e.target, "updated", e) : this.runDirectiveIfExists(e.attributeName, e.target, "unmounted", e)), this.options.enableChildrenUpdated && e.type === "childList")
          for (const n of this.findDirectivesFromNode(s))
            this.runDirectiveIfExists(n, s, "childrenUpdated", e);
    });
    return t.observe(s, {
      attributes: !0,
      childList: this.options.enableChildrenUpdated,
      subtree: this.options.enableChildrenUpdated,
      characterData: !0,
      attributeOldValue: !0,
      characterDataOldValue: !0
      // attributeFilter: Object.keys(this.directives)
    }), () => {
      t.disconnect();
    };
  }
  remove(s) {
    const t = this.getDirectiveAttrName(s);
    if (this.directives[t]) {
      for (const i of this.directives[t].elements)
        for (const e of this.findDirectivesFromNode(i, t))
          this.runDirectiveIfExists(e, i, "unmounted");
      delete this.directives[t];
    }
  }
  getPrefix() {
    return this.options.prefix;
  }
  getDirectiveAttrName(s) {
    return `${this.getPrefix()}${s}`;
  }
  disconnect() {
    this.disconnectCallback && (this.disconnectCallback(), this.disconnectCallback = void 0);
  }
  getDirectiveInfo(s) {
    return this.directives[s];
  }
  splitDirectiveArgs(s) {
    const [t, ...i] = s.split("."), [e, n] = t.split(":"), r = {};
    return i.forEach((d) => {
      r[p(d)] = !0;
    }), { name: e, arg: n || null, modifiers: r };
  }
  runDirectiveIfExists(s, t, i, e = void 0) {
    const { name: n, arg: r, modifiers: d } = this.splitDirectiveArgs(s), a = this.getDirectiveInfo(n);
    if (!a)
      return;
    if (i === "mounted")
      a.elements.push(t);
    else if (i === "unmounted") {
      const v = a.elements.indexOf(t);
      v > -1 && a.elements.splice(v, 1);
    }
    const l = a.handler, c = {
      directive: s,
      name: n,
      node: t,
      value: t.getAttribute(s),
      oldValue: e?.oldValue,
      mutation: e,
      handler: l,
      arg: r,
      modifiers: d,
      instance: this
    };
    f.currentContext = { el: t, binding: c }, this.hooks?.[i]?.before && this.hooks[i]?.before?.(t, c), i in l && l[i]?.(t, c), this.hooks?.[i]?.after && this.hooks[i]?.after?.(t, c);
    const m = this.options.eventPrefix;
    t.dispatchEvent(new CustomEvent(m + A(i), { detail: { el: t, binding: c } })), t.dispatchEvent(new CustomEvent(`__wd:${i}:${c.directive}`, { detail: { el: t, binding: c } })), f.currentContext = null;
  }
  findAndRunDirectivesOfNode(s, t, i, e) {
    for (const n of this.findDirectivesFromNode(s, e))
      this.runDirectiveIfExists(n, s, t, i);
  }
  findAndRunDirectivesOfSubtree(s, t, i, e) {
    if ("querySelectorAll" in s)
      if (this.options.enableAttrParams)
        for (const n of s.querySelectorAll("*"))
          this.findAndRunDirectivesOfNode(n, t, i, e);
      else {
        const n = e ? [e] : Object.keys(this.directives);
        for (const r of n)
          for (const d of s.querySelectorAll(`[${r}]`))
            this.runDirectiveIfExists(r, d, t);
      }
  }
  findDirectivesFromNode(s, t) {
    const i = [];
    return s.getAttributeNames ? (s.getAttributeNames().forEach((e) => {
      e.startsWith(this.getPrefix()) && (t ? e.startsWith(t) && i.push(e) : i.push(e));
    }), i) : [];
  }
};
f.currentContext = null;
let h = f;
export {
  h as default,
  C as nextTick,
  x as singleton,
  b as useCurrentContext,
  E as useEventListener
};
//# sourceMappingURL=web-directive.js.map
