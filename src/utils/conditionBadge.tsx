import { Badge } from "../components";

export function conditionBadge(c: string) {
  const map: Record<string, { v: "green"|"blue"|"yellow"|"orange"; l: string }> = {
    new:         { v: "green",  l: "New"         },
    "open-box":  { v: "blue",   l: "Open Box"    },
    used:        { v: "yellow", l: "Used"         },
    refurbished: { v: "orange", l: "Refurbished" },
  };
  const m = map[c] ?? { v: "gray" as any, l: c };
  return <Badge variant={m.v} size="sm">{m.l}</Badge>;
}