// Activity.jsx — observability: activity timeline, offline recovery, diagnostics
(function(){
  const {T,Icon,DEVICE_ICON,Card,Btn,Sheet,StatusDot,TopBar,EmptyState,haptic,pressable}=window.KT_UI;
  const Mono=({children,style})=><span style={{fontFamily:T.mono,...style}}>{children}</span>;

  const STATUS={
    ok:     {c:T.success, ring:'rgba(74,222,128,0.16)', label:'Sent',    icon:'check'},
    partial:{c:T.warning, ring:'rgba(250,204,21,0.16)', label:'Partial', icon:'minus'},
    fail:   {c:T.error,   ring:'rgba(248,113,113,0.16)',label:'Failed',  icon:'x'},
  };
  const KIND={scene:'Scene',command:'Command',scout:'Troll Scout'};

  function relTime(ts){
    const s=Math.floor((Date.now()-ts)/1000);
    if(s<45) return 'just now';
    if(s<3600) return Math.floor(s/60)+'m ago';
    if(s<86400) return Math.floor(s/3600)+'h ago';
    return Math.floor(s/86400)+'d ago';
  }
  function dayLabel(ts){
    const d=new Date(ts), n=new Date();
    const same=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
    if(same(d,n)) return 'Today';
    const y=new Date(n); y.setDate(n.getDate()-1);
    if(same(d,y)) return 'Yesterday';
    return d.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});
  }

  function ActivityRow({ev, last}){
    const st=STATUS[ev.status]||STATUS.ok;
    return <div style={{display:'flex',gap:14,padding:'13px 2px',borderBottom:last?'none':`1px solid ${T.border}`}}>
      <div style={{position:'relative',flexShrink:0}}>
        <div style={{width:40,height:40,borderRadius:13,background:T.violetSoft,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon name={ev.icon||(ev.kind==='scout'?'bolt':'remote')} size={20} color={T.lime}/></div>
        <div style={{position:'absolute',right:-3,bottom:-3,width:18,height:18,borderRadius:'50%',background:st.ring,
          border:`2px solid ${T.bg}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon name={st.icon} size={11} color={st.c}/></div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <div style={{flex:1,minWidth:0,fontWeight:800,fontSize:15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ev.title}</div>
          <Mono style={{fontSize:11,color:T.muted,flexShrink:0}}>{relTime(ev.ts)}</Mono>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:3}}>
          <span style={{fontFamily:T.mono,fontSize:10,color:st.c,fontWeight:700,letterSpacing:0.5,textTransform:'uppercase'}}>{KIND[ev.kind]||ev.kind} · {st.label}</span>
        </div>
        {ev.detail&&<div style={{fontSize:12.5,color:T.muted,fontWeight:600,marginTop:3}}>{ev.detail}</div>}
      </div>
    </div>;
  }

  function Activity({activity, devices, trollVariant, onBack, onDiagnostics, onRecover}){
    const [filter,setFilter]=React.useState('All');
    const offline=devices.filter(d=>d.status==='offline');
    const online=devices.filter(d=>d.status==='online').length;
    let list=activity;
    if(filter==='Failures') list=activity.filter(e=>e.status!=='ok');
    if(filter==='Scenes') list=activity.filter(e=>e.kind==='scene');

    // group by day
    const groups=[]; let cur=null;
    list.forEach(ev=>{ const lbl=dayLabel(ev.ts); if(!cur||cur.label!==lbl){cur={label:lbl,items:[]};groups.push(cur);} cur.items.push(ev); });

    return <div style={{padding:'4px 20px 20px'}}>
      <TopBar title="Activity" onBack={onBack} right={
        <button {...pressable()} onClick={()=>{haptic();onDiagnostics();}} style={{display:'flex',gap:6,alignItems:'center',background:T.card,border:`1px solid ${T.border}`,borderRadius:100,padding:'8px 14px',color:T.text,fontWeight:800,fontSize:13,cursor:'pointer'}}>
          <Icon name="ir" size={15} color={T.lime}/> Diagnostics</button>}/>

      {/* health summary */}
      <Card pad={14} style={{marginBottom:14,display:'flex',alignItems:'center',gap:14}}>
        <div style={{display:'flex',gap:18}}>
          <div><div style={{fontWeight:900,fontSize:24,color:T.success,lineHeight:1}}>{online}</div><Mono style={{fontSize:10.5,color:T.muted}}>ONLINE</Mono></div>
          <div style={{width:1,background:T.border}}/>
          <div><div style={{fontWeight:900,fontSize:24,color:offline.length?T.error:T.muted,lineHeight:1}}>{offline.length}</div><Mono style={{fontSize:10.5,color:T.muted}}>OFFLINE</Mono></div>
        </div>
        <div style={{flex:1}}/>
        <StatusDot status={offline.length?'offline':'online'}/>
        <span style={{fontWeight:800,fontSize:13,color:offline.length?T.warning:T.success}}>{offline.length?'Attention':'All good'}</span>
      </Card>

      {/* offline recovery banner */}
      {offline.map(d=>(
        <Card key={d.id} pad={14} style={{marginBottom:14,borderColor:'rgba(248,113,113,0.4)',background:'rgba(248,113,113,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:'rgba(248,113,113,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Icon name={DEVICE_ICON[d.type]} size={20} color={T.error}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:15}}>{d.name} is offline</div>
              <Mono style={{fontSize:11,color:T.muted}}>last seen {d.lastSeen||'—'}</Mono>
            </div>
            <Btn kind="danger" onClick={()=>onRecover(d)} style={{padding:'10px 16px',fontSize:14}}>Fix</Btn>
          </div>
        </Card>
      ))}

      {/* filters */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {['All','Scenes','Failures'].map(f=><button key={f} {...pressable()} onClick={()=>{haptic();setFilter(f);}} style={{padding:'8px 16px',borderRadius:100,
          border:`1px solid ${filter===f?T.lime:T.border}`,background:filter===f?'rgba(200,255,0,0.1)':'transparent',
          color:filter===f?T.lime:T.muted,fontFamily:T.sans,fontWeight:800,fontSize:13,cursor:'pointer'}}>{f}</button>)}
      </div>

      {groups.length===0
        ? <div style={{border:`1px dashed ${T.border}`,borderRadius:20}}><EmptyState exp="happy" variant={trollVariant} compact
            title={filter==='Failures'?'No failures':'Nothing yet'} sub={filter==='Failures'?'Every command has gone through cleanly.':'Fire a scene and it shows up here.'}/></div>
        : groups.map(g=><div key={g.label} style={{marginBottom:18}}>
            <div style={{fontFamily:T.mono,fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>{g.label}</div>
            <Card pad={16}>{g.items.map((ev,i)=><ActivityRow key={ev.id} ev={ev} last={i===g.items.length-1}/>)}</Card>
          </div>)}
    </div>;
  }

  // ---------- OFFLINE RECOVERY ----------
  function Recovery({device, troll, onClose, onReconnected}){
    const [phase,setPhase]=React.useState('idle'); // idle | trying | success | failed
    const [step,setStep]=React.useState(0);
    const STEPS=['Pinging last known IP…','Scanning local subnet…','Checking gateway power…','Re-handshaking protocol…'];
    const tp=troll.presence==='off'?'subtle':troll.presence;

    React.useEffect(()=>{
      if(phase!=='trying')return;
      let i=0; setStep(0);
      const iv=setInterval(()=>{ i++; if(i<STEPS.length){setStep(i);} else {clearInterval(iv);
        // demo: succeed
        setPhase('success'); haptic(20); } },720);
      return ()=>clearInterval(iv);
    },[phase]);

    return <Sheet open={!!device} onClose={onClose} title={null}>
      {phase==='idle' && <div style={{textAlign:'center',padding:'4px 8px 8px'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:10}}><window.Troll exp="sleepy" variant={troll.variant} presence={tp} size={92}/></div>
        <div style={{fontWeight:900,fontSize:20}}>{device.name} went quiet</div>
        <p style={{color:T.muted,fontWeight:600,fontSize:13.5,margin:'8px auto 18px',maxWidth:280,lineHeight:1.5}}>
          Last seen {device.lastSeen||'a while ago'}. Common fixes for the {device.model}:</p>
        <div style={{textAlign:'left',marginBottom:18}}>
          {['Confirm it has power and the LED is lit','Check it’s on the same Wi-Fi as your phone',`Verify the IP ${device.ip} hasn’t changed`].map((tx,i)=>(
            <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0'}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:T.violetSoft,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.mono,fontSize:11,color:T.lime,fontWeight:700}}>{i+1}</div>
              <span style={{fontWeight:700,fontSize:14,color:'rgba(240,240,240,0.9)',lineHeight:1.4}}>{tx}</span></div>
          ))}
        </div>
        <Btn kind="primary" full onClick={()=>{haptic();setPhase('trying');}}><Icon name="refresh" size={17}/> Try to reconnect</Btn>
      </div>}

      {phase==='trying' && <div style={{textAlign:'center',padding:'14px 8px 18px'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:18,position:'relative'}}>
          {[0,1].map(i=><div key={i} className="ktring" style={{position:'absolute',top:'50%',left:'50%',width:100,height:100,marginLeft:-50,marginTop:-50,border:`1.5px solid rgba(200,255,0,0.4)`,borderRadius:'50%',animationDelay:`${i*0.9}s`}}/>)}
          <window.Troll exp="wink" variant={troll.variant} presence={tp} size={96}/>
        </div>
        <div style={{fontWeight:900,fontSize:18,marginBottom:12}}>Reconnecting…</div>
        <Mono style={{fontSize:13,color:T.lime}}>{STEPS[step]}</Mono>
      </div>}

      {phase==='success' && <div style={{textAlign:'center',padding:'10px 8px 14px'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:10}}><window.Troll exp="wow" variant={troll.variant} presence={tp} size={96} glow/></div>
        <div style={{fontWeight:900,fontSize:20}}>Back online</div>
        <p style={{color:T.muted,fontWeight:600,fontSize:13.5,margin:'8px auto 18px',maxWidth:260}}>{device.name} responded on {device.ip}. You’re good to go.</p>
        <Btn kind="lime" full onClick={()=>{onReconnected(device.id);onClose();}}>Done</Btn>
      </div>}
    </Sheet>;
  }

  // ---------- DIAGNOSTICS ----------
  function Diagnostics({open, devices, onClose, onRecover}){
    if(!open) return null;
    const lat=(d)=> d.status!=='online'?{label:'—',c:T.muted}: d.latency<30?{label:d.latency+'ms',c:T.success}: d.latency<60?{label:d.latency+'ms',c:T.warning}:{label:d.latency+'ms',c:T.error};
    return <Sheet open={open} onClose={onClose} title="Diagnostics">
      <p style={{color:T.muted,fontWeight:600,fontSize:13,marginTop:-4,marginBottom:14}}>Connection health across every device.</p>
      {devices.map((d,i)=>{const L=lat(d);return <Card key={d.id} pad={14} style={{marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
          <Icon name={DEVICE_ICON[d.type]} size={20} color={d.status==='online'?T.lime:T.muted}/>
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:15}}>{d.name}</div><Mono style={{fontSize:11,color:T.muted}}>{d.protocol}</Mono></div>
          <StatusDot status={d.status}/>
        </div>
        <div style={{display:'flex',gap:10}}>
          {[['LATENCY',L.label,L.c],['LAST SEEN',d.lastSeen||'—',T.text],['IP',d.ip,T.text]].map(([k,v,c])=>(
            <div key={k} style={{flex:1,background:T.card2,borderRadius:10,padding:'8px 10px'}}>
              <Mono style={{fontSize:9.5,color:T.muted,letterSpacing:0.5,display:'block'}}>{k}</Mono>
              <Mono style={{fontSize:13,color:c,fontWeight:700}}>{v}</Mono></div>))}
        </div>
        {d.status==='offline'&&<Btn kind="danger" full style={{marginTop:10,padding:'9px'}} onClick={()=>{onClose();onRecover(d);}}><Icon name="refresh" size={15}/> Troubleshoot</Btn>}
      </Card>;})}
    </Sheet>;
  }

  window.KT_Activity=Activity;
  window.KT_Recovery=Recovery;
  window.KT_Diagnostics=Diagnostics;
})();
