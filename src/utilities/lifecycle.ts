import WebDirective from '../index';

export function useCurrentContext() {
  if (!WebDirective.currentContext) {
    throw new Error('No active context found.');
  }

  return WebDirective.currentContext;
}
