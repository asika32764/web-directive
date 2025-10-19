
export function setData(el: Element, name: string, value: any) {
  // @ts-ignore
  el[name] = value;
}

export function getDate(el: Element, name: string): any {
  // @ts-ignore
  return el[name];
}

const storageKey = `__webDirective.${createUid()}`;

export function singleton<E extends Element, T = any>(el: E, name: string): T | undefined;
export function singleton<E extends Element, T = any>(el: E, name: string, factory: (el: E) => T): T;
export function singleton<E extends Element, T = any>(el: E, name: string, factory?: (el: E) => T): T | undefined {
  // @ts-ignore
  el[storageKey] ??= {};

  // @ts-ignore
  if (!el[storageKey][name] && factory) {
    // @ts-ignore
    el[storageKey][name] = factory(el);
  }

  // @ts-ignore
  return el[storageKey][name];
}

function createUid() {
  return Math.random().toString(36).substring(2, 10);
}
