type ClassValue = string | false | null | undefined;

export function css(styles: Record<string, string>, ...values: ClassValue[]) {
  return values
    .flatMap((value) => (value ? value.split(/\s+/u) : []))
    .filter(Boolean)
    .map((className) => styles[className] ?? className)
    .join(" ");
}
