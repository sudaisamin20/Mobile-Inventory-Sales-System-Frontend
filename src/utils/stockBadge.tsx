import { Badge } from "../components";

export function stockBadge(s: string) {
  const map: Record<
    string,
    { v: "green" | "yellow" | "red" | "purple"; l: string }
  > = {
    available: { v: "green", l: "Available" },
    low: { v: "yellow", l: "Low Stock" },
    "out-of-stock": { v: "red", l: "Out of Stock" },
    reserved: { v: "purple", l: "Reserved" },
  };
  const m = map[s] ?? { v: "gray" as any, l: s };
  return (
    <Badge variant={m.v} size="sm">
      {m.l}
    </Badge>
  );
}
