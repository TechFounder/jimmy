// One shared helper for specs that read or plant rows in the LOCAL D1 file.
// The dev server holds the same SQLite file open, so a CLI call can collide
// with it; retry with backoff and surface wrangler's stderr on real failure.
import { execFileSync } from "node:child_process";

const DB = "contact-sends";

export function d1<T = Record<string, unknown>>(sql: string): T[] {
  let lastErr = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const out = execFileSync(
        "npx",
        ["wrangler", "d1", "execute", DB, "--local", "--json", "--command", sql],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      const parsed = JSON.parse(out) as { results: T[] }[];
      return parsed.flatMap((r) => r.results ?? []);
    } catch (err) {
      lastErr = String((err as { stderr?: string }).stderr ?? err);
      execFileSync("sleep", [String(0.5 * (attempt + 1))]);
    }
  }
  throw new Error(`d1() failed.\nSQL: ${sql}\nwrangler stderr:\n${lastErr}`);
}
