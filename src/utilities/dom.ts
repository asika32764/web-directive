export function setData(el: Element, name: string, value: any) {
  // @ts-ignore
  el[name] = value;
}

export function getDate(el: Element, name: string): any {
  // @ts-ignore
  return el[name];
}
