import { useEffect, useMemo, useState } from 'react'
import { Bot, LayoutDashboard, Eye, Code2, Github, Plus, Undo2, Redo2, Download, Send, ChevronDown, GripVertical, Trash2, Copy, Monitor, Smartphone, Check, Sparkles, Settings2, PanelLeftClose, PanelRightClose, FileCode2, Rocket, Layers3, MessageSquareText } from 'lucide-react'

type Block = { id: string; type: 'metric' | 'task' | 'note' | 'chart'; title: string; value: string; detail: string; width: number; hidden?: boolean }
type Snapshot = { blocks: Block[]; projectName: string }
const initialBlocks: Block[] = [
  { id: 'b1', type: 'metric', title: 'Monthly budget', value: '₱24,500', detail: 'Planned household spending', width: 1 },
  { id: 'b2', type: 'metric', title: 'Open tasks', value: '08', detail: '3 due this week', width: 1 },
  { id: 'b3', type: 'metric', title: 'Maintenance', value: '02', detail: 'Upcoming this month', width: 1 },
  { id: 'b4', type: 'task', title: 'Household tasks', value: 'Replace kitchen faucet', detail: 'Due Friday · Plumbing', width: 2 },
  { id: 'b5', type: 'note', title: 'House notes', value: 'Water bill is usually due every 18th.', detail: 'Personal reminder', width: 1 },
]
const clone = (x: Snapshot): Snapshot => JSON.parse(JSON.stringify(x))
const uid = () => Math.random().toString(36).slice(2, 8)

export default function App() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem('forgeai-project-v2') || 'null') } catch { return null } })()
  const [projectName, setProjectName] = useState(saved?.projectName || 'Household Planner')
  const [purpose, setPurpose] = useState(saved?.purpose || 'A personal household planner for expenses, maintenance schedules, household tasks, and home projects.')
  const [blocks, setBlocks] = useState<Block[]>(saved?.blocks || initialBlocks)
  const [layout, setLayout] = useState<'grid'|'free'>('grid')
  const [dragging, setDragging] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [selected, setSelected] = useState('b1')
  const [prompt, setPrompt] = useState('')
  const [chat, setChat] = useState([{ role: 'ai', text: 'I created a starter household planner. Select any component to edit it, or tell me what you want changed.' }])
  const [history, setHistory] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])
  const [tab, setTab] = useState<'components'|'layers'>('components')
  const [showCode, setShowCode] = useState(false)
  const [device, setDevice] = useState<'desktop'|'mobile'>('desktop')
  const [projectModal, setProjectModal] = useState(false)
  const [notice, setNotice] = useState('Draft workspace · changes are not published')
  const [generated, setGenerated] = useState(false)
  const current = blocks.find(b => b.id === selected)
  useEffect(() => { localStorage.setItem('forgeai-project-v2', JSON.stringify({projectName,purpose,blocks})); setNotice('Saved locally · changes persist on this device') }, [projectName,purpose,blocks])
  const reorder = (from: string, to: string) => { if (from === to) return; saveHistory(); setBlocks(bs => { const arr=[...bs]; const a=arr.findIndex(x=>x.id===from), b=arr.findIndex(x=>x.id===to); if(a<0||b<0)return bs; const [item]=arr.splice(a,1); arr.splice(b,0,item); return arr }) }

  const saveHistory = () => { setHistory(h => [...h.slice(-19), { blocks: clone({blocks, projectName}).blocks, projectName }]); setFuture([]) }
  const updateBlock = (id: string, patch: Partial<Block>) => { saveHistory(); setBlocks(bs => bs.map(b => b.id === id ? {...b, ...patch} : b)) }
  const addBlock = (type: Block['type'] = 'note') => {
    saveHistory()
    const titles = { metric: 'New metric', task: 'New task list', note: 'New note', chart: 'New chart' }
    const b: Block = { id: uid(), type, title: titles[type], value: type === 'metric' ? '0' : 'Add your content', detail: 'Click to edit this component', width: type === 'task' ? 2 : 1 }
    setBlocks(bs => [...bs, b]); setSelected(b.id); setNotice('Component added')
  }
  const removeBlock = (id: string) => { saveHistory(); setBlocks(bs => bs.filter(b => b.id !== id)); if (selected === id) setSelected(blocks.find(b => b.id !== id)?.id || '') }
  const moveBlock = (id: string, dir: number) => {
    const idx = blocks.findIndex(b => b.id === id), next = idx + dir
    if (next < 0 || next >= blocks.length) return
    saveHistory(); const arr = [...blocks]; [arr[idx], arr[next]] = [arr[next], arr[idx]]; setBlocks(arr)
  }
  const undo = () => { if (!history.length) return; const prev = history[history.length-1]; setFuture(f => [...f, clone({blocks, projectName})]); setBlocks(prev.blocks); setProjectName(prev.projectName); setHistory(h => h.slice(0,-1)); setNotice('Previous version restored') }
  const redo = () => { if (!future.length) return; const next = future[future.length-1]; setHistory(h => [...h, clone({blocks, projectName})]); setBlocks(next.blocks); setProjectName(next.projectName); setFuture(f => f.slice(0,-1)); }
  const visibleBlocks = blocks.filter(b => !b.hidden)
  const exportData = useMemo(() => JSON.stringify({ projectName, purpose, blocks, schemaVersion: 1 }, null, 2), [projectName,purpose,blocks])
  const download = (name: string, content: string, type='application/json') => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], {type})); a.download = name; a.click(); URL.revokeObjectURL(a.href) }

  const runPrompt = () => {
    const p = prompt.trim(); if (!p) return
    setChat(c => [...c, {role:'you', text:p}]); saveHistory()
    const lower = p.toLowerCase()
    let response = 'I recorded your request. In this prototype, try commands such as “add a note”, “add a metric”, “make the selected component wider”, “rename the selected component to …”, or “hide the selected component”. The production AI will interpret open-ended requests and generate code changes.'
    if (lower.includes('add') && lower.includes('metric')) { addBlock('metric'); response = 'Added a metric card. Select it to customize its title, value, and description.' }
    else if (lower.includes('add') && (lower.includes('note') || lower.includes('reminder'))) { addBlock('note'); response = 'Added a note component. You can edit its content in the properties panel.' }
    else if (lower.includes('add') && (lower.includes('task') || lower.includes('list'))) { addBlock('task'); response = 'Added a task component.' }
    else if (lower.includes('wider') || lower.includes('wide')) { if(current) { setBlocks(bs=>bs.map(b=>b.id===current.id?{...b,width:2}:b)); response='Made the selected component wider.' } else response='Select a component first, then ask me to make it wider.' }
    else if (lower.includes('hide')) { if(current) { setBlocks(bs=>bs.map(b=>b.id===current.id?{...b,hidden:true}:b)); response='Hidden the selected component. You can restore it from Layers.' } }
    else if (lower.includes('show') || lower.includes('unhide')) { if(current) { setBlocks(bs=>bs.map(b=>b.id===current.id?{...b,hidden:false}:b)); response='Restored the selected component.' } }
    else if (lower.includes('rename') && current) { const match=p.match(/to\s+(.+)$/i); if(match) {setBlocks(bs=>bs.map(b=>b.id===current.id?{...b,title:match[1]}:b)); response=`Renamed the selected component to “${match[1]}”.`} }
    else if (lower.includes('delete') && current) { setBlocks(bs=>bs.filter(b=>b.id!==current.id)); response='Deleted the selected component.' }
    else if (lower.includes('purple') || lower.includes('blue') || lower.includes('green')) response='Theme editing is planned for the next prototype iteration. Your request is captured in the conversation.'
    setChat(c => [...c, {role:'ai',text:response}]); setPrompt('')
  }

  const generate = () => { setGenerated(true); setNotice('Starter application generated · editable draft'); setChat(c=>[...c,{role:'ai',text:'Your interactive starter workspace is ready. This prototype uses a sample household-planner layout. A connected AI provider will generate a real application from your purpose.'}]) }
  const publish = () => setProjectModal(true)

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-icon"><Sparkles size={18}/></div><div><strong>Forge<span>AI</span></strong><small>AI TEMPLATE BUILDER</small></div></div>
      <div className="project-label"><span className="dot"/><span>{projectName}</span><ChevronDown size={14}/></div>
      <div className="top-actions">
        <button className="icon-btn" title="Undo" onClick={undo} disabled={!history.length}><Undo2 size={17}/></button>
        <button className="icon-btn" title="Redo" onClick={redo} disabled={!future.length}><Redo2 size={17}/></button>
        <span className="top-divider"/>
        <button className="secondary-btn" onClick={()=>download('project-spec.json',exportData)}><Download size={15}/> Export spec</button>
        <button className="primary-btn" onClick={publish}><Github size={16}/> Finalize</button>
      </div>
    </header>
    <main className="workspace">
      <aside className="left-panel">
        <div className="panel-tabs"><button className={tab==='components'?'active':''} onClick={()=>setTab('components')}><Layers3 size={15}/> Components</button><button className={tab==='layers'?'active':''} onClick={()=>setTab('layers')}><LayoutDashboard size={15}/> Layers</button></div>
        {tab==='components' ? <div className="panel-content">
          <div className="section-kicker">ADD COMPONENT</div>
          <div className="component-grid">
            <button onClick={()=>addBlock('metric')}><div className="component-icon purple">▥</div><span>Metric</span></button>
            <button onClick={()=>addBlock('task')}><div className="component-icon blue">☷</div><span>Task list</span></button>
            <button onClick={()=>addBlock('note')}><div className="component-icon amber">▤</div><span>Note</span></button>
            <button onClick={()=>addBlock('chart')}><div className="component-icon green">⌁</div><span>Chart</span></button>
          </div>
          <div className="section-kicker section-spaced">PROJECT PAGES</div>
          <button className="page-item active"><LayoutDashboard size={15}/> Overview <span>●</span></button>
          <button className="page-item" onClick={()=>setNotice('Additional pages are planned for the next phase')}><FileCode2 size={15}/> Maintenance</button>
          <button className="page-item" onClick={()=>setNotice('Pages are part of the next iteration')}><FileCode2 size={15}/> Expenses</button>
          <div className="left-tip"><Sparkles size={15}/><div><b>Quick tip</b><p>Select a component on the canvas to edit its content and layout.</p></div></div>
        </div> : <div className="panel-content">
          <div className="section-kicker">CANVAS LAYERS</div>
          <label className="show-hidden"><input type="checkbox" checked={showHidden} onChange={e=>setShowHidden(e.target.checked)}/> Show hidden components</label>{blocks.filter(b=>showHidden||!b.hidden).map((b,i)=><div className={`layer-row ${selected===b.id?'selected':''}`} key={b.id}><button onClick={()=>setSelected(b.id)}><GripVertical size={14}/><span>{b.title}</span></button><button className="tiny-icon" onClick={()=>updateBlock(b.id,{hidden:!b.hidden})}>{b.hidden?'◉':'◌'}</button></div>)}
        </div>}
      </aside>

      <section className="center-panel">
        <div className="canvas-toolbar">
          <div><span className="canvas-title">Preview</span><span className="draft-tag">DRAFT</span></div>
          <div className="canvas-controls">
            <button className={device==='desktop'?'selected':''} onClick={()=>setDevice('desktop')}><Monitor size={15}/></button>
            <button className={device==='mobile'?'selected':''} onClick={()=>setDevice('mobile')}><Smartphone size={15}/></button>
            <span className="toolbar-divider"/>
            <button className={layout==='grid'?'selected':''} onClick={()=>setLayout('grid')}>Grid</button><button className={layout==='free'?'selected':''} onClick={()=>setLayout('free')}>Free</button><button onClick={()=>setShowCode(!showCode)} className={showCode?'selected':''}><Code2 size={15}/> Code</button>
          </div>
        </div>
        {showCode ? <div className="code-view"><div className="code-head"><span>project-spec.json</span><button onClick={()=>download('project-spec.json',exportData)}><Copy size={14}/> Copy / Export</button></div><pre>{exportData}</pre></div> :
        <div className="preview-area"><div className={`preview-frame ${device==='mobile'?'mobile-frame':''}`}>
          <div className="preview-top"><div><div className="eyebrow">YOUR HOME, IN ONE PLACE</div><h1>{projectName}</h1><p>Keep your household organized and running smoothly.</p></div><div className="avatar">ML</div></div>
          <div className="preview-nav"><span className="nav-active">Overview</span><span>Expenses</span><span>Maintenance</span><span>Projects</span></div>
          <div className="preview-section-head"><div><h2>Good morning</h2><p>Here's what's happening at home.</p></div><button onClick={()=>addBlock('note')}><Plus size={14}/> Add item</button></div>
          <div className="blocks-grid">
            {visibleBlocks.map((b,i)=><div key={b.id} onClick={()=>setSelected(b.id)} className={`preview-card ${selected===b.id?'is-selected':''} ${b.width===2?'span-two':''} ${b.type}`}>
              <div className="card-top"><span className="card-type">{b.type==='metric'?'OVERVIEW':b.type.toUpperCase()}</span><button className="card-menu" onClick={e=>{e.stopPropagation();setSelected(b.id)}}>•••</button></div>
              <h3>{b.title}</h3><div className="card-value">{b.value}</div><p>{b.detail}</p>
              {b.type==='chart' && <div className="fake-chart"><i/><i/><i/><i/><i/><i/><i/></div>}
              {b.type==='task' && <div className="task-progress"><span/><small>1 of 4 completed</small></div>}
              {selected===b.id && <div className="selection-label">SELECTED</div>}
            </div>)}
          </div>
          <div className="preview-footer">Made with ForgeAI <span>·</span> Editable draft</div>
        </div></div>}
        <div className="statusbar"><span><span className="status-dot"/> {notice}</span><span>{visibleBlocks.length} visible components · {layout} layout</span></div>
      </section>

      <aside className="right-panel">
        <div className="right-tabs"><button className="active"><Bot size={16}/> AI Assistant</button><button onClick={()=>setNotice('Advanced settings are planned for the next iteration')}><Settings2 size={16}/> Settings</button></div>
        <div className="ai-context"><div className="ai-avatar"><Sparkles size={16}/></div><div><b>ForgeAI Assistant</b><small>Builder mode · Prototype</small></div><span className="online-dot"/></div>
        <div className="chat-history">
          <div className="context-card"><div className="section-kicker">PROJECT PURPOSE</div><textarea value={purpose} onChange={e=>setPurpose(e.target.value)} rows={3}/><button onClick={generate}><Sparkles size={13}/> Generate application</button></div>
          {chat.map((m,i)=><div className={`chat-message ${m.role}`} key={i}>{m.role==='ai'&&<div className="mini-ai"><Bot size={13}/></div>}<div className="bubble">{m.text}</div></div>)}
        </div>
        <div className="prompt-area"><div className="prompt-hints"><button onClick={()=>setPrompt('Add a metric card')}>+ Add metric</button><button onClick={()=>setPrompt('Make the selected component wider')}>Widen selected</button></div><div className="prompt-box"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runPrompt()}}} placeholder="Describe a change you want..." rows={2}/><button onClick={runPrompt} disabled={!prompt.trim()}><Send size={16}/></button></div><small>Prototype commands only · AI API not connected</small></div>
      </aside>
    </main>
    {current && <div className="properties-drawer"><div className="property-title"><div><span className="section-kicker">SELECTED COMPONENT</span><b>{current.title}</b></div><button className="tiny-icon" onClick={()=>setSelected('')}><PanelRightClose size={16}/></button></div><label>Title<input value={current.title} onChange={e=>updateBlock(current.id,{title:e.target.value})}/></label><label>Content / Value<input value={current.value} onChange={e=>updateBlock(current.id,{value:e.target.value})}/></label><label>Description<input value={current.detail} onChange={e=>updateBlock(current.id,{detail:e.target.value})}/></label><div className="property-row"><label>Width<select value={current.width} onChange={e=>updateBlock(current.id,{width:Number(e.target.value) as 1|2})}><option value={1}>One column</option><option value={2}>Two columns</option></select></label><label>Visibility<select value={current.hidden?'hidden':'visible'} onChange={e=>updateBlock(current.id,{hidden:e.target.value==='hidden'})}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></label></div><div className="property-actions"><button onClick={()=>moveBlock(current.id,-1)}>Move up</button><button onClick={()=>moveBlock(current.id,1)}>Move down</button><button className="danger" onClick={()=>removeBlock(current.id)}><Trash2 size={14}/> Delete</button></div></div>}
    {projectModal && <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={()=>setProjectModal(false)}>×</button><div className="modal-icon"><Rocket size={22}/></div><h2>Finalize your project</h2><p>Your draft is ready to export. GitHub publishing requires a connected account and backend authorization, which are not configured in this prototype.</p><label>Repository / project name<input value={projectName} onChange={e=>setProjectName(e.target.value.replace(/[^a-zA-Z0-9 -]/g,''))}/></label><div className="modal-summary"><span>Project specification</span><b>Ready to export</b><span>Source-code generation</span><b>Next phase</b><span>GitHub connection</span><b>Not connected</b></div><button className="primary-btn full" onClick={()=>{download('forgeai-project-spec.json',exportData);setProjectModal(false);setNotice('Project specification exported · source code still in draft')}}><Download size={16}/> Export project specification</button><button className="secondary-btn full" onClick={()=>setProjectModal(false)}>Continue editing</button></div></div>}
  </div>
}
