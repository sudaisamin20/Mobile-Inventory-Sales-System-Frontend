export function formatPrice(n: number) {
  return `₨${n?.toLocaleString("en-PK") ?? 0}`;
}