import { Card, makeStyles, tokens, Text, Divider, Badge } from '@fluentui/react-components'
import { InfoRegular, ShieldRegular } from '@fluentui/react-icons'
import SettingsLayout from '../../components/SettingsLayout'

const useStyles = makeStyles({
  card: { padding: '28px', marginBottom: '16px', borderRadius: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, maxWidth: '640px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, fontSize: '14px' },
})

export default function About() {
  const s = useStyles()
  return (
    <SettingsLayout>
      <Card className={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <InfoRegular />
          <Text weight="semibold" size={500}>About GM Bus Tracking</Text>
        </div>

        <div className={s.row}><span>Version</span><Badge appearance="filled">1.0.0</Badge></div>
        <div className={s.row}><span>Platform</span><Text>Web Dashboard</Text></div>
        <div className={s.row}><span>Build Date</span><Text>September 2026</Text></div>
        <div className={s.row}><span>Backend API</span><Badge appearance="tint" color="success">Connected</Badge></div>
        <div className={s.row}><span>Database</span><Badge appearance="tint" color="success">Healthy</Badge></div>
        <div className={s.row}><span>PM2 Services</span><Badge appearance="tint" color="success">3 Online</Badge></div>

        <Divider style={{ margin: '20px 0' }} />

        <Text weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>🛡️ Security</Text>
        <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground3, lineHeight: 1.6 }}>
          All data encrypted at rest and in transit. Multi-tenant architecture with isolated databases per client.
          JWT-based authentication with role-based access control.
        </Text>

        <Divider style={{ margin: '20px 0' }} />

        <Text weight="semibold" style={{ display: 'block', marginBottom: '8px' }}>📞 Support</Text>
        <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
          Email: support@gauravmedia.in<br />
          Docs: github.com/gauravrathod31297-sudo/gm-bus-platform
        </Text>
      </Card>
    </SettingsLayout>
  )
}
