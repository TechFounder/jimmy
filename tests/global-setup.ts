// Creates the shared contact_sends table in the LOCAL D1 before every run.
// The real schema lives in the noordinary repo, which owns the migrations;
// this repo only binds the shared `contact-sends` database, so it has no
// migrations of its own. tests/fixtures/contact_sends.sql mirrors it.
import { execFileSync } from "node:child_process";

export default function globalSetup() {
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "contact-sends", "--local", "--file", "tests/fixtures/contact_sends.sql"],
    { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, CI: "true" } },
  );
}
