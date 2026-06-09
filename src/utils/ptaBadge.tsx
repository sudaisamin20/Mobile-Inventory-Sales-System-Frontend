import { Badge } from "../components";

export function ptaBadge(s: string) {
  if (s === "approved")
    return (
      <Badge variant="green" size="sm">
        PTA Approved
      </Badge>
    );
  if (s === "pending")
    return (
      <Badge variant="yellow" size="sm">
        PTA Pending
      </Badge>
    );
  if (s === "blocked")
    return (
      <Badge variant="red" size="sm">
        PTA Blocked
      </Badge>
    );
  return (
    <Badge variant="gray" size="sm">
      PTA Unknown
    </Badge>
  );
}
