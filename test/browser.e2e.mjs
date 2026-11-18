import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
mkdirSync("work", { recursive: true });
async function startServer() {
  const child = spawn(process.execPath, ["lan.mjs", "--port", "8790"], {
    cwd: process.cwd(),
    stdio: "pipe",
    env: { ...process.env, GRUFT_DB_PATH: "work/browser-test.sqlite" },
  });
  await new Promise((resolve, reject) => {
    child.stdout.once("data", resolve);
    child.once("error", reject);
    child.once("exit", (code) =>
      reject(Error("Testserver konnte nicht starten: " + code)),
    );
  });
  return child;
}
let server = await startServer();
let browser;
const base = "http://127.0.0.1:8790";
let errors = [];
try {
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROMIUM_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox"],
  });
  const tablet = await (
    await browser.newContext({ viewport: { width: 1366, height: 1024 } })
  ).newPage();
  tablet.on("pageerror", (e) => errors.push(e.message));
  await tablet.goto(base);
  await tablet
    .getByRole("button", { name: "Auf dem Tablet öffnen", exact: true })
    .click();
  await tablet.locator(".code").waitFor();
  const code = await tablet.locator(".code").innerText();
  assert.match(code, /^[A-Z2-9]{6}$/);
  assert.ok(
    await tablet
      .locator(".qr")
      .evaluate((e) => e.complete && e.naturalWidth > 0),
  );
  const phones = [];
  for (const alias of ["Dave", "Melli", "Nico"]) {
    const page = await (
      await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      })
    ).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/?join=" + code);
    await page.getByLabel("Dein Name").fill(alias);
    await page.getByRole("button", { name: "Beitreten", exact: true }).click();
    await page
      .getByRole("heading", { name: "Du bist dabei, " + alias })
      .waitFor();
    phones.push(page);
  }
  const [a, b, c] = phones;
  await a.getByRole("button", { name: "Gemeinsam aufbrechen" }).click();
  await a.locator("#phrase").waitFor();
  await tablet.locator(".room-art").waitFor();
  assert.equal(await tablet.locator("form,button").count(), 0);
  async function act(page, text, match) {
    await page.locator("#phrase").fill(text);
    await page.getByRole("button", { name: "Senden", exact: true }).click();
    await page.waitForFunction(
      ([text, match]) => {
        const m = [...document.querySelectorAll(".chat-message")];
        return (
          m.some(
            (e) =>
              e.classList.contains("player") && e.textContent.includes(text),
          ) &&
          m.at(-1)?.classList.contains("narrator") &&
          m.at(-1).textContent.includes(match)
        );
      },
      [text, match],
    );
  }
  async function go(target, heading) {
    await act(a, "Ich gehe " + target, "Stimmen");
    await act(b, "Ich stimme zu", heading);
    for (const page of phones)
      await page
        .locator(".phone-heading")
        .getByText(heading, { exact: true })
        .waitFor();
  }
  await act(a, "Ich untersuche den Gong", "Filz");
  await act(b, "Ich ziehe den Filz ab", "frei schwingen");
  await act(c, "Ich schlage den Gong", "Tor schwingt auf");
  await go("ins Archiv", "Das Archiv der Ausreden");
  await act(a, "Ich öffne die Truhe", "verschlossen");
  await act(b, "Ich untersuche das Schloss", "kleine Krone");
  await go("zurück zum Eingang", "Das Tor ohne Öffnungszeiten");
  await act(c, "Ich nehme den Schlüssel aus dem Becken", "winzige Krone");
  await go("ins Archiv", "Das Archiv der Ausreden");
  await act(b, "Ich hänge den Draht an der Glocke aus", "lautlos");
  await act(a, "Ich öffne die Truhe", "unterschriebene Einladung");
  await act(c, "Ich nehme das Siegel", "Mulde");
  await act(b, "Ich drücke das Siegel in die Tür", "öffnet sich");
  await go("in die Kapelle", "Die letzte Einladung");
  await act(a, "Ich zeige der Braut die Einladung", "als Pfand");
  await act(c, "Ich läute die Glocke", "dampfende Schüsseln");
  await act(b, "Ich nehme die Krone", "Morgenlicht");
  await tablet.bringToFront();
  await tablet.waitForFunction(() =>
    document
      .querySelector(".narration")
      ?.textContent.includes("Du nimmst die Krone"),
  );
  assert.ok(
    await tablet
      .locator(".room-art")
      .evaluate((e) => e.complete && e.naturalWidth > 0),
  );
  await tablet.screenshot({ path: "work/tablet.png", fullPage: true });
  await a.bringToFront();
  await a.waitForFunction(() =>
    document
      .querySelector("#chat")
      ?.textContent.includes("Du nimmst die Krone"),
  );
  await a.screenshot({ path: "work/phone.png", fullPage: true });
  for (const page of [tablet, ...phones])
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  await act(a, "Ich gehe zum Ausgang", "Stimmen");
  await act(b, "Ich stimme zu", "Der erste Abschnitt ist geschafft");
  await a.getByRole("heading", { name: "Die Krone gehört euch." }).waitFor();
  await new Promise((resolve) => {
    server.once("exit", resolve);
    server.kill();
  });
  server = await startServer();
  await tablet.bringToFront();
  await tablet.reload();
  await tablet.getByText(/Der erste Abschnitt ist geschafft/).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: tablet + 3 isolated phones; QR, complete chapter, shared inventory, majority movement, backtracking, reload + server restart persistence, responsive layouts, no JS errors.",
  );
} finally {
  await browser?.close();
  server.kill();
}
