import { useState } from 'react'

export function Icon({ path, size=16, color='currentColor', fill='none', strokeWidth=1.8 }) {
  return (
    <svg width={size} height={size} fill={fill} stroke={color} strokeWidth={strokeWidth} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d={path}/>
    </svg>
  )
}

export function StatCard({ label, value, sub, trend, color='var(--blue)', iconPath, delay=0, onClick }) {
  const positive = trend && !String(trend).startsWith('-')
  return (
    <div className="card card-hover fade-up" onClick={onClick}
      style={{padding:'20px',animationDelay:`${delay}ms`,cursor:onClick?'pointer':'default',transition:'all 0.2s',position:'relative',overflow:'hidden'}}>
      {/* Accent line */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:'14px 14px 0 0'}}/>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
        <div style={{width:42,height:42,borderRadius:12,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',border:`1.5px solid ${color}25`}}>
          <svg width="20" height="20" fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath}/>
          </svg>
        </div>
        {trend && (
          <span style={{fontSize:11,fontWeight:700,color:positive?'var(--green)':'var(--red)',background:positive?'var(--green-l)':'var(--red-l)',padding:'3px 8px',borderRadius:20}}>
            {positive?'↑':'↓'} {trend}
          </span>
        )}
      </div>
      <div style={{color:'var(--text3)',fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:6}}>{label}</div>
      <div className="count-up" style={{fontFamily:'Sora,sans-serif',fontWeight:800,fontSize:28,color:'var(--text)',letterSpacing:'-0.03em',animationDelay:`${delay+100}ms`}}>
        {value ?? <div className="skeleton" style={{height:32,width:80}}/>}
      </div>
      {sub && <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>{sub}</div>}
    </div>
  )
}

export function MiniStatCard({ label, value, color='var(--blue)', icon }) {
  return (
    <div style={{padding:'14px 16px',background:'var(--surface2)',borderRadius:12,border:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
      <div style={{width:36,height:36,borderRadius:10,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        {icon}
      </div>
      <div>
        <div style={{fontSize:11,color:'var(--text3)',fontWeight:600,marginBottom:2}}>{label}</div>
        <div style={{fontSize:18,fontWeight:800,color:'var(--text)'}}>{value}</div>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap'}}>
      <div>
        <h1 style={{fontFamily:'Sora,sans-serif',fontSize:24,fontWeight:800,color:'var(--text)',letterSpacing:'-0.02em',marginBottom:4}}>{title}</h1>
        {subtitle && <p style={{fontSize:13,color:'var(--text2)'}}>{subtitle}</p>}
      </div>
      {children && <div style={{display:'flex',gap:8,flexShrink:0}}>{children}</div>}
    </div>
  )
}

export function TopBar({ title, panicCount=0, onSearch }) {
  return (
    <header style={{
      height:'var(--header-h)',
      background:'rgba(255,255,255,0.92)',backdropFilter:'blur(16px)',
      borderBottom:'1.5px solid rgba(43,95,245,0.08)',
      padding:'0 28px',display:'flex',alignItems:'center',justifyContent:'space-between',
      position:'sticky',top:0,zIndex:40,
      boxShadow:'0 2px 12px rgba(43,95,245,0.06)',
    }}>
      <h2 style={{fontFamily:'Sora,sans-serif',fontSize:18,fontWeight:700,color:'var(--text)'}}>{title}</h2>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{position:'relative'}}>
          <svg style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="input" placeholder="Rechercher..." onChange={e=>onSearch?.(e.target.value)} style={{width:220,paddingLeft:34,fontSize:13,height:36}}/>
        </div>
        <button style={{position:'relative',background:'var(--surface2)',border:'1.5px solid var(--border2)',color:'var(--text2)',cursor:'pointer',borderRadius:10,display:'flex',alignItems:'center',padding:'8px 10px',transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--blue-ll)';e.currentTarget.style.color='var(--blue)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.color='var(--text2)'}}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          {panicCount > 0 && <span style={{position:'absolute',top:5,right:5,width:8,height:8,background:'var(--red)',borderRadius:4,border:'2px solid white',animation:'pulse 1s infinite'}}/>}
        </button>
      </div>
    </header>
  )
}

export function StatusBadge({ status }) {
  const cfg = {
    ACTIVE:                   {cls:'badge-green',  label:'Actif'},
    EMAIL_NOT_VERIFIED:       {cls:'badge-gray',   label:'Non vérifié'},
    EMAIL_VERIFIED:           {cls:'badge-blue',   label:'Email vérifié'},
    FACE_VERIFICATION_PENDING:{cls:'badge-orange', label:'Vérif. visage'},
    DOCUMENTS_PENDING:        {cls:'badge-orange', label:'Docs requis'},
    ADMIN_REVIEW_PENDING:     {cls:'badge-purple', label:'En validation'},
    REJECTED:                 {cls:'badge-red',    label:'Rejeté'},
    SUSPENDED:                {cls:'badge-red',    label:'Suspendu'},
    PENDING:                  {cls:'badge-orange', label:'En attente'},
    APPROVED:                 {cls:'badge-green',  label:'Approuvé'},
    REQUESTED:                {cls:'badge-orange', label:'Demandée'},
    ACCEPTED:                 {cls:'badge-blue',   label:'Acceptée'},
    ARRIVED:                  {cls:'badge-teal',   label:'Arrivé'},
    IN_PROGRESS:              {cls:'badge-blue',   label:'En cours'},
    COMPLETED:                {cls:'badge-green',  label:'Terminée'},
    CANCELLED:                {cls:'badge-red',    label:'Annulée'},
    PAID:                     {cls:'badge-green',  label:'Versé'},
    CASH:                     {cls:'badge-gray',   label:'Cash'},
    WALLET:                   {cls:'badge-teal',   label:'Wallet'},
    CARD:                     {cls:'badge-blue',   label:'Carte'},
    COMPLETED_TXN:            {cls:'badge-green',  label:'Complété'},
    FAILED:                   {cls:'badge-red',    label:'Échoué'},
  }
  const { cls = 'badge-gray', label = status || '—' } = cfg[status] || {}
  return <span className={`badge ${cls}`}>{label}</span>
}

export function Avatar({ name='?', size=36, color }) {
  const colors = ['#2B5FF5','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4']
  const c = color || colors[(name?.charCodeAt(0)||0) % colors.length]
  return (
    <div style={{
      width:size,height:size,borderRadius:size*0.28,
      background:`linear-gradient(135deg,${c},${c}bb)`,
      display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
      fontSize:size*0.38,fontWeight:700,color:'#fff',
      boxShadow:`0 3px 8px ${c}40`,
    }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder='Rechercher...' }) {
  return (
    <div style={{position:'relative',flex:1}}>
      <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input className="input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{paddingLeft:36,height:38}}/>
    </div>
  )
}

export function FilterTabs({ options, value, onChange }) {
  return (
    <div style={{display:'flex',gap:4,background:'var(--surface2)',padding:4,borderRadius:12,border:'1px solid var(--border)'}}>
      {options.map(opt => (
        <button key={opt} onClick={()=>onChange(opt)} style={{
          padding:'6px 14px',borderRadius:9,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
          transition:'all 0.18s',
          background:value===opt?'var(--surface)':'transparent',
          color:value===opt?'var(--blue)':'var(--text3)',
          boxShadow:value===opt?'var(--shadow-card)':'none',
        }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children, width=540 }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(13,27,75,0.35)',backdropFilter:'blur(6px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div className="slide-r" style={{width:'100%',maxWidth:width,background:'var(--surface)',borderRadius:20,border:'1.5px solid var(--border2)',boxShadow:'0 24px 80px rgba(43,95,245,0.18)',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1.5px solid var(--border)'}}>
          <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{title}</div>
          <button onClick={onClose} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',color:'var(--text3)',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{padding:'22px'}}>{children}</div>
      </div>
    </div>
  )
}

export function Loading({ text='Chargement...' }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 24px',gap:14}}>
      <div style={{width:36,height:36,border:'3px solid var(--border2)',borderTopColor:'var(--blue)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'var(--text3)',fontSize:13}}>{text}</p>
    </div>
  )
}

export function EmptyState({ message='Aucun résultat', icon }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 24px',gap:12}}>
      <div style={{width:56,height:56,borderRadius:16,background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px solid var(--border)'}}>
        {icon || <svg width="24" height="24" fill="none" stroke="var(--text4)" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
      </div>
      <p style={{color:'var(--text3)',fontSize:13,textAlign:'center'}}>{message}</p>
    </div>
  )
}

export function InfoRow({ label, value, mono }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--border)'}}>
      <span style={{fontSize:12,color:'var(--text3)',fontWeight:600}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:'var(--text)',fontFamily:mono?'monospace':'inherit'}}>{value||'—'}</span>
    </div>
  )
}
