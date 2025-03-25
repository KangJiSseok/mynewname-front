import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input className={cn("flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm", className)} ref={ref} {...props} />
})
Input.displayName = "Input"

export { Input }
