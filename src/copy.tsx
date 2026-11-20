import { Popover, PopoverContent, PopoverTrigger } from "@ui-sdk/react/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-sdk/react/tooltip"
import type { ReactNode } from "react"
import { createRoot } from "react-dom/client"
import type { RootName, Widget } from "./scenarios"

/** The roots this bundle mounts, set at build time. Each bundle is one copy of React and core. */
declare const ROOTS: Partial<Record<RootName, Widget>>

function render(name: RootName, widget: Widget): ReactNode {
  if (widget === "tooltip") {
    return (
      <Tooltip>
        <TooltipTrigger data-testid={`trigger-${name}`}>Trigger {name}</TooltipTrigger>
        <TooltipContent data-testid={`popup-${name}`}>Popup {name}</TooltipContent>
      </Tooltip>
    )
  }
  const content = (
    <>
      <PopoverTrigger data-testid={`trigger-${name}`}>Trigger {name}</PopoverTrigger>
      <PopoverContent side="bottom" data-testid={`popup-${name}`}>
        Popup {name}
      </PopoverContent>
    </>
  )
  return widget === "open-popover" ? (
    <Popover modal={false} defaultOpen>
      {content}
    </Popover>
  ) : (
    <Popover>{content}</Popover>
  )
}

for (const [name, widget] of Object.entries(ROOTS) as [RootName, Widget][]) {
  const container = document.getElementById(`root-${name}`)
  if (!container) {
    throw new Error(`#root-${name} is missing`)
  }
  createRoot(container, { identifierPrefix: `${name}-` }).render(render(name, widget))
}
