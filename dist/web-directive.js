const n = "_webDirectiveDisconnectors", h = {
  prefix: "w-"
};
class u {
  constructor(i = {}) {
    this.directives = {}, this.instances = {}, this.listenTarget = document.body, this.hooks = {
      mounted: {
        before: (t, e) => {
          e[n] = e[n] || {}, e[n][t] = this.observeChildren(e), this.instances[t] = this.instances[t] || [], this.instances[t].push(e);
        }
      },
      unmounted: {
        after: (t, e) => {
          e[n] && e[n][t] && (e[n][t](), delete e[n][t]);
        }
      }
    }, this.options = Object.assign({}, h, i);
  }
  register(i, t) {
    const e = this.getDirectiveAttrName(i);
    this.directives[e] = t, this.disconnectCallback && this.mountDirectiveInitial(e);
  }
  mountDirectiveInitial(i) {
    const t = Array.from(this.listenTarget.querySelectorAll("*"));
    for (const e of t) {
      const s = e.getAttributeNames();
      for (const r of s)
        console.log(r), r.startsWith(i) && this.runDirectiveIfExists(i, e, "mounted");
    }
  }
  remove(i) {
    const t = this.getDirectiveAttrName(i);
    this.instances[t] && (this.instances[t].forEach((e) => {
      this.runDirectiveIfExists(t, e, "unmounted");
    }), delete this.instances[t]), delete this.directives[t];
  }
  getPrefix() {
    return this.options.prefix;
  }
  getDirectiveAttrName(i) {
    return `${this.getPrefix()}${i}`;
  }
  observeRoot(i) {
    const t = new MutationObserver((e) => {
      e.forEach((s) => {
        [].forEach.call(s.addedNodes, (r) => {
          this.findDirectivesFromNode(r).forEach((c) => {
            this.runDirectiveIfExists(c, r, "mounted", s);
          });
          for (const c in this.directives)
            "querySelectorAll" in r && r.querySelectorAll(`[${c}]`).forEach((o) => {
              this.runDirectiveIfExists(c, o, "mounted", s);
            });
        }), [].forEach.call(s.removedNodes, (r) => {
          this.findDirectivesFromNode(r).forEach((c) => {
            this.runDirectiveIfExists(c, r, "unmounted", s);
          });
        }), s.type === "attributes" && s.oldValue == null && this.runDirectiveIfExists(s.attributeName, s.target, "mounted", s);
      });
    });
    return t.observe(i, {
      attributes: !0,
      attributeOldValue: !0,
      childList: !0,
      characterData: !1,
      subtree: !0
    }), () => {
      t.disconnect();
    };
  }
  observeChildren(i) {
    const t = new MutationObserver((e) => {
      e.forEach((s) => {
        s.type === "attributes" && !s.target.getAttribute(s.attributeName) && this.runDirectiveIfExists(s.attributeName, s.target, "unmounted", s), this.findDirectivesFromNode(s.target).forEach((r) => {
          (s.type === "attributes" || s.type === "childList") && this.runDirectiveIfExists(r, s.target, "updated", s);
        });
      });
    });
    return t.observe(i, {
      attributes: !0,
      childList: !0,
      characterData: !0,
      attributeOldValue: !0,
      characterDataOldValue: !0,
      attributeFilter: Object.keys(this.directives)
    }), () => {
      t.disconnect();
    };
  }
  listen(i) {
    if (this.disconnectCallback)
      throw new Error("This instance has already listening.");
    this.listenTarget = i || document.body, this.disconnectCallback = this.observeRoot(this.listenTarget);
    for (const t in this.directives)
      this.mountDirectiveInitial(t);
  }
  disconnect() {
    this.disconnectCallback && (this.disconnectCallback(), this.disconnectCallback = void 0);
  }
  getDirective(i) {
    return this.directives[i];
  }
  splitDirectiveArgs(i) {
    const [t, ...e] = i.split("."), [s, r] = t.split(":"), c = {};
    return e.forEach((o) => {
      c[o] = !0;
    }), { name: s, arg: r || null, modifiers: c };
  }
  runDirectiveIfExists(i, t, e, s = void 0) {
    console.log(i);
    const { name: r, arg: c, modifiers: o } = this.splitDirectiveArgs(i);
    i = r;
    const a = this.getDirective(i);
    a && e in a && (this.hooks?.[e]?.before && this.hooks[e]?.before?.(i, t), a[e]?.(t, {
      directive: i,
      node: t,
      value: t.getAttribute(i),
      oldValue: s?.oldValue,
      mutation: s,
      handler: a,
      arg: c,
      modifiers: o
    }), this.hooks?.[e]?.after && this.hooks[e]?.after?.(i, t));
  }
  findDirectivesFromNode(i) {
    const t = [];
    return i.getAttributeNames ? (i.getAttributeNames().forEach((e) => {
      e.startsWith(this.getPrefix()) && t.push(e);
    }), t) : [];
  }
}
export {
  u as default
};
//# sourceMappingURL=web-directive.js.map
