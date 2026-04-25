import {Button, Text} from '@primer/react'
import {PageHeader} from '../components/ui/PageHeader'
import {StatusBadge} from '../components/ui/StatusBadge'
import {SurfaceCard} from '../components/ui/SurfaceCard'

const channels = [
  ['Slack alerts', 'Incident and delivery notifications', 'Connected', 'success'],
  ['Segment stream', 'Product analytics events', 'Paused', 'warning'],
  ['S3 archive', 'Long-term audit export', 'Connected', 'success'],
  ['PagerDuty', 'Escalation routing', 'Needs attention', 'danger'],
] as const

export function ChannelsPage() {
  return (
    <>
      <PageHeader
        title="Channels"
        description="Manage downstream integrations that receive API platform events."
        actions={<Button className="primary-button">Add channel</Button>}
      />
      <div className="card-grid">
        {channels.map(([name, description, status, variant]) => (
          <SurfaceCard key={name}>
            <div className="integration-card">
              <div>
                <Text as="p" className="integration-card__title">{name}</Text>
                <Text as="p" className="integration-card__description">{description}</Text>
              </div>
              <StatusBadge variant={variant}>{status}</StatusBadge>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </>
  )
}
