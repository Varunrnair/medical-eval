import * as React from "react"

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "bg-gray-800 rounded-2xl border border-gray-700", ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
)
Card.displayName = "Card"

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "p-6 pb-0", ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "font-bold text-lg text-white", ...props }, ref) => (
    <h3 ref={ref} className={className} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "text-gray-300 mt-1", ...props }, ref) => (
    <p ref={ref} className={className} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "p-6 pt-0", ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
)
CardContent.displayName = "CardContent" 