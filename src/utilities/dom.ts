import WebDirective from '../index.ts';
import { useCurrentContext } from './lifecycle.ts';

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
export function singleton<E extends Element, T = any>(el: E, name: string, factory: false): T | undefined;
export function singleton<E extends Element, T = any>(el: E, name: string, factory: (el: E) => T): T;
export function singleton<E extends Element, T = any>(el: E, name: string, factory?: ((el: E) => T) | false): T | undefined {
  const element = el as any;

  element[storageKey] ??= {};

  if (factory === false) {
    const instance = element[storageKey][name];

    delete element[storageKey][name];
    return instance;
  }

  if (!element[storageKey][name] && factory) {
    element[storageKey][name] = factory(el);
  }

  return element[storageKey][name];
}

function createUid() {
  return Math.random().toString(36).substring(2, 10);
}

export function useEventListener(el: Element, event: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
  const { el: baseEl, binding } = useCurrentContext();

  el.addEventListener(event, handler, options);

  const off = () => {
    el.removeEventListener(event, handler, options);
  };

  baseEl.addEventListener('__wd:unmounted:' + binding.directive, (e) => {
    off();
  }, { once: true });

  return off;
}
