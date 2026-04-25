import {Heading, Text} from '@primer/react'
import type {PropsWithChildren, ReactNode} from 'react'

interface SurfaceCardProps extends PropsWithChildren {
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function SurfaceCard({title, description, actions, children, className}: SurfaceCardProps) {
  return (
    <section className={['surface-card', className].filter(Boolean).join(' ')}>
      {(title || description || actions) && (
        <div className="surface-card__header">
          <div>
            {title && (
              <Heading as="h2" className="surface-card__title">
                {title}
              </Heading>
            )}
            {description && (
              <Text as="p" className="surface-card__description">
                {description}
              </Text>
            )}
          </div>
          {actions && <div className="surface-card__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
