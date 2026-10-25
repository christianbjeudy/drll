import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const failures = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".wrangler") return [];
    return entry.isDirectory() ? walk(path) : [path];
  });
}

for (const file of walk(root).filter((path) => extname(path) === ".js")) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failures.push(`${relative(root, file)} has invalid JavaScript: ${error.stderr?.toString() || error.message}`);
  }
}

for (const htmlName of ["index.html", "admin.html"]) {
  const html = readFileSync(join(root, htmlName), "utf8");
  for (const match of html.matchAll(/(?:href|src)=["'](\/[^"'#?]+)["']/gu)) {
    const pathname = match[1];
    if (pathname === "/" || pathname.startsWith("/api/") || pathname.startsWith("/media/")) continue;
    if (!existsSync(join(root, pathname.slice(1)))) failures.push(`${htmlName} references missing file ${pathname}`);
  }
}

const home = readFileSync(join(root, "index.html"), "utf8");
if (!home.includes("Made by <strong>christianbjeudy.com</strong>")) {
  failures.push("Required footer credit is missing or changed.");
}

const required = [
  "assets/site.js",
  "assets/admin.js",
  "assets/styles.css",
  "assets/admin.css",
  "src/index.js",
  "src/handlers/api/site.js",
  "src/handlers/api/admin/login.js",
  "src/handlers/api/admin/entries/index.js",
  "src/handlers/api/admin/settings.js",
];
for (const path of required) {
  if (!existsSync(join(root, path))) failures.push(`Required source file is missing: ${path}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Source integrity checks passed.");
}
