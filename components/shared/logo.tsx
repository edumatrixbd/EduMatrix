"use client"

import { useTheme } from "@/providers/theme-provider"
import { cn } from "@/lib/utils"

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string
  forceTheme?: "dark" | "light"
}

export function Logo({ className, forceTheme, alt = "tensionনাই", ...props }: LogoProps) {
  const { theme } = useTheme()
  const activeTheme = forceTheme || theme
  const logoSrc = activeTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={cn("object-contain", className)}
      {...props}
    />
  )
}
