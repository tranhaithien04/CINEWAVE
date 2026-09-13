import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500",
        destructive:
          "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/25 hover:from-rose-500 hover:to-red-500",
        outline:
          "border border-white/10 bg-cinema-700 text-gray-200 shadow-sm hover:border-white/20 hover:bg-cinema-600",
        secondary:
          "border border-white/10 bg-cinema-700 text-gray-200 hover:bg-cinema-600",
        ghost: "text-gray-200 hover:bg-white/5 hover:text-white",
        link: "text-cyan-400 underline-offset-4 hover:underline",
        vip: "bg-gradient-to-r from-amber-400 to-amber-600 font-bold text-black shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-amber-500",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
