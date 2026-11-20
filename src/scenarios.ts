export type RootName = "a" | "b"

/** What a root renders. `open-popover` is non-modal and open from the start. */
export type Widget = "popover" | "open-popover" | "tooltip"

export type Scenario = Readonly<Record<RootName, Widget>>

/** Root A is first in the document and on the left. Root B is on the right. */
export const scenarios = {
  tooltip: { a: "popover", b: "tooltip" },
  "both-open": { a: "open-popover", b: "open-popover" },
  "one-at-a-time": { a: "popover", b: "popover" },
} as const satisfies Record<string, Scenario>

export type ScenarioName = keyof typeof scenarios

/** Candidate fixes, patched into each copy's built `nameAnchor`. */
export const fixes = ["token", "shared"] as const

export type Fix = (typeof fixes)[number]
