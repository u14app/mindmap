interface IconProps {
  size?: number
  className?: string
}

export function IconPlus({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconMinus({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconLayoutLeft({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className={className}>
      <circle cx={17} cy={12} r={3} fill="currentColor" stroke="none" />
      <path d="M 14,12 C 10,12 10,6 6,6" />
      <path d="M 14,12 C 10,12 10,12 6,12" />
      <path d="M 14,12 C 10,12 10,18 6,18" />
      <circle cx={6} cy={6} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={6} cy={12} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={6} cy={18} r={1.5} fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconLayoutRight({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className={className}>
      <circle cx={7} cy={12} r={3} fill="currentColor" stroke="none" />
      <path d="M 10,12 C 14,12 14,6 18,6" />
      <path d="M 10,12 C 14,12 14,12 18,12" />
      <path d="M 10,12 C 14,12 14,18 18,18" />
      <circle cx={18} cy={6} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={18} cy={12} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={18} cy={18} r={1.5} fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconLayoutBoth({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className={className}>
      <circle cx={12} cy={12} r={3} fill="currentColor" stroke="none" />
      <path d="M 15,12 C 17,12 17,7 20,7" />
      <path d="M 15,12 C 17,12 17,17 20,17" />
      <path d="M 9,12 C 7,12 7,7 4,7" />
      <path d="M 9,12 C 7,12 7,17 4,17" />
      <circle cx={20} cy={7} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={20} cy={17} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={4} cy={7} r={1.5} fill="currentColor" stroke="none" />
      <circle cx={4} cy={17} r={1.5} fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconHelp({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconClose({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconKeyboard({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="6" y1="8" x2="6.01" y2="8" />
      <line x1="10" y1="8" x2="10.01" y2="8" />
      <line x1="14" y1="8" x2="14.01" y2="8" />
      <line x1="18" y1="8" x2="18.01" y2="8" />
      <line x1="6" y1="12" x2="6.01" y2="12" />
      <line x1="10" y1="12" x2="10.01" y2="12" />
      <line x1="14" y1="12" x2="14.01" y2="12" />
      <line x1="18" y1="12" x2="18.01" y2="12" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  )
}
