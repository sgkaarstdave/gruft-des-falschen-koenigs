import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
mkdirSync("work", { recursive: true });
let server, browser;
try {
  server = spawn(process.execPath, ["lan.mjs", "--port", "8790"], {
    cwd: process.cwd(),
    stdio: "pipe",
    env: { ...process.env, GRUFT_DB_PATH: "work/crawler-browser.sqlite" },
  });
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
    server.once("exit", (n) => reject(Error("Serverstart " + n)));
  });
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROMIUM_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox"],
  });
  const errors = [];
  const page = async (mobile = false) => {
    const p = await (
      await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1366, height: 1024 },
        isMobile: mobile,
        hasTouch: mobile,
      })
    ).newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    return p;
  };
  const tablet = await page();
  const url = "http://127.0.0.1:8790";
  await tablet.goto(url);
  await tablet
    .getByRole("button", { name: "Auf dem Tablet öffnen", exact: true })
    .click();
  await tablet.locator(".code").waitFor();
  const code = await tablet.locator(".code").innerText();
  const phones = [];
  for (const [alias, cls] of [
    ["Melli", "Tintenbändigerin"],
    ["Dave", "Thekenritter"],
  ]) {
    const p = await page(true);
    await p.goto(url + "/?join=" + code);
    await p.getByLabel("Dein Heldenname").fill(alias);
    await p.getByRole("button", { name: "Beitreten", exact: true }).click();
    await p.getByRole("button", { name: new RegExp(cls) }).click();
    await p.locator(".class-card.selected").waitFor();
    phones.push(p);
  }
  const [a, b] = phones;
  await a.bringToFront();
  await a.getByRole("button", { name: "In die Gruft!" }).click();
  await a.locator("#phrase").waitFor();
  async function at(p, room) {
    await p.bringToFront();
    await p.locator(".phone-top").getByText(room).waitFor();
  }
  async function act(p, text, contains) {
    await p.bringToFront();
    await p.locator("#phrase").fill(text);
    await p.getByRole("button", { name: "Senden", exact: true }).click();
    await p.waitForFunction(
      (s) =>
        document
          .querySelector("#chat")
          ?.lastElementChild?.textContent.includes(s),
      contains,
    );
  }
  await a.getByRole("button", { name: "Steingesicht ansprechen" }).click();
  await a.getByRole("button", { name: "Steingesicht ansprechen" }).waitFor({ state: "detached" });
  await a.getByRole("button", { name: /^Weggabelung/ }).click();
  await tablet.locator(".table-actions").getByText(/Weggabelung.*1\/2/).waitFor();
  await b.bringToFront();
  await b.getByRole("button", { name: /^Weggabelung/ }).click();
  await tablet.locator(".stage h1").filter({ hasText: /Weggabelung/ }).waitFor();
  await at(a, /Weggabelung/);
  await act(a, "Ich gehe zum Lager", "Stimmen");
  await act(b, "Ich stimme zu", "Vorratsgrotte");
  await at(a, /Vorratsgrotte/);
  await act(a, "Ich öffne den Rucksack", "Eisenschlüssel");
  await act(a, "Ich gehe zur Kreuzung", "Stimmen");
  await act(b, "Ich stimme zu", "Weggabelung");
  await at(a, /Weggabelung/);
  await act(a, "Ich öffne die Eichentür", "öffnet die Eichentür");
  await act(a, "Ich gehe zur Wache", "Stimmen");
  await act(b, "Ich stimme zu", "Jetzt: Melli");
  await at(a, /Skelettamt/);
  await a
    .getByRole("navigation", { name: "Heldenansicht" })
    .getByRole("button", { name: "Skills", exact: true })
    .click();
  await a.getByRole("heading", { name: "Furzwolken-Schlag" }).waitFor();
  await a.locator('[data-skill="furz"] button').click();
  await a.getByRole("region", { name: "Würfelplan" }).waitFor();
  assert.match(await a.locator(".dice-plan").innerText(), /35%/);
  assert.match(await a.locator(".risk-copy").innerText(), /Jeder/);
  assert.equal(await a.locator("input[type=number]").count(), 0);
  await tablet.bringToFront();
  await tablet.getByText("Wurf hängt?", { exact: true }).click();
  await tablet.getByRole("button", { name: "Wurf abbrechen" }).click();
  await a.bringToFront();
  await a.locator(".dice-plan").waitFor({ state: "detached" });
  await a.locator('[data-skill="furz"] button').click();
  await a.locator(".dice-plan").waitFor();
  await a.screenshot({ path: "work/risiko.webp", fullPage: true });
  await a
    .getByRole("button", { name: "🎲 Jetzt würfeln", exact: true })
    .click();
  await a.locator(".dice-plan").waitFor({ state: "detached" });
  await a.getByRole("button", { name: "Held", exact: true }).click();
  await a.getByRole("heading", { name: "Melli", exact: true }).waitFor();
  await a.screenshot({ path: "work/held.webp", fullPage: true });
  await a.getByRole("button", { name: "Rucksack", exact: true }).click();
  await a.getByRole("heading", { name: "Dein Rucksack" }).waitFor();
  await a.getByRole("button", { name: "Chat", exact: true }).click();
  await b.bringToFront();
  await b.locator("#phrase").waitFor();
  await b.getByRole("button", { name: "Verteidigen", exact: true }).click();
  await tablet.locator(".monster-panel").getByText(/Melli am Zug/).waitFor();
  await tablet.bringToFront();
  await tablet.locator(".monster-panel").waitFor();
  await tablet.waitForFunction(
    () =>
      document.querySelector(".room-art")?.complete &&
      document.querySelector(".room-art")?.naturalWidth > 0,
  );
  assert.equal(await tablet.locator("button,form").count(), 0);
  await tablet.screenshot({ path: "work/tablet-crawler.webp", fullPage: true });
  for (const p of [tablet, ...phones])
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: tablet and 2 isolated phones, class sheets, inventory, skills, risk preview, server virtual die, turn advancement and responsive layouts.",
  );
} finally {
  await browser?.close();
  server?.kill();
}
