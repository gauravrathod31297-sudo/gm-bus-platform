import { useEffect, useState } from 'react'
import { Card, Text, Button, Spinner, Field, Input, MessageBar, MessageBarBody, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions, makeStyles, tokens } from '@fluentui/react-components'
import { AddRegular, EditRegular, DeleteRegular, ArrowClockwiseRegular } from '@fluentui/react-icons'
import api from '../services/api'

const useStyles = makeStyles({
  wrap: { maxWidth: '1400px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
  card: { padding:'8px 0', borderRadius:'14px', border: '1px solid ' + tokens.colorNeutralStroke2 },
  loader: { display:'flex', justifyContent:'center', padding:'60px' },
  empty: { textAlign:'center', padding:'60px', color:tokens.colorNeutralForeground3 },
})

export default function LiveTracking() {
  const s = useStyles()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [msg, setMsg] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState<any>({ name:'', number:'', status:'active' })

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/api/tracking')
      setItems(Array.isArray(r.data) ? r.data : (r.data.data || r.data.items || []))
    } catch(e:any) {
      setItems([])
      setMsg({type:'warning', text:'API शी connection नाही — ' + e.message})
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      if (editId) await api.put('/api/tracking/' + editId, form)
      else await api.post('/api/tracking', form)
      setMsg({type:'success', text:'✅ Saved'})
      setOpen(false); setEditId(null); setForm({ name:'', number:'', status:'active' })
      load()
    } catch(e:any) { setMsg({type:'error', text:e.response?.data?.error || e.message}) }
  }

  const del = async (id:number) => {
    if (!confirm('Delete?')) return
    try { await api.delete('/api/tracking/' + id); load() }
    catch(e:any) { setMsg({type:'error', text:e.message}) }
  }

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div>
          <Text size={700} weight="bold" style={{ display:'block' }}>Live Bus Tracking</Text>
          <Text size={300} style={{ color:tokens.colorNeutralForeground3 }}>{items.length} items</Text>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={load} />
          <Button appearance="primary" icon={<AddRegular />} onClick={() => { setForm({name:'',number:'',status:'active'}); setEditId(null); setOpen(true) }}>Add</Button>
        </div>
      </div>

      {msg && <MessageBar intent={msg.type} style={{ marginBottom:'16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={s.card}>
        {loading ? <div className={s.loader}><Spinner /></div> :
          items.length === 0 ? <div className={s.empty}><Text>No items yet — "Add" वर क्लिक करा</Text></div> :
          <Table size="small">
            <TableHeader><TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Number</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((it:any, i:number) => (
                <TableRow key={it.id || i}>
                  <TableCell>#{it.id || i+1}</TableCell>
                  <TableCell><Text weight="semibold">{it.name || it.bus_number || '-'}</Text></TableCell>
                  <TableCell>{it.number || it.reg_number || '-'}</TableCell>
                  <TableCell>{it.status || (it.is_active ? 'Active' : 'Inactive')}</TableCell>
                  <TableCell>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => { setForm(it); setEditId(it.id); setOpen(true) }} />
                      <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => del(it.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </Card>

      <Dialog open={open} onOpenChange={(_, d) => { if(!d.open) { setOpen(false); setEditId(null) } }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editId ? 'Edit' : 'Add'} Item</DialogTitle>
            <DialogContent>
              <Field label="Name"><Input value={form.name||''} onChange={(_,d)=>setForm({...form,name:d.value})} /></Field>
              <Field label="Number / Reg. No." style={{ marginTop:'12px' }}><Input value={form.number||''} onChange={(_,d)=>setForm({...form,number:d.value})} /></Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={save}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
