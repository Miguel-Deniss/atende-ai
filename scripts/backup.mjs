import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const backupDir = path.resolve(process.env.BACKUP_DIR || "backups");
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const retentionDays = Number(process.env.RETENTION_DAYS || "30");

if (!databaseUrl) {
  throw new Error("Configure DIRECT_URL ou DATABASE_URL antes de executar o backup.");
}

const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "_");
const backupFile = path.join(backupDir, `atendeai_${timestamp}.dump`);
await mkdir(backupDir, { recursive: true });

await new Promise((resolve, reject) => {
  const child = spawn(
    "pg_dump",
    ["--dbname", databaseUrl, "--no-owner", "--no-acl", "--format=c", "--compress=9", "--file", backupFile],
    { stdio: "inherit", shell: process.platform === "win32" }
  );
  child.once("error", reject);
  child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`pg_dump terminou com codigo ${code}`)));
});

const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
for (const name of await readdir(backupDir)) {
  if (!/^atendeai_.*\.dump$/.test(name)) continue;
  const file = path.join(backupDir, name);
  if ((await stat(file)).mtimeMs < cutoff) await unlink(file);
}

process.stdout.write(`Backup criado: ${backupFile}\n`);
