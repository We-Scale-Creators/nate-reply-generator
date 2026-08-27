import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";

const files = ['payload/part00.b64', 'payload/part01.b64', 'payload/part02.b64', 'payload/part03.b64', 'payload/part04.b64', 'payload/part05.b64', 'payload/part06.b64', 'payload/part07.b64'];
const payload = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("");
const html = gunzipSync(Buffer.from(payload, "base64"));
const sha256 = createHash("sha256").update(html).digest("hex");
const expected = "9539dfe4cc3dfcab04f9de85740468d349c72b185528293ceacaa80f647c779e";

if (sha256 !== expected) throw new Error(`Omnia source checksum mismatch: ${sha256}`);
const source = html.toString("utf8");
if (!source.includes("Creative Asset System") || !source.includes("V4.1 QA") || source.length < 300000) {
  throw new Error("Omnia source integrity validation failed");
}

await mkdir("public", { recursive: true });
await writeFile("public/index.html", html);
await writeFile("public/health.txt", `ok ${sha256}\n`);
console.log(`Built Omnia V4.1 QA: ${html.length} bytes, sha256=${sha256}`);
