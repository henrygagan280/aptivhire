interface AptivHireLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function AptivHireLogo({ className, size = "md" }: AptivHireLogoProps) {
  const sizes = {
    sm: { icon: 16, text: "text-sm", gap: "gap-1.5" },
    md: { icon: 20, text: "text-lg", gap: "gap-2" },
    lg: { icon: 24, text: "text-xl", gap: "gap-2.5" },
  }

  const { icon, text, gap } = sizes[size]

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {/* Orange Diamond */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect
          x="12"
          y="2"
          width="14"
          height="14"
          rx="2"
          transform="rotate(45 12 2)"
          fill="#E97832"
        />
      </svg>
      <span className={`font-semibold text-foreground ${text}`}>AptivHire</span>
    </div>
  )
}
