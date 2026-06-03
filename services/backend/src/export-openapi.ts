// Exporte la spec OpenAPI de l'app vers packages/api-client/openapi.json.
// Lancé via tsx. Pas besoin que le serveur tourne : on importe l'app
// directement et on appelle sa route /openapi.json en mémoire.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import app from "./index";

async function main() {
  const res = await app.request("/openapi.json");
  const spec = await res.json();
  const outPath = resolve(
    import.meta.dirname,
    "../../../packages/api-client/openapi.json"
  );
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(spec, null, 2));
  const count = Object.keys((spec as any).paths).length;
  console.log(`Spec OpenAPI exportée (${count} chemins) -> ${outPath}`);
}

main().catch((e) => {
  console.error("Export échoué:", e);
  process.exit(1);
});