import { useEffect, useState } from 'react'
import {
  Button, Card, Spinner, Table, TableHeader, TableRow, TableHeaderCell,
  TableBody, TableCell, Badge, Select, MessageBar, MessageBarBody,
  makeStyles, Text, Dialog, DialogTrigger, DialogSurface, DialogTitle,
  DialogBody, DialogContent, DialogActions, Field
} from '@fluentui/react-components'
import { ArrowSyncRegular, EditRegular, GlobeRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  card: { padding: '24px' },
  empty: { padding: '48px', textAlign: 'center' },
})

const LANGUAGES = [
  { value: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
  { value: 'mr', label: '🇮🇳 मराठी (Marathi)', flag: '🇮🇳' },
  { value: 'gu', label: '🇮🇳 ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { value: 'hi', label: '🇮🇳 हिंदी (Hindi)', flag: '🇮🇳' },
]

export default function Clients() {
  const styles = useStyles()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editing, setEditing] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/clients')
      setClients(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const updateLanguage = async (clientId: number, lang: string) => {
    try {
      await api.put(`/api/admin/clients/${clientId}/language`, { preferred_language: lang })
      setMsg({ type: 'success', text: `✅ Language updated for client #${clientId}` })
      load()
    } catch (e: any) {
      setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' })
    }
  }

  const statusBadge = (s: string) => {
    const c = s === 'approved' ? 'success' : s === 'pending' ? 'warning' : 'danger'
    return <Badge appearance="filled" color={c as any}>{s}</Badge>
  }

  const langLabel = (code: string) => {
    const l = LANGUAGES.find(x => x.value === code)
    return l ? l.label : '🇬🇧 English'
  }

  return (
    <Layout title="Clients">
      {msg && <MessageBar intent={msg.type} style={{ marginBottom: '16px' }}>
        <MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Text weight="semibold">All Clients ({clients.length})</Text>
          <Button icon={<ArrowSyncRegular />} onClick={load}>Refresh</Button>
        </div>

        {loading ? <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div> :
         clients.length === 0 ? <div className={styles.empty}>No clients yet</div> :
        (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Company</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>🌐 UI Language</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell><b>{c.company_name}</b></TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={c.preferred_language || 'en'}
                      onChange={(_, d) => updateLanguage(c.id, d.value)}
                      style={{ minWidth: '180px' }}
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button size="small" appearance="subtle" icon={<GlobeRegular />}
                      onClick={() => setEditing(c)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {editing && (
        <Dialog open={!!editing} onOpenChange={(_, d) => { if (!d.open) setEditing(null) }}>
          <DialogSurface style={{ maxWidth: '600px' }}>
            <DialogBody>
              <DialogTitle>🏢 {editing.company_name}</DialogTitle>
              <DialogContent>
                <Field label="Owner">
                  <Text>{editing.owner_name}</Text>
                </Field>
                <Field label="Email">
                  <Text>{editing.email}</Text>
                </Field>
                <Field label="Preferred Language (UI + Announcements)">
                  <Select
                    value={editing.preferred_language || 'en'}
                    onChange={(_, d) => updateLanguage(editing.id, d.value)}
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </Select>
                </Field>
                <Text size={200} style={{ marginTop: '8px', color: '#666', display: 'block' }}>
                  💡 ही भाषा client च्या Dashboard UI आणि Announcements साठी वापरली जाईल.
                  <br/>Announcement priority: <b>{editing.preferred_language || 'en'}</b> → English
                </Text>
              </DialogContent>
              <DialogActions>
                <Button appearance="primary" onClick={() => setEditing(null)}>Close</Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </Layout>
  )
}
