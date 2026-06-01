import { ossTips, enterpriseTips } from "./tips.generated";
import { isEnterprise, type EnvType } from "../types/config";

// Returns the official helm-docs comment for a given dotted chart path,
// picking the OSS or Enterprise chart depending on the selected flavor.
export function tipFor(env: EnvType, path: string): string | undefined {
  const map = isEnterprise(env) ? enterpriseTips : ossTips;
  return map[path] ?? ossTips[path] ?? enterpriseTips[path];
}
