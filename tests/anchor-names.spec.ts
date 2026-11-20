import { expect, setups, test } from "./fixtures"

for (const setup of setups) {
  test.describe(setup.title, () => {
    // Remove this line to see the failing assertions for two unpatched copies.
    test.fail(!setup.works, "each copy names its first anchor --ui-anchor-1")

    test("an open popover stays put when another root's tooltip opens", async ({ a, b, load, page }) => {
      await load(setup, "tooltip", "a")
      await load(setup, "tooltip", "b")

      await a.trigger.click()
      await a.expectAnchored()

      await b.trigger.hover()
      await expect(b.popup).toBeVisible()
      await a.expectAnchored()

      await page.mouse.move(600, 600)
      await expect(b.popup).toBeHidden()
      await a.expectAnchored()
    })

    test("two open popovers keep to their own triggers, A mounted first", async ({ a, b, load }) => {
      await load(setup, "both-open", "a")
      await a.expectAnchored()

      await load(setup, "both-open", "b")
      await b.expectAnchored()
      await a.expectAnchored()
    })

    test("two open popovers keep to their own triggers, B mounted first", async ({ a, b, load }) => {
      await load(setup, "both-open", "b")
      await b.expectAnchored()

      await load(setup, "both-open", "a")
      await a.expectAnchored()
      await b.expectAnchored()
    })

    test("a popover is placed by CSS after another root's popover has closed", async ({ a, b, load, page }) => {
      await load(setup, "one-at-a-time", "a")
      await load(setup, "one-at-a-time", "b")

      await b.trigger.click()
      await b.expectAnchored()
      await page.keyboard.press("Escape")
      await expect(b.popup).toBeHidden()

      await a.trigger.click()
      await a.expectAnchored()
    })
  })
}
