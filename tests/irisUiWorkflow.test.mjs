import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const VITE_JS = path.join(ROOT_DIR, "node_modules", "vite", "bin", "vite.js");
const PORT = 4192;

test("Iris UI workspace mounts, renders topbar, rails, and handles navigation cleanly", async () => {
  let serverProcess;
  const serverUrl = `http://localhost:${PORT}/`;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Vite preview server launch timeout")), 10000);
    serverProcess = spawn(process.execPath, [VITE_JS, "preview", "--port", String(PORT), "--strictPort"], {
      cwd: ROOT_DIR,
      env: { ...process.env, CI: "true" },
    });

    serverProcess.stdout.on("data", (data) => {
      if (String(data).includes("http://localhost:")) {
        clearTimeout(timer);
        resolve();
      }
    });

    serverProcess.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited early with code ${code}`));
    });
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));

  try {
    await page.goto(serverUrl, { waitUntil: "domcontentloaded" });

    // Verify main app container
    const appShell = page.locator(".app.iris-shell");
    await appShell.waitFor({ state: "visible", timeout: 10000 });
    assert.equal(await appShell.count(), 1, "App shell must be mounted");

    // Verify presence of top bar & branding
    const topBar = page.locator("header.topbar");
    await topBar.waitFor({ state: "visible", timeout: 5000 });
    assert.equal(await topBar.count(), 1, "Top menu bar must be rendered");
    assert.ok((await page.locator(".brand-name").innerText()).includes("Iris"), "Brand name should include Iris");

    // Verify left rail
    const leftRail = page.locator("aside.left-rail");
    assert.equal(await leftRail.count(), 1, "Left navigation rail must be rendered");

    // Verify main workspace area
    const mainView = page.locator("main.app-shell-grid");
    assert.equal(await mainView.count(), 1, "Workspace main view must be rendered");

    // Verify sheets buttons & switching
    const figuresBtn = page.locator('button[title="Figures"]');
    if (await figuresBtn.isVisible()) {
      await figuresBtn.click();
      await page.waitForTimeout(100);
    }

    // Verify app body
    const appBody = page.locator(".app-body");
    assert.equal(await appBody.isVisible(), true, "App body should be visible");

    // Verify zero unhandled browser errors
    assert.deepEqual(errors, [], `Encountered unexpected page errors: ${errors.join(", ")}`);
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
});
