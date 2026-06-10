// App.jsx — shell: nav + back, state, scene background-fire, on-action Troll, settings
(function(){
  const {T,Icon,DEVICE_ICON,Card,Btn,Toggle,Slider,Sheet,StatusDot,SourceBadge,ConfidenceDots,TopBar,haptic}=window.KT_UI;
  const Troll=window.Troll;
  const D=window.KT_DATA;
  const clone=o=>JSON.parse(JSON.stringify(o));
  const VARKEY={Pebble:'A',Quiet:'C',Sticker:'B'};
  const Mono=({children,style})=><span style={{fontFamily:T.mono,...style}}>{children}</span>;
  const ROOM_ICONS=['sofa','bed','kitchen','tv','sun','light'];
  const SCENE_ICONS=['film','moon','sun','note','power','bolt','sparkle','light'];

  const TWEAK_DEFAULTS=/*EDITMODE-BEGIN*/{
    "remoteStyle":"soft",
    "trollRendering":"Pebble"
  }/*EDITMODE-END*/;

  function greetingNow(online,total){
    const h=new Date().getHours();
    return {main:h<12?'Good morning':h<18?'Good afternoon':'Good evening', sub:`${online} of ${total} devices online`};
  }
  const TABS=[['home','Home','home'],['rooms','Rooms','rooms'],['controller','Control','remote'],['scenes','Scenes','scenes'],['settings','Settings','settings']];

  function TabBar({tab,setTab}){
    return <div style={{position:'absolute',left:0,right:0,bottom:0,zIndex:40,paddingBottom:'calc(env(safe-area-inset-bottom) + 6px)',paddingTop:8,
      background:'rgba(20,20,34,0.82)',backdropFilter:'blur(18px) saturate(150%)',WebkitBackdropFilter:'blur(18px) saturate(150%)',
      borderTop:`1px solid ${T.border}`,boxShadow:'0 -2px 20px rgba(0,0,0,0.6)',display:'flex',justifyContent:'space-around'}}>
      {TABS.map(([id,label,icon])=>{const act=tab===id;
        return <button key={id} onClick={()=>{haptic();setTab(id);}} style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'2px 10px',flex:1}}>
          <Icon name={icon} size={24} color={act?T.lime:T.muted} sw={act?2.2:2}/>
          <span style={{fontSize:10,fontWeight:800,color:act?T.lime:T.muted}}>{label}</span>
          <span style={{width:4,height:4,borderRadius:'50%',background:act?T.lime:'transparent'}}/>
        </button>;})}
    </div>;
  }

  // ---------- ROOMS ----------
  function RoomsScreen({state,openDevice,runScene,updateDevice,onBack,onAddRoom,onEditRoom,reorderRoom,deleteRoom}){
    const {rooms,devices,scenes}=state;
    const [edit,setEdit]=React.useState(false);
    const EditWrap=window.KT_EditWrap;
    const Sub=({children})=><div style={{fontFamily:T.mono,fontSize:10.5,color:T.muted,letterSpacing:1.5,textTransform:'uppercase',margin:'0 2px 10px'}}>{children}</div>;
    return <div style={{padding:'4px 20px 20px'}}>
      <TopBar title="Rooms" onBack={onBack} right={<div style={{display:'flex',gap:8}}>
        <button onClick={()=>{haptic();setEdit(e=>!e);}} style={{display:'flex',gap:6,alignItems:'center',background:edit?T.lime:T.card,border:`1px solid ${edit?T.lime:T.border}`,borderRadius:100,padding:'8px 14px',color:edit?'#16161f':T.text,fontWeight:800,fontSize:13,cursor:'pointer'}}><Icon name={edit?'check':'edit'} size={15}/>{edit?'Done':'Edit'}</button>
        {!edit&&<button onClick={onAddRoom} style={{display:'flex',gap:6,alignItems:'center',background:T.card,border:`1px solid ${T.border}`,borderRadius:100,padding:'8px 14px',color:T.text,fontWeight:800,fontSize:13,cursor:'pointer'}}><Icon name="plus" size={15} color={T.lime}/> New</button>}
      </div>}/>
      {edit && <>
        <div style={{fontSize:12.5,color:T.muted,fontWeight:600,margin:'-6px 0 14px',display:'flex',gap:6,alignItems:'center'}}><Icon name="drag" size={14} color={T.aiViolet}/> Drag to reorder · − removes the room · pencil edits it.</div>
        {rooms.map((r,i)=>{const devs=devices.filter(d=>r.deviceIds.includes(d.id));
          return <EditWrap key={r.id} group="roomtab" idx={i} onReorder={reorderRoom} onDelete={()=>deleteRoom(r.id)} style={{marginBottom:10}}>
            <Card pad={14} style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:42,height:42,borderRadius:13,background:T.violetSoft,display:'flex',alignItems:'center',justifyContent:'center',marginLeft:18}}><Icon name={r.icon} size={22} color={T.lime}/></div>
              <div style={{flex:1}}><div style={{fontWeight:800,fontSize:16}}>{r.name}</div><span style={{fontSize:13,color:T.muted,fontWeight:600}}>{devs.length} devices</span></div>
              <button onClick={e=>{e.stopPropagation();onEditRoom(r);}} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,padding:6,pointerEvents:'auto'}}><Icon name="edit" size={18}/></button>
            </Card>
          </EditWrap>;})}
        <Btn kind="ghost" full style={{marginTop:6}} onClick={onAddRoom}><Icon name="plus" size={18}/> New room</Btn>
      </>}
      {!edit && rooms.map(r=>{
        const devs=devices.filter(d=>r.deviceIds.includes(d.id));
        const lamps=devs.filter(d=>d.type==='light');
        const nonLight=devs.filter(d=>d.type!=='light');
        const rScenes=scenes.filter(s=>(r.sceneIds&&r.sceneIds.includes(s.id))||s.steps.some(st=>r.deviceIds.includes(st.device)));
        const setLamps=(on)=>{lamps.forEach(l=>updateDevice(l.id,{on}));haptic(12);};
        return <div key={r.id} style={{marginBottom:30}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:11,background:T.violetSoft,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name={r.icon} size={18} color={T.lime}/></div>
            <div style={{fontWeight:900,fontSize:20}}>{r.name}</div>
            <span style={{fontSize:13,color:T.muted,fontWeight:700}}>· {devs.length}</span>
            <button onClick={()=>onEditRoom(r)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:T.muted,padding:6}}><Icon name="edit" size={18}/></button>
          </div>

          {/* Scenes & commands — bigger cards */}
          <Sub>Scenes &amp; commands</Sub>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:22}}>
            {rScenes.map(s=><div key={s.id} onClick={()=>{haptic(12);runScene(s.id);}} style={{background:'linear-gradient(155deg,#2c2150,#211b3c)',border:`1px solid ${T.border}`,borderRadius:18,padding:16,cursor:'pointer',minHeight:104,display:'flex',flexDirection:'column',justifyContent:'space-between',boxShadow:'0 4px 12px rgba(0,0,0,0.4)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div style={{width:38,height:38,borderRadius:12,background:'rgba(200,255,0,0.12)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name={s.icon} size={20} color={T.lime}/></div><Icon name="play" size={16} color={T.muted} fill/></div>
              <div style={{fontWeight:900,fontSize:17}}>{s.name}</div></div>)}
            {lamps.length>0&&<>
              <div onClick={()=>setLamps(true)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:16,cursor:'pointer',minHeight:104,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                <div style={{width:38,height:38,borderRadius:12,background:T.violetSoft,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="light" size={20} color={T.lime}/></div><div style={{fontWeight:900,fontSize:16}}>Lights on</div></div>
              <div onClick={()=>setLamps(false)} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:16,cursor:'pointer',minHeight:104,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                <div style={{width:38,height:38,borderRadius:12,background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="lightoff" size={20} color={T.muted}/></div><div style={{fontWeight:900,fontSize:16}}>Lights off</div></div>
            </>}
          </div>

          {/* Devices */}
          {nonLight.length>0&&<><Sub>Devices</Sub>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:22}}>
            {nonLight.map(d=><Card key={d.id} pad={14} onClick={()=>openDevice(d)} style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Icon name={DEVICE_ICON[d.type]} size={20} color={d.status==='online'?T.lime:T.muted}/><StatusDot status={d.status}/></div>
              <div style={{fontWeight:800,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.name}</div></Card>)}
          </div></>}

          {/* Lights */}
          {lamps.length>0&&<><Sub>Lights</Sub>
          {lamps.map(l=><Card key={l.id} pad={14} style={{marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:l.state.on?12:0}}>
              <Icon name="light" size={20} color={l.state.on?T.lime:T.muted}/>
              <div style={{flex:1,fontWeight:800,fontSize:15}}>{l.name}</div>
              <Toggle on={l.state.on} onChange={(v)=>updateDevice(l.id,{on:v})}/></div>
            {l.state.on&&<div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{flex:1}}><Slider value={l.state.brightness} onChange={(v)=>updateDevice(l.id,{brightness:v})}/></div>
              <Mono style={{fontSize:13,color:T.muted,minWidth:38,textAlign:'right'}}>{l.state.brightness}%</Mono></div>}
          </Card>)}</>}
        </div>;
      })}
    </div>;
  }

  // ---------- SETTINGS ----------
  function SettingsScreen({state,bridges,openDeviceSettings,openBridge,openScout,onBack,onAddRoom,onAddScene,onAddDevice,onReplay,onActivity,onDiagnostics,onReset}){
    const {devices}=state;
    const [open,setOpen]=React.useState({devices:true,lights:false});
    const core=devices.filter(d=>d.type!=='light'); const lamps=devices.filter(d=>d.type==='light');
    const Group=({id,header,count,items})=>{
      const isOpen=open[id];
      return <div style={{marginBottom:14}}>
        <Card pad={0} style={{overflow:'hidden'}}>
          <div onClick={()=>setOpen(o=>({...o,[id]:!o[id]}))} style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px',cursor:'pointer'}}>
            <Icon name={id==='lights'?'light':'remote'} size={18} color={T.lime}/>
            <div style={{flex:1,fontWeight:900,fontSize:15}}>{header}</div>
            <Mono style={{fontSize:12,color:T.muted}}>{count}</Mono>
            <Icon name={isOpen?'chevU':'chevD'} size={18} color={T.muted}/>
          </div>
          {isOpen&&<div style={{borderTop:`1px solid ${T.border}`}}>
            {items.map((d,i)=><div key={d.id} onClick={()=>openDeviceSettings(d)} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderBottom:i<items.length-1?`1px solid ${T.border}`:'none',cursor:'pointer'}}>
              <Icon name={DEVICE_ICON[d.type]} size={18} color={d.status==='online'?T.lime:T.muted}/>
              <div style={{flex:1,fontWeight:800,fontSize:14}}>{d.name}</div>
              <Mono style={{fontSize:11,color:T.muted}}>{d.room}</Mono>
              <Icon name="chevR" size={15} color={T.muted}/>
            </div>)}
          </div>}
        </Card>
      </div>;
    };
    const LightsGroup=()=>{
      const isOpen=open.lights;
      return <div style={{marginBottom:14}}>
        <Card pad={0} style={{overflow:'hidden'}}>
          <div onClick={()=>setOpen(o=>({...o,lights:!o.lights}))} style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px',cursor:'pointer'}}>
            <Icon name="light" size={18} color={T.lime}/><div style={{flex:1,fontWeight:900,fontSize:15}}>Lights</div>
            <Mono style={{fontSize:12,color:T.muted}}>{lamps.length}</Mono><Icon name={isOpen?'chevU':'chevD'} size={18} color={T.muted}/>
          </div>
          {isOpen&&<div style={{borderTop:`1px solid ${T.border}`}}>
            <div style={{padding:'10px 16px 4px',fontFamily:T.mono,fontSize:10,color:T.muted,letterSpacing:1.5}}>HUBS · {bridges.length}</div>
            {bridges.map((b,i)=><div key={b.id} onClick={()=>openBridge(b)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:`1px solid ${T.border}`,cursor:'pointer'}}>
              <Icon name="ir" size={18} color={T.aiViolet}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:14}}>{b.name}</div><Mono style={{fontSize:11,color:T.muted}}>{b.ip}</Mono></div>
              <StatusDot status={b.status}/><Mono style={{fontSize:11,color:T.muted}}>{lamps.filter(l=>l.bridge===b.id).length} lights</Mono><Icon name="chevR" size={15} color={T.muted}/>
            </div>)}
            <div style={{padding:'12px 16px 4px',fontFamily:T.mono,fontSize:10,color:T.muted,letterSpacing:1.5}}>LIGHTS</div>
            {lamps.map((d,i)=><div key={d.id} onClick={()=>openDeviceSettings(d)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<lamps.length-1?`1px solid ${T.border}`:'none',cursor:'pointer'}}>
              <Icon name="light" size={18} color={d.status==='online'?T.lime:T.muted}/>
              <div style={{flex:1,fontWeight:800,fontSize:14}}>{d.name}</div>
              <Mono style={{fontSize:11,color:T.muted}}>B{d.bridge} · {d.room}</Mono><Icon name="chevR" size={15} color={T.muted}/>
            </div>)}
          </div>}
        </Card>
      </div>;
    };
    const Action=({icon,label,onClick,color})=><Card pad={0} style={{overflow:'hidden',marginBottom:10}}>
      <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',cursor:'pointer'}}>
        <Icon name={icon} size={18} color={color||T.lime}/><div style={{flex:1,fontWeight:800,fontSize:15}}>{label}</div><Icon name="chevR" size={15} color={T.muted}/>
      </div></Card>;
    return <div style={{padding:'4px 20px 20px'}}>
      <TopBar title="Settings" onBack={onBack}/>
      <div style={{fontFamily:T.mono,fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:'uppercase',margin:'0 4px 10px'}}>Devices</div>
      <Group id="devices" header="Devices" count={core.length} items={core}/>
      <LightsGroup/>
      <Action icon="plus" label="Add a device" onClick={onAddDevice}/>
      <div style={{fontFamily:T.mono,fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:'uppercase',margin:'18px 4px 10px'}}>Organise</div>
      <Action icon="sofa" label="New room" onClick={onAddRoom}/>
      <Action icon="sparkle" label="New scene" onClick={onAddScene}/>
      <Action icon="bolt" label="Troll Scout" color={T.aiViolet} onClick={()=>openScout(null)}/>
      <div style={{fontFamily:T.mono,fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:'uppercase',margin:'18px 4px 10px'}}>System</div>
      <Action icon="scenes" label="Activity" onClick={onActivity}/>
      <Action icon="ir" label="Diagnostics" onClick={onDiagnostics}/>
      <div style={{fontFamily:T.mono,fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:'uppercase',margin:'18px 4px 10px'}}>App</div>
      <Card pad={0} style={{overflow:'hidden'}}>
        <div onClick={onReplay} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderBottom:`1px solid ${T.border}`,cursor:'pointer'}}>
          <Icon name="sparkle" size={18} color={T.lime}/><div style={{flex:1,fontWeight:800,fontSize:15}}>Replay intro</div><Icon name="chevR" size={15} color={T.muted}/></div>
        {['Widgets','Preferences'].map((x,i)=><div key={x} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderBottom:`1px solid ${T.border}`}}>
          <Icon name={x==='Widgets'?'grid':'settings'} size={18} color={T.muted}/><div style={{flex:1,fontWeight:800,fontSize:15}}>{x}</div></div>)}
        <div onClick={onReset} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',cursor:'pointer'}}>
          <Icon name="refresh" size={18} color={T.error}/><div style={{flex:1,fontWeight:800,fontSize:15,color:T.error}}>Reset demo data</div><Icon name="chevR" size={15} color={T.muted}/></div>
      </Card>
      <p style={{textAlign:'center',color:T.muted,fontSize:12,fontWeight:600,marginTop:14}}>Kun Troll — Homeware Hub · v1.0</p>
    </div>;
  }

  // ---------- DEVICE SETTINGS ----------
  function DeviceSettings({device, rooms, onChange, onClose, openScout}){
    const [edits,setEdits]=React.useState({});
    React.useEffect(()=>{setEdits({});},[device]);
    if(!device) return null;
    const d={...device,...edits};
    const upd=(patch)=>{const ne={...edits,...patch};setEdits(ne);onChange({...device,...ne});};
    const field=(label,key,mono)=><div style={{marginBottom:12}}>
      <label style={{fontSize:12,color:T.muted,fontWeight:700,display:'block',marginBottom:6}}>{label}</label>
      <input value={d[key]} onChange={e=>upd({[key]:e.target.value})} style={{width:'100%',boxSizing:'border-box',background:T.card2,border:`1px solid ${T.border}`,borderRadius:12,padding:'12px 14px',color:T.text,fontFamily:mono?T.mono:T.sans,fontWeight:mono?700:800,fontSize:mono?14:16,outline:'none'}}/>
    </div>;
    const libCmds=[{n:'Power',s:'library',c:3},{n:'Volume Up',s:'library',c:3},{n:'Source',s:'manual',c:3}];
    const aiCmds=(d.commands||[]).map(c=>({n:c.name,s:'ai_fetched',c:c.confidence>=0.85?3:c.confidence>=0.6?2:1}));
    const allCmds=[...libCmds,...aiCmds];
    return <Sheet open={!!device} onClose={onClose} title="Device">
      {field('Name','name')}{field('Model','model',true)}
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:T.muted,fontWeight:700,display:'block',marginBottom:6}}>Room</label>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {rooms.map(r=><button key={r.id} onClick={()=>upd({room:r.name})} style={{display:'flex',gap:6,alignItems:'center',padding:'9px 14px',borderRadius:100,border:`1px solid ${d.room===r.name?T.lime:T.border}`,background:d.room===r.name?'rgba(200,255,0,0.1)':T.card2,color:d.room===r.name?T.lime:T.muted,fontWeight:800,fontSize:13,cursor:'pointer'}}><Icon name={r.icon} size={14}/> {r.name}</button>)}
        </div>
      </div>
      <div style={{display:'flex',gap:10}}><div style={{flex:1}}>{field('IP address','ip',true)}</div><div style={{width:96}}>{field('Port','port',true)}</div></div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'8px 4px 8px'}}>
        <span style={{fontFamily:T.mono,fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:'uppercase'}}>Commands</span>
        <span style={{fontFamily:T.mono,fontSize:11,color:T.muted}}>{allCmds.length}{aiCmds.length?` · ${aiCmds.length} via Scout`:''}</span>
      </div>
      <Card pad={0} style={{overflow:'hidden',marginBottom:14}}>
        {allCmds.map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderBottom:i<allCmds.length-1?`1px solid ${T.border}`:'none'}}>
          <div style={{flex:1,fontWeight:800,fontSize:14}}>{c.n}</div><SourceBadge source={c.s}/><ConfidenceDots level={c.c}/></div>)}
      </Card>
      <Btn kind="ghost" full style={{marginBottom:10}} onClick={()=>{onClose();openScout({brand:d.name.split(' ')[0],model:d.model});}}><Icon name="bolt" size={16} color={T.aiViolet}/> Find more with Troll Scout</Btn>
      <div style={{display:'flex',gap:10}}><Btn kind="ghost" style={{flex:1}}><Icon name="refresh" size={16}/> Test</Btn><Btn kind="lime" style={{flex:1}} onClick={onClose}>Done</Btn></div>
    </Sheet>;
  }

  // ---------- ADD / EDIT ROOM ----------
  function RoomEditor({open, room, devices, scenes, onClose, onSave}){
    const [name,setName]=React.useState(''); const [icon,setIcon]=React.useState('sofa');
    const [devIds,setDevIds]=React.useState([]); const [scIds,setScIds]=React.useState([]);
    React.useEffect(()=>{ if(open){ setName(room?room.name:''); setIcon(room?room.icon:'sofa'); setDevIds(room?[...room.deviceIds]:[]); setScIds(room&&room.sceneIds?[...room.sceneIds]:[]); } },[open,room]);
    if(!open) return null;
    const tog=(arr,set,id)=>set(arr.includes(id)?arr.filter(x=>x!==id):[...arr,id]);
    return <Sheet open={open} onClose={onClose} title={room?'Edit room':'New room'}>
      <label style={{fontSize:12,color:T.muted,fontWeight:700,display:'block',marginBottom:6}}>Name</label>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Living Room" style={{width:'100%',boxSizing:'border-box',background:T.card2,border:`1px solid ${T.border}`,borderRadius:12,padding:'12px 14px',color:T.text,fontFamily:T.sans,fontWeight:800,fontSize:16,outline:'none',marginBottom:14}}/>
      <label style={{fontSize:12,color:T.muted,fontWeight:700,display:'block',marginBottom:8}}>Icon</label>
      <div style={{display:'flex',gap:10,marginBottom:16}}>
        {ROOM_ICONS.map(ic=><button key={ic} onClick={()=>setIcon(ic)} style={{width:46,height:46,borderRadius:13,border:`1px solid ${icon===ic?T.lime:T.border}`,background:icon===ic?'rgba(200,255,0,0.1)':T.card2,color:icon===ic?T.lime:T.muted,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name={ic} size={20}/></button>)}
      </div>
      <label style={{fontSize:12,color:T.muted,fontWeight:700,display:'block',marginBottom:8}}>Devices</label>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {devices.map(d=>{const on=devIds.includes(d.id);return <button key={d.id} onClick={()=>tog(devIds,setDevIds,d.id)} style={{display:'flex',gap:6,alignItems:'center',padding:'8px 12px',borderRadius:100,border:`1px solid ${on?T.lime:T.border}`,background:on?'rgba(200,255,0,0.1)':T.card2,color:on?T.lime:T.muted,fontWeight:800,fontSize:12,cursor:'pointer'}}><Icon name={DEVICE_ICON[d.type]} size={14}/>{d.name}</button>;})}
      </div>
      <label style={{fontSize:12,color:T.muted,fontWeight:700,display:'block',marginBottom:8}}>Scenes</label>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
        {scenes.map(s=>{const on=scIds.includes(s.id);return <button key={s.id} onClick={()=>tog(scIds,setScIds,s.id)} style={{display:'flex',gap:6,alignItems:'center',padding:'8px 12px',borderRadius:100,border:`1px solid ${on?T.lime:T.border}`,background:on?'rgba(200,255,0,0.1)':T.card2,color:on?T.lime:T.muted,fontWeight:800,fontSize:12,cursor:'pointer'}}><Icon name={s.icon} size={14}/>{s.name}</button>;})}
      </div>
      <Btn kind="lime" full onClick={()=>{ if(!name.trim())return; onSave({id:room?room.id:'room'+Date.now(),name:name.trim(),icon,deviceIds:devIds,sceneIds:scIds}); onClose(); }}>{room?'Save room':'Create room'}</Btn>
    </Sheet>;
  }

  // ---------- BRIDGE CONFIG ----------
  function BridgeConfig({bridge, lamps, onChange, onClose}){
    const [edits,setEdits]=React.useState({});
    React.useEffect(()=>{setEdits({});},[bridge]);
    if(!bridge) return null;
    const b={...bridge,...edits};
    const upd=(p)=>{const ne={...edits,...p};setEdits(ne);onChange({...bridge,...ne});};
    const myLamps=lamps.filter(l=>l.bridge===bridge.id);
    const field=(label,key,mono)=><div style={{marginBottom:12}}>
      <label style={{fontSize:12,color:T.muted,fontWeight:700,display:'block',marginBottom:6}}>{label}</label>
      <input value={b[key]} onChange={e=>upd({[key]:e.target.value})} style={{width:'100%',boxSizing:'border-box',background:T.card2,border:`1px solid ${T.border}`,borderRadius:12,padding:'12px 14px',color:T.text,fontFamily:mono?T.mono:T.sans,fontWeight:mono?700:800,fontSize:mono?14:16,outline:'none'}}/>
    </div>;
    return <Sheet open={!!bridge} onClose={onClose} title="Hue Bridge">
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <div style={{width:42,height:42,borderRadius:12,background:'rgba(167,139,250,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="ir" size={22} color={T.aiViolet}/></div>
        <div style={{flex:1}}><div style={{fontWeight:900,fontSize:16}}>{b.model}</div><div style={{display:'flex',gap:6,alignItems:'center'}}><StatusDot status={b.status}/><Mono style={{fontSize:11,color:T.muted}}>{b.status}</Mono></div></div>
      </div>
      {field('Name','name')}{field('IP address','ip',true)}
      <div style={{fontFamily:T.mono,fontSize:11,color:T.muted,letterSpacing:1.5,textTransform:'uppercase',margin:'10px 4px 8px'}}>Lights on this hub · {myLamps.length}</div>
      <Card pad={0} style={{overflow:'hidden',marginBottom:14}}>
        {myLamps.map((l,i)=><div key={l.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderBottom:i<myLamps.length-1?`1px solid ${T.border}`:'none'}}>
          <Icon name="light" size={18} color={l.state.on?T.lime:T.muted}/><div style={{flex:1,fontWeight:800,fontSize:14}}>{l.name}</div><Mono style={{fontSize:11,color:T.muted}}>{l.room}</Mono></div>)}
      </Card>
      <Btn kind="ghost" full style={{marginBottom:10}}><Icon name="search" size={16}/> Search for new lights</Btn>
      <Btn kind="lime" full onClick={onClose}>Done</Btn>
    </Sheet>;
  }

  function App(){
    // ---- persistence: hydrate durable slices from localStorage (versioned) ----
    const SKEY='kuntroll.v1';
    const persisted=React.useMemo(()=>{ try{return JSON.parse(localStorage.getItem(SKEY))||{};}catch(e){return {};} },[]);
    const pick=(k,fb)=> (persisted && persisted[k]!==undefined) ? persisted[k] : fb;
    const [t,setTweak]=window.useTweaks(TWEAK_DEFAULTS);
    const [tab,setTabRaw]=React.useState('home');
    const [prev,setPrev]=React.useState('home');
    const [dir,setDir]=React.useState(1);
    const [devices,setDevices]=React.useState(()=>pick('devices',clone(D.DEVICES)));
    const [scenes,setScenes]=React.useState(()=>pick('scenes',clone(D.SCENES)));
    const [rooms,setRooms]=React.useState(()=>pick('rooms',clone(D.ROOMS)));
    const [mainId,setMainId]=React.useState(()=>pick('mainId','tv'));
    const [volId,setVolId]=React.useState(()=>pick('volId','rec'));
    const [homeOrder,setHomeOrder]=React.useState(()=>pick('homeOrder',['favorites','lights','rooms','devices']));
    const [editHome,setEditHome]=React.useState(false);
    const [scout,setScout]=React.useState({open:false,prefill:null});
    const [devSettings,setDevSettings]=React.useState(null);
    const [roomEd,setRoomEd]=React.useState({open:false,room:null});
    const [sceneEd,setSceneEd]=React.useState({open:false,scene:null});
    const [addDevice,setAddDevice]=React.useState(false);
    const [onboarding,setOnboarding]=React.useState(()=>!persisted.seenOnboarding);
    const [sizes,setSizes]=React.useState(()=>pick('sizes',{favorites:'M',lights:'M',rooms:'M',devices:'M'}));
    const [lightScenes,setLightScenes]=React.useState(()=>pick('lightScenes',clone(D.LIGHT_SCENES)));
    const [bridges,setBridges]=React.useState(()=>pick('bridges',clone(D.BRIDGES)));
    const [bridgeCfg,setBridgeCfg]=React.useState(null);
    const [recovery,setRecovery]=React.useState(null);
    const [diagOpen,setDiagOpen]=React.useState(false);
    const [activity,setActivity]=React.useState(()=>pick('activity', window.KT_DATA.ACTIVITY?clone(window.KT_DATA.ACTIVITY):[]));
    const [act,setAct]=React.useState({show:false,exp:'wow'});
    const [toast,setToast]=React.useState(null);
    const actTimer=React.useRef(null), toastTimer=React.useRef(null);

    const troll={variant:VARKEY[t.trollRendering]||'A', presence:'subtle'};
    window.KT_TROLL_VARIANT=troll.variant;
    // ---- persistence: write durable slices whenever they change (debounced via rAF) ----
    React.useEffect(()=>{
      const data={devices,scenes,rooms,mainId,volId,homeOrder,sizes,lightScenes,bridges,activity,seenOnboarding:!onboarding||persisted.seenOnboarding};
      try{ localStorage.setItem(SKEY, JSON.stringify(data)); }catch(e){}
    },[devices,scenes,rooms,mainId,volId,homeOrder,sizes,lightScenes,bridges,activity,onboarding]);
    const state={devices,scenes,rooms};
    const online=devices.filter(d=>d.status==='online').length;
    const greeting=greetingNow(online,devices.length);
    const mainDevice=devices.find(d=>d.id===mainId);
    const volumeDevice=devices.find(d=>d.id===volId);

    const TAB_ORDER=['home','rooms','controller','scenes','settings'];
    const go=(to)=>{ if(to===tab)return; const d=(TAB_ORDER.indexOf(to)>=TAB_ORDER.indexOf(tab))?1:-1; setDir(d); setPrev(tab); setTabRaw(to); };
    const back=()=>{ setDir(-1); setTabRaw(prev==='controller'?'home':prev); };

    const ping=(exp='wow')=>{ setAct({show:true,exp}); if(actTimer.current)clearTimeout(actTimer.current); actTimer.current=setTimeout(()=>setAct(a=>({...a,show:false})),1900); };
    const showToast=(m)=>{ setToast(m); if(toastTimer.current)clearTimeout(toastTimer.current); toastTimer.current=setTimeout(()=>setToast(null),1900); };

    const logEvent=(ev)=>setActivity(a=>[{ id:'ev'+Date.now()+Math.random().toString(36).slice(2,6), ts:Date.now(), ...ev }, ...a].slice(0,80));

    const updateDevice=(id,patch)=>setDevices(ds=>ds.map(d=>d.id===id?{...d,state:{...d.state,...patch}}:d));
    const editDevice=(nd)=>setDevices(ds=>ds.map(d=>d.id===nd.id?nd:d));
    const favScene=(id)=>setScenes(ss=>ss.map(s=>s.id===id?{...s,favourite:!s.favourite}:s));

    function applyScene(s){
      setDevices(ds=>ds.map(dv=>{ let st={...dv.state};
        s.steps.forEach(step=>{ if(step.device!==dv.id)return; const L=step.label.toLowerCase();
          if(/(off|sleep)/.test(L)) st.power=false; else if(/(on|wake)/.test(L)) st.power=true;
          const vm=step.label.match(/→\s*(\d{1,3})/)||step.label.match(/volume\D*(\d{1,3})/i);
          if(vm && typeof st.volume==='number') st.volume=parseInt(vm[1]); });
        return {...dv,state:st}; }));
    }
    const runScene=(id)=>{ const s=scenes.find(x=>x.id===id); if(!s)return; haptic(15); applyScene(s); 
      const stepDevIds=[...new Set(s.steps.map(st=>st.device).filter(x=>x!=='lights'))];
      const failed=stepDevIds.map(did=>devices.find(d=>d.id===did)).filter(d=>d&&d.status==='offline');
      if(failed.length){ ping('sleepy'); showToast(`${s.name} — ${failed.length} device didn't respond`);
        logEvent({kind:'scene', status:'partial', title:s.name, icon:s.icon, detail:`${failed[0].name} offline · ${s.steps.length-failed.length}/${s.steps.length} sent`}); }
      else { ping('wow'); showToast(`${s.name} is on`);
        logEvent({kind:'scene', status:'ok', title:s.name, icon:s.icon, detail:`${s.steps.length} commands sent`}); }
      const now=new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
      setScenes(ss=>ss.map(x=>x.id===id?{...x,lastFired:now}:x)); go('controller'); };
    const allLightsOff=()=>{ haptic(12); setDevices(ds=>ds.map(d=>d.type==='light'?{...d,state:{...d.state,on:false}}:d)); ping('happy'); showToast('All lights off');
      logEvent({kind:'command', status:'ok', title:'All lights off', icon:'lightoff', detail:'Every Hue light'}); };
    const openDevice=(d)=>{ if(d.type==='ir'){setDevSettings(d);return;} setMainId(d.id); go('controller'); };
    const openScout=(prefill)=>setScout({open:true,prefill});
    const saveScoutCmds=(cmds,brand,model)=>{ if(!cmds||!cmds.length)return;
      // attach confirmed commands to the matching device (by model, else by brand in name)
      setDevices(ds=>ds.map(d=>{
        const match = (model&&d.model===model) || (brand&&d.name.toLowerCase().includes(String(brand).toLowerCase()));
        if(!match) return d;
        const prior=d.commands||[];
        const merged=[...prior, ...cmds.map(c=>({name:c.name,code:c.code,source:'ai_fetched',confidence:c.confidence}))];
        return {...d, commands:merged};
      }));
      showToast(`${cmds.length} command${cmds.length>1?'s':''} saved`); ping('wow');
      logEvent({kind:'scout', status:'ok', title:`${cmds.length} commands saved`, icon:'bolt', detail:`${brand||''} ${model||''}`.trim()+' · via Troll Scout'}); };
    const saveRoom=(r)=>setRooms(rs=>rs.some(x=>x.id===r.id)?rs.map(x=>x.id===r.id?r:x):[...rs,r]);
    const saveScene=(s)=>{ setScenes(ss=>ss.some(x=>x.id===s.id)?ss.map(x=>x.id===s.id?s:x):[...ss,s]); showToast(`${s.name} saved`); };
    const addNewDevice=(d)=>{ setDevices(ds=>[...ds,d]); showToast(`${d.name} added`); ping('wow'); };
    const act2=()=>{ haptic(); };  // controller buttons: haptic only — Troll reserved for scenes/lights/device events
    const setSize=(id,s)=>setSizes(o=>({...o,[id]:s}));
    const applyLightScene=(sc)=>{ haptic(12); setDevices(ds=>ds.map(d=>{ if(d.type!=='light')return d; const snap=sc.snapshot&&sc.snapshot[d.id]; return {...d,state:{...d.state, ...(snap?snap:{on:true,brightness:sc.preset.brightness,temp:sc.preset.temp})}}; })); ping('happy'); showToast(`${sc.name} · lights set`); };
    const addLightScene=()=>{ const snapshot={}; devices.filter(d=>d.type==='light').forEach(l=>{snapshot[l.id]={on:l.state.on,brightness:l.state.brightness,temp:l.state.temp};}); const n=lightScenes.filter(s=>s.snapshot).length+1; setLightScenes(a=>[...a,{id:'ls'+Date.now(),name:'My Scene '+n,icon:'sparkle',snapshot}]); haptic(12); showToast('Light scene saved'); };
    const editBridge=(b)=>setBridges(bs=>bs.map(x=>x.id===b.id?b:x));
    const resetDemo=()=>{ if(!window.confirm('Reset all demo data — devices, scenes, rooms and activity — to factory defaults?'))return;
      try{ localStorage.removeItem('kuntroll.v1'); }catch(e){}
      setDevices(clone(D.DEVICES)); setScenes(clone(D.SCENES)); setRooms(clone(D.ROOMS));
      setLightScenes(clone(D.LIGHT_SCENES)); setBridges(clone(D.BRIDGES));
      setActivity(window.KT_DATA.ACTIVITY?clone(window.KT_DATA.ACTIVITY):[]);
      setMainId('tv'); setVolId('rec'); setHomeOrder(['favorites','lights','rooms','devices']);
      setSizes({favorites:'M',lights:'M',rooms:'M',devices:'M'});
      haptic(20); showToast('Demo data reset'); go('home'); };
    const reconnectDevice=(id)=>{ setDevices(ds=>ds.map(d=>d.id===id?{...d,status:'online',latency:32,lastSeen:'now'}:d));
      const dv=devices.find(d=>d.id===id); ping('wow'); showToast(`${dv?dv.name:'Device'} reconnected`);
      logEvent({kind:'command', status:'ok', title:'Reconnected', icon:'refresh', detail:(dv?dv.name:'Device')+' is back online'}); };
    const reorderFav=(from,to,kind)=>{ if(kind==='light'){ setLightScenes(ls=>{const a=[...ls];const[m]=a.splice(from,1);a.splice(to,0,m);return a;}); return; }
      setScenes(ss=>{const favs=ss.filter(s=>s.favourite);const moved=[...favs];const[m]=moved.splice(from,1);moved.splice(to,0,m);let i=0;return ss.map(s=>s.favourite?moved[i++]:s);}); };
    const removeFav=(id)=>{ haptic(); setScenes(ss=>ss.map(s=>s.id===id?{...s,favourite:false}:s)); showToast('Removed from Home'); };
    const removeLightScene=(id)=>{ haptic(); setLightScenes(ls=>ls.filter(s=>s.id!==id)); showToast('Light scene removed'); };
    const reorderRoom=(from,to)=>setRooms(rs=>{const a=[...rs];const[m]=a.splice(from,1);a.splice(to,0,m);return a;});
    const reorderDevice=(from,to)=>setDevices(ds=>{ const core=ds.filter(d=>d.type!=='light'&&d.type!=='ir'); const moved=[...core];const[m]=moved.splice(from,1);moved.splice(to,0,m);
      let i=0; return ds.map(d=>(d.type!=='light'&&d.type!=='ir')?moved[i++]:d); });
    const reorderScene=(from,to)=>setScenes(ss=>{const a=[...ss];const[m]=a.splice(from,1);a.splice(to,0,m);return a;});
    const deleteScene=(id)=>{ haptic(); setScenes(ss=>ss.filter(s=>s.id!==id)); showToast('Scene deleted'); };
    const deleteRoom=(id)=>{ haptic(); setRooms(rs=>rs.filter(r=>r.id!==id)); showToast('Room removed'); };

    let screen;
    if(tab==='home') screen=<window.KT_Home state={state} greeting={greeting} runScene={runScene} openDevice={openDevice} openRoom={()=>go('rooms')} updateDevice={updateDevice} allLightsOff={allLightsOff} homeOrder={homeOrder} reorderHome={(from,to)=>setHomeOrder(o=>{const a=[...o];const[m]=a.splice(from,1);a.splice(to,0,m);return a;})} editHome={editHome} setEditHome={setEditHome} sizes={sizes} setSize={setSize} lightScenes={lightScenes} applyLightScene={applyLightScene} addLightScene={addLightScene} reorderFav={reorderFav} removeFav={removeFav} removeLightScene={removeLightScene} reorderRoom={reorderRoom} reorderDevice={reorderDevice} trollVariant={troll.variant} openScenes={()=>go('scenes')} openAddDevice={()=>setAddDevice(true)}/>;
    else if(tab==='rooms') screen=<RoomsScreen state={state} openDevice={openDevice} runScene={runScene} updateDevice={updateDevice} onBack={()=>go('home')} onAddRoom={()=>setRoomEd({open:true,room:null})} onEditRoom={(r)=>setRoomEd({open:true,room:r})} reorderRoom={reorderRoom} deleteRoom={deleteRoom}/>;
    else if(tab==='controller') screen=<window.KT_Controller mainDevice={mainDevice} volumeDevice={volumeDevice} devices={devices} scenes={scenes} t={t} update={updateDevice} runScene={runScene} act={act2} onBack={back} setMain={setMainId} setVolumeDev={setVolId} sources={D.SOURCES} soundModes={D.SOUND_MODES}/>;
    else if(tab==='scenes') screen=<window.KT_Scenes state={state} runScene={runScene} favScene={favScene} onBack={()=>go('home')} onNewScene={()=>setSceneEd({open:true,scene:null})} reorderScene={reorderScene} deleteScene={deleteScene} onEditScene={(s)=>setSceneEd({open:true,scene:s})}/>;
    else if(tab==='activity') screen=<window.KT_Activity activity={activity} devices={devices} trollVariant={troll.variant} onBack={()=>go('home')} onDiagnostics={()=>setDiagOpen(true)} onRecover={(d)=>setRecovery(d)}/>;
    else screen=<SettingsScreen state={state} bridges={bridges} openDeviceSettings={setDevSettings} openBridge={(b)=>setBridgeCfg(b)} openScout={openScout} onBack={()=>go('home')} onAddRoom={()=>setRoomEd({open:true,room:null})} onAddScene={()=>setSceneEd({open:true,scene:null})} onAddDevice={()=>setAddDevice(true)} onReplay={()=>setOnboarding(true)} onActivity={()=>go('activity')} onDiagnostics={()=>setDiagOpen(true)} onReset={resetDemo}/>;

    return <div style={{position:'relative',width:'100%',height:'100%',background:T.bg,color:T.text,fontFamily:T.sans,fontWeight:700,overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,overflowY:'auto',overflowX:'hidden',paddingTop:58,paddingBottom:'calc(env(safe-area-inset-bottom) + 78px)'}} key={tab}>
        <div style={{animation:`${dir>=0?'ktSlideFwd':'ktSlideBack'} .32s cubic-bezier(.2,.9,.3,1)`}}>{screen}</div>
      </div>
      <TabBar tab={tab} setTab={go}/>

      {/* coordinated announcement: toast pill above the tab bar, Kun Troll peeks up behind it — one gesture, no header collision */}
      {(act.show||toast) && <div style={{position:'absolute',bottom:'calc(env(safe-area-inset-bottom) + 92px)',left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',zIndex:250,pointerEvents:'none'}}>
        {act.show && <div style={{marginBottom:-14,filter:'drop-shadow(0 6px 16px rgba(107,40,238,0.5))',animation:'ktTrollPeek .42s cubic-bezier(.34,1.4,.5,1)'}}>
          <Troll exp={act.exp} variant={troll.variant} presence="subtle" size={72} float={false}/></div>}
        {toast && <div style={{background:'rgba(37,37,64,0.97)',border:`1px solid ${T.borderStrong}`,borderRadius:100,
          padding:'11px 20px',fontWeight:800,fontSize:14,boxShadow:'0 8px 24px rgba(0,0,0,0.5)',animation:'ktToastRise .4s cubic-bezier(.2,.9,.3,1) .06s both'}}>{toast}</div>}
      </div>}

      {scout.open && <window.KT_TrollScout prefill={scout.prefill} troll={troll} onClose={()=>setScout({open:false,prefill:null})} onSave={saveScoutCmds}/>}
      <DeviceSettings device={devSettings} rooms={rooms} onChange={editDevice} onClose={()=>setDevSettings(null)} openScout={openScout}/>
      <RoomEditor open={roomEd.open} room={roomEd.room} devices={devices} scenes={scenes} onClose={()=>setRoomEd({open:false,room:null})} onSave={saveRoom}/>
      {sceneEd.open && <window.KT_SceneBuilder existing={sceneEd.scene} devices={devices.filter(d=>d.type!=='ir')} onClose={()=>setSceneEd({open:false,scene:null})} onSave={saveScene}/>}
      {addDevice && <window.KT_AddDevice troll={troll} rooms={rooms} onClose={()=>setAddDevice(false)} onAdd={addNewDevice} openScout={openScout}/>}
      {onboarding && <window.KT_Onboarding troll={troll} onDone={()=>{ setOnboarding(false); try{const d=JSON.parse(localStorage.getItem(SKEY))||{};d.seenOnboarding=true;localStorage.setItem(SKEY,JSON.stringify(d));}catch(e){} }}/>}
      <BridgeConfig bridge={bridgeCfg} lamps={devices.filter(d=>d.type==='light')} onChange={editBridge} onClose={()=>setBridgeCfg(null)}/>
      {recovery && <window.KT_Recovery device={recovery} troll={troll} onClose={()=>setRecovery(null)} onReconnected={reconnectDevice}/>}
      <window.KT_Diagnostics open={diagOpen} devices={devices} onClose={()=>setDiagOpen(false)} onRecover={(d)=>setRecovery(d)}/>

      <window.TweaksPanel>
        <window.TweakSection label="Remote"/>
        <window.TweakRadio label="Button feel" value={t.remoteStyle} options={['flat','soft','tactile']} onChange={v=>setTweak('remoteStyle',v)}/>
        <window.TweakSection label="Kun Troll"/>
        <window.TweakRadio label="Rendering" value={t.trollRendering} options={['Pebble','Quiet','Sticker']} onChange={v=>setTweak('trollRendering',v)}/>
      </window.TweaksPanel>
    </div>;
  }

  window.KT_App=App;
})();
