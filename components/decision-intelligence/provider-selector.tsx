"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const MOCK_PROVIDERS = [
  { code: "0128", name: "Kimberly-Clark" },
  { code: "0045", name: "Colgate-Palmolive" },
  { code: "0091", name: "Procter & Gamble" },
  { code: "0033", name: "Nestlé" },
  { code: "0067", name: "Unilever" },
]

interface ProviderSelectorProps {
  value: string
  onValueChange: (code: string) => void
}

export function ProviderSelector({ value, onValueChange }: ProviderSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = MOCK_PROVIDERS.find((p) => p.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 gap-2 text-sm font-medium"
        >
          <span>{selected?.name ?? "Seleccionar proveedor"}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar proveedor..." className="h-9" />
          <CommandList>
            <CommandEmpty>No se encontró proveedor.</CommandEmpty>
            <CommandGroup>
              {MOCK_PROVIDERS.map((provider) => (
                <CommandItem
                  key={provider.code}
                  value={provider.name}
                  onSelect={() => {
                    onValueChange(provider.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn("mr-2 size-4", value === provider.code ? "opacity-100" : "opacity-0")}
                  />
                  <span>{provider.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{provider.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
