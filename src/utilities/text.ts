export function toCamelCase(text: string): string {
  return text.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function toKebabCase(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
