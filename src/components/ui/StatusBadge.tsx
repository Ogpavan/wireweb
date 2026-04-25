import {Label} from '@primer/react'
import type {PropsWithChildren} from 'react'
import type {StatusVariant} from '../../types/status'

interface StatusBadgeProps extends PropsWithChildren {
  variant?: StatusVariant
}

export function StatusBadge({children, variant = 'neutral'}: StatusBadgeProps) {
  return <Label className={`status-badge status-badge--${variant}`}>{children}</Label>
}
