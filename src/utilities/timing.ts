export function nextTick(): Promise<void> {
  return Promise.resolve().then();
}

