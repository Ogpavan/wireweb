import {Heading, Text} from '@primer/react'
import type {ReactNode} from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({title, description, actions}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <Heading as="h1" className="page-header__title">
          {title}
        </Heading>
        {description && (
          <Text as="p" className="page-header__description">
            {description}
          </Text>
        )}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}
