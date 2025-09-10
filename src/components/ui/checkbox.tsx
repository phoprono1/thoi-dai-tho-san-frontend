import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => (
    <div className="relative">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Check className="h-3 w-3 text-white peer-checked:block hidden" />
      </div>
      <div className="absolute inset-0 bg-blue-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
    </div>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
