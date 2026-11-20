import { mkdir, readFile, writeFile } from "node:fs/promises"
import { build } from "esbuild"
import { type Fix, fixes, type RootName, type Scenario, scenarios, type Widget } from "../src/scenarios"

const dist = new URL("../dist/", import.meta.url)

async function bundle(name: string, roots: Partial<Record<RootName, Widget>>): Promise<void> {
  await build({
    entryPoints: ["src/copy.tsx"],
    outfile: `dist/${name}.js`,
    bundle: true,
    format: "iife",
    jsx: "automatic",
    logLevel: "error",
    define: {
      "process.env.NODE_ENV": '"production"',
      ROOTS: JSON.stringify(roots),
    },
  })
}

const counter = "var named = 0;"
const anchorName = "`--ui-anchor-${++named}`"

const patches: Record<Fix, { counter: string; anchorName: string }> = {
  // A token made once per copy. Needs no key shared between copies.
  token: {
    counter: `${counter} var copy = Array.from(crypto.getRandomValues(new Uint32Array(2)), (n) => n.toString(36)).join("");`,
    anchorName: "`--ui-anchor-${copy}-${++named}`",
  },
  // One counter for the page, kept like core's other shared registries.
  shared: {
    counter: 'var shared = globalThis[Symbol.for("ui-sdk.anchor-names@1")] ??= { named: 0 };',
    anchorName: "`--ui-anchor-${++shared.named}`",
  },
}

async function patch(name: string): Promise<void> {
  const source = await readFile(new URL(`${name}.js`, dist), "utf8")
  if (!source.includes(counter) || !source.includes(anchorName)) {
    throw new Error(`nameAnchor was not found in dist/${name}.js. Has core changed how it names anchors?`)
  }
  for (const fix of fixes) {
    await writeFile(
      new URL(`${name}.${fix}.js`, dist),
      source.replace(counter, patches[fix].counter).replace(anchorName, patches[fix].anchorName)
    )
  }
}

/** Builds every bundle the specs load. Runs once, before the tests. */
export default async function globalSetup(): Promise<void> {
  await mkdir(dist, { recursive: true })
  await Promise.all(
    (Object.entries(scenarios) as [string, Scenario][]).map(async ([name, roots]) => {
      await Promise.all([
        bundle(`${name}.single`, roots),
        bundle(`${name}.a`, { a: roots.a }).then(() => patch(`${name}.a`)),
        bundle(`${name}.b`, { b: roots.b }).then(() => patch(`${name}.b`)),
      ])
    })
  )
}
