import type {ComponentType, SVGProps} from 'react'

export interface NavItem {
  title: string
  path: string
  icon: ComponentType<SVGProps<SVGSVGElement> & {size?: number}>
}

export interface NavSection {
  title: string
  items: NavItem[]
}
