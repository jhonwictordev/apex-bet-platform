import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const VIEWPORTS = [
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
  { name: "laptop-1440x900", width: 1440, height: 900 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

const PAGES = [
  { name: "homepage", path: "/" },
  { name: "sportsbook", path: "/esportes" },
  { name: "casino", path: "/cassino" },
  { name: "admin", path: "/admin" },
];

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/screenshots");
const ARTIFACTS_DIR = "C:\\Users\\winc\\.gemini\\antigravity\\brain\\4db22930-c838-413d-8d7b-815888479959";

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function runAudit() {
  console.log("=== INICIANDO AUDITORIA VISUAL AUTOMATIZADA COM PLAYWRIGHT ===");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testando Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      const url = `http://localhost:3000${p.path}`;
      const screenshotFilename = `${p.name}-${vp.name}.png`;
      const localPath = path.join(OUTPUT_DIR, screenshotFilename);
      const artifactPath = path.join(ARTIFACTS_DIR, screenshotFilename);

      try {
        console.log(`Navegando para ${url}...`);
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(1000); // Allow animations to settle

        await page.screenshot({ path: localPath, fullPage: false });
        fs.copyFileSync(localPath, artifactPath);

        console.log(`✅ Capturado com sucesso: ${screenshotFilename}`);
        results.push({ page: p.name, viewport: vp.name, success: true, file: screenshotFilename });
      } catch (err) {
        console.error(`❌ Erro ao capturar ${url}: ${err.message}`);
        results.push({ page: p.name, viewport: vp.name, success: false, error: err.message });
      }
    }

    await context.close();
  }

  await browser.close();
  console.log("\n=== AUDITORIA VISUAL CONCLUÍDA ===");
  console.log(JSON.stringify(results, null, 2));
}

runAudit().catch(console.error);
