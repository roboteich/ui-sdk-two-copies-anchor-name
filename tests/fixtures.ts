import { expect, type Locator, type Page, test as base } from "@playwright/test"
import type { Fix, RootName, ScenarioName } from "../src/scenarios"

const page = `<!doctype html>
<meta charset="utf-8">
<style>
  body { margin: 0; min-height: 100vh; }
  #root-a { position: absolute; left: 120px; top: 40px; }
  #root-b { position: absolute; right: 120px; top: 40px; }
</style>
<div id="root-a"></div>
<div id="root-b"></div>`

/** How core reaches the page: once, or bundled separately into each app. */
export interface Setup {
  title: string
  /** Whether popups are expected to keep to their own triggers. */
  works: boolean
  bundle(scenario: ScenarioName, root: RootName): string
}

const copies = (fix?: Fix): Setup["bundle"] => (scenario, root) =>
  `${scenario}.${root}${fix ? `.${fix}` : ""}.js`

export const setups: readonly Setup[] = [
  { title: "one copy of core", works: true, bundle: (scenario) => `${scenario}.single.js` },
  { title: "two copies of core", works: false, bundle: copies() },
  { title: "two copies, per-copy token in the name", works: true, bundle: copies("token") },
  { title: "two copies, counter shared on globalThis", works: true, bundle: copies("shared") },
]

class Widget {
  readonly trigger: Locator
  readonly popup: Locator

  constructor(page: Page, readonly name: RootName) {
    this.trigger = page.getByTestId(`trigger-${name}`)
    this.popup = page.getByTestId(`popup-${name}`)
  }

  /** The popup sits centered on its own trigger, placed by CSS anchor positioning. */
  async expectAnchored(): Promise<void> {
    await expect(this.popup).toBeVisible()
    await expect
      .poll(() => this.offset(), { message: `popup ${this.name} is centered on trigger ${this.name}` })
      .toBeLessThanOrEqual(1)
    const anchorName = await this.trigger.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("anchor-name")
    )
    expect(anchorName, `trigger ${this.name} has an anchor name`).toMatch(/^--ui-anchor-/)
    await expect(this.popup, `popup ${this.name} is placed by CSS`).toHaveCSS(
      "position-anchor",
      anchorName
    )
  }

  /** Distance between the centers of the popup and the trigger, in px. */
  private async offset(): Promise<number> {
    const [trigger, popup] = await Promise.all([this.trigger.boundingBox(), this.popup.boundingBox()])
    if (!trigger || !popup) {
      return Number.POSITIVE_INFINITY
    }
    return Math.abs(popup.x + popup.width / 2 - (trigger.x + trigger.width / 2))
  }
}

interface Fixtures {
  a: Widget
  b: Widget
  /** Adds one root's bundle to the page and waits for it to render. */
  load(setup: Setup, scenario: ScenarioName, root: RootName): Promise<void>
}

export const test = base.extend<Fixtures>({
  page: async ({ page: target }, use) => {
    await target.setContent(page)
    await use(target)
  },
  a: async ({ page: target }, use) => use(new Widget(target, "a")),
  b: async ({ page: target }, use) => use(new Widget(target, "b")),
  load: async ({ page: target }, use) => {
    const loaded = new Set<string>()
    await use(async (setup, scenario, root) => {
      const bundle = setup.bundle(scenario, root)
      // One copy serves both roots, so it loads once.
      if (!loaded.has(bundle)) {
        loaded.add(bundle)
        await target.addScriptTag({ path: `dist/${bundle}` })
      }
      await expect(target.getByTestId(`trigger-${root}`)).toBeVisible()
    })
  },
})

export { expect }
