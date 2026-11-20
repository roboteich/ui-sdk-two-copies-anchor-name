# Two bundled copies of @ui-sdk/core: anchor name collision

`@ui-sdk/core` names popup anchors from a module-level counter (`--ui-anchor-1`, `--ui-anchor-2`, ...). When two independently bundled copies run on one page, both start at 1. Two triggers then share one `anchor-name`, and an open popup can move to the other copy's trigger.

Tested with `@ui-sdk/core` and `@ui-sdk/react` 0.1.0-beta.13, React 19.3.1, Chrome for Testing 153.

## Run

    npm install
    npx playwright install chromium   # or set CHROME_PATH to an installed Chrome
    npm test

The tests build their bundles first (`tests/build.ts`). Every two-copy bundle carries its own React and its own `@ui-sdk/core`.

## What the tests show

`tests/anchor-names.spec.ts` runs the same four tests against four setups:

| Setup | Result |
| --- | --- |
| One copy of core | Passes |
| Two copies of core | Fails, and is marked as an expected failure |
| Two copies, a per-copy token in the name | Passes |
| Two copies, a counter shared on `globalThis` | Passes |

The two fixes are patched into the built `nameAnchor` by `tests/build.ts`.

With two unpatched copies:

- **A tooltip from the other copy opens.** An open popover jumps about 890 px to the tooltip's trigger, and stays there after the tooltip closes.
- **Two open popovers, A mounted first.** Popover A jumps to trigger B.
- **Two open popovers, B mounted first.** Popover A is at its own trigger, but placed by script: it has lost CSS anchor positioning.
- **One popover at a time.** A closed trigger keeps its name, so the other copy's next popover is placed by script.

To see the assertion output, remove the `test.fail(...)` line in the spec.
