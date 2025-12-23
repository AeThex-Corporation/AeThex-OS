import { execSync } from "child_process";

export function build() {
  execSync("npm run build", { stdio: "inherit" });
}

export function test() {
  execSync("./test-implementation.sh", { stdio: "inherit" });
}

export function migrate() {
  execSync("npx drizzle-kit migrate:push", { stdio: "inherit" });
}

export function dev() {
  execSync("npm run dev", { stdio: "inherit" });
}

export function server() {
  execSync("ts-node server/index.ts", { stdio: "inherit" });
}

export function lint() {
  execSync("npm run lint", { stdio: "inherit" });
}

export function format() {
  execSync("npm run format", { stdio: "inherit" });
}

export function migrateStatus() {
  execSync("npx drizzle-kit status", { stdio: "inherit" });
}

export function seed() {
  execSync("ts-node script/seed.ts", { stdio: "inherit" });
}
