// ui.jsx — design tokens, icons, and shared primitives
(function(){
  const T={
    bg:'#1A1A2E', card:'#252540', card2:'#1E1E38',
    violet:'#6B28EE', violetDeep:'#5A20CC', violetSoft:'rgba(107,40,238,0.16)',
    lime:'#C8FF00', text:'#F0F0F0', muted:'#9B8BC4',
    border:'rgba(180,160,255,0.15)', borderStrong:'rgba(180,160,255,0.28)',
    success:'#4ADE80', warning:'#FACC15', error:'#F87171', aiViolet:'#A78BFA',
    mono:"'Space Mono',monospace", sans:"'Nunito',system-ui,sans-serif",
  };

  // ---- Icons (24x24, stroke currentColor) ----
  const P={
    home:'M3 11l9-8 9 8M5 9.5V21h5v-6h4v6h5V9.5',
    rooms:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    remote:'M9 2h6a2 2 0 012 2v16a2 2 0 01-2 2H9a2 2 0 01-2-2V4a2 2 0 012-2zM12 6.5v.01M12 11a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
    scenes:'M12 3l1.8 4.6L18.5 9l-4 3 1.3 5L12 14.8 8.2 17l1.3-5-4-3 4.7-1.4z',
    settings:'M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 13a7.5 7.5 0 000-2l2-1.5-2-3.5-2.4 1a7.5 7.5 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a7.5 7.5 0 00-1.7 1l-2.4-1-2 3.5L4.6 11a7.5 7.5 0 000 2l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 001.7 1l.4 2.5h4l.4-2.5a7.5 7.5 0 001.7-1l2.4 1 2-3.5z',
    tv:'M3 5h18v11H3zM8 20h8M12 16v4',
    receiver:'M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zM12 9a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM8 6.5h.01M12 6.5h.01',
    light:'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0012 3z',
    appletv:'M3 4h18v13H3zM8 21h8M10 8.5l5 3-5 3z',
    ir:'M12 12v.01M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7M5.5 5.5a9 9 0 000 13M18.5 5.5a9 9 0 010 13',
    power:'M12 4v8M7.5 7a7 7 0 109 0',
    volup:'M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14',
    voldown:'M11 5L6 9H3v6h3l5 4zM16 9.5l5 5M21 9.5l-5 5',
    mute:'M11 5L6 9H3v6h3l5 4zM16 9.5l5 5M21 9.5l-5 5',
    chevR:'M9 6l6 6-6 6', chevL:'M15 6l-6 6 6 6',
    chevU:'M6 15l6-6 6 6', chevD:'M6 9l6 6 6-6',
    plus:'M12 5v14M5 12h14', minus:'M5 12h14',
    play:'M7 4l13 8-13 8z', pause:'M8 5v14M16 5v14',
    rew:'M11 6L4 12l7 6zM20 6l-7 6 7 6z', ff:'M13 6l7 6-7 6zM4 6l7 6-7 6z',
    heart:'M12 20s-7-4.6-9.5-9A5 5 0 0112 5a5 5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z',
    more:'M5 12h.01M12 12h.01M19 12h.01',
    search:'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3',
    check:'M5 13l4 4 10-11', x:'M6 6l12 12M18 6L6 18',
    drag:'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
    edit:'M4 20h4L18.5 9.5a2 2 0 00-3-3L5 17v3zM14 7l3 3',
    back:'M15 5l-7 7 7 7', sparkle:'M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3',
    refresh:'M20 11a8 8 0 10-2 6M20 5v6h-6', bolt:'M13 2L4 14h7l-1 8 9-12h-7z',
    grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    cancel:'M12 3a9 9 0 100 18 9 9 0 000-18zM9 9l6 6M15 9l-6 6',
    plug:'M9 2v6M15 2v6M7 8h10v3a5 5 0 01-10 0zM12 16v6',
    film:'M3 8h18v12H3zM3 8l3-4h12l3 4M8 4l-2 4M14 4l-2 4',
    moon:'M20.5 14.5A8 8 0 119.5 3.5a6.5 6.5 0 0011 11z',
    sun:'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 7a5 5 0 100 10 5 5 0 000-10z',
    note:'M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
    sofa:'M5 11V8a3 3 0 013-3h8a3 3 0 013 3v3M3 12a2 2 0 014 0v3h10v-3a2 2 0 014 0v5H3zM6 19v2M18 19v2',
    bed:'M3 18V7M3 13h18v5M21 18v-5a3 3 0 00-3-3h-7v3M6 13v-1a1 1 0 011-1h2a1 1 0 011 1v1',
    kitchen:'M6 3v7M4 3v3a2 2 0 004 0V3M6 10v11M16 3c-1.7 0-2.5 2.2-2.5 4.5S14.3 12 16 12s2.5-2.2 2.5-4.5S17.7 3 16 3zM16 12v9',
    lightoff:'M3 3l18 18M9 18h6M10 21h4M8.5 13.8A6 6 0 0112 3a6 6 0 014 10.5c-.7.7-1 1.3-1 2.5',
  };
  function Icon({name, size=24, color, sw=2, style={}, fill=false}){
    const d=P[name]||''; 
    const filled=['play','heartFill'].includes(name);
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill?(color||'currentColor'):'none'}
           stroke={fill?'none':(color||'currentColor')} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
        {name==='heartFill'
          ? <path d={P.heart} fill={color||'currentColor'} stroke="none"/>
          : <path d={d}/>}
      </svg>
    );
  }
  const DEVICE_ICON={tv:'tv',receiver:'receiver',light:'light',appletv:'appletv',ir:'ir'};

  // ---- haptic (visual no-op + optional vibrate) ----
  function haptic(ms=8){ if(navigator.vibrate) try{navigator.vibrate(ms);}catch(e){} }

  // ---- unified tactile press: spread onto any tappable element ----
  function pressable(scale=0.97){
    const down=e=>{ e.currentTarget.style.transform=`scale(${scale})`; };
    const up=e=>{ e.currentTarget.style.transform='scale(1)'; };
    return {
      onMouseDown:down, onMouseUp:up, onMouseLeave:up,
      onTouchStart:down, onTouchEnd:up, onTouchCancel:up,
    };
  }

  // ---- TweenNumber: animates between values ----
  function TweenNumber({value, dur=380, format=(v)=>Math.round(v)}){
    const [disp,setDisp]=React.useState(value);
    const ref=React.useRef({from:value,to:value,start:0,raf:0});
    React.useEffect(()=>{
      const s=ref.current; s.from=disp; s.to=value; s.start=performance.now();
      cancelAnimationFrame(s.raf);
      const tick=(now)=>{ const t=Math.min(1,(now-s.start)/dur); const e=1-Math.pow(1-t,3); // easeOutCubic
        setDisp(s.from+(s.to-s.from)*e); if(t<1) s.raf=requestAnimationFrame(tick); };
      s.raf=requestAnimationFrame(tick);
      return ()=>cancelAnimationFrame(s.raf);
    },[value]);
    return <>{format(disp)}</>;
  }

  // ---- EmptyState: Troll + line + optional action ----
  function EmptyState({exp='sleepy', title, sub, action, onAction, variant='A', compact=false}){
    const Troll=window.Troll;
    return <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',
      padding:compact?'20px 16px':'34px 24px'}}>
      {Troll && <div style={{opacity:0.92,marginBottom:6}}><Troll exp={exp} variant={variant} presence="subtle" size={compact?64:88}/></div>}
      <div style={{fontWeight:900,fontSize:compact?16:18,marginTop:6}}>{title}</div>
      {sub && <div style={{color:T.muted,fontWeight:600,fontSize:13.5,marginTop:7,maxWidth:260,lineHeight:1.5}}>{sub}</div>}
      {action && <button onClick={onAction} {...pressable()} style={{marginTop:18,display:'inline-flex',gap:7,alignItems:'center',
        background:T.violet,border:'none',borderRadius:100,padding:'11px 20px',color:'#fff',fontFamily:T.sans,fontWeight:800,fontSize:14,
        cursor:'pointer',transition:'transform .14s cubic-bezier(.2,.9,.3,1)'}}>
        <Icon name="plus" size={16}/>{action}</button>}
    </div>;
  }

  // ---- Card (tactile when clickable) ----
  function Card({children, style={}, onClick, active=false, pad=16}){
    const press=onClick?pressable():{};
    return <div onClick={onClick} {...press} style={{
      background:T.card, border:`1px solid ${active?T.borderStrong:T.border}`, borderRadius:20,
      padding:pad, boxShadow:'0 4px 12px rgba(0,0,0,0.4)', cursor:onClick?'pointer':'default',
      transition:'transform .14s cubic-bezier(.2,.9,.3,1)', ...style
    }}>{children}</div>;
  }

  // ---- Pill button ----
  function Btn({children, onClick, kind='primary', style={}, full=false}){
    const base={border:'none',borderRadius:100,fontFamily:T.sans,fontWeight:800,fontSize:16,whiteSpace:'nowrap',
      padding:'14px 24px',cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,
      width:full?'100%':'auto',transition:'transform .12s, filter .15s',WebkitTapHighlightColor:'transparent'};
    const kinds={
      primary:{background:T.violet,color:'#fff'},
      lime:{background:T.lime,color:'#16161f'},
      ghost:{background:'transparent',color:T.text,border:`1px solid ${T.border}`},
      danger:{background:'rgba(248,113,113,0.14)',color:T.error},
    };
    return <button onClick={e=>{haptic();onClick&&onClick(e);}}
      onMouseDown={e=>e.currentTarget.style.transform='scale(0.97)'}
      onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
      style={{...base,...kinds[kind],...style}}>{children}</button>;
  }

  // ---- SourceBadge / ConfidenceDots ----
  function SourceBadge({source}){
    const map={manual:[T.success,'manual'],library:[T.lime,'library'],ai_fetched:[T.aiViolet,'ai_fetched']};
    const [c,label]=map[source]||map.library;
    return <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:c,
      border:`1px solid ${c}55`,background:`${c}1a`,borderRadius:100,padding:'2px 8px',letterSpacing:0.5}}>{label}</span>;
  }
  function ConfidenceDots({level}){ // 1..3
    return <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
      {[1,2,3].map(i=><span key={i} style={{width:6,height:6,borderRadius:'50%',
        background:i<=level?T.lime:'rgba(255,255,255,0.18)'}}/>)}
    </span>;
  }

  // ---- Toggle ----
  function Toggle({on, onChange, size=1}){
    return <div onClick={()=>{haptic();onChange&&onChange(!on);}} style={{
      width:46*size,height:28*size,borderRadius:100,background:on?T.lime:'#3a3a55',position:'relative',
      cursor:'pointer',transition:'background .2s',flexShrink:0}}>
      <div style={{position:'absolute',top:3*size,left:on?(46*size-25*size):3*size,width:22*size,height:22*size,
        borderRadius:'50%',background:on?'#16161f':'#fff',transition:'left .2s'}}/>
    </div>;
  }

  // ---- Slider (drag/tap) ----
  function Slider({value, onChange, min=0, max=100, accent}){
    const ref=React.useRef(null);
    const acc=accent||T.lime;
    const set=(clientX)=>{ const r=ref.current.getBoundingClientRect();
      let p=(clientX-r.left)/r.width; p=Math.max(0,Math.min(1,p));
      onChange(Math.round(min+p*(max-min))); };
    const onDown=(e)=>{ haptic(); set(e.touches?e.touches[0].clientX:e.clientX);
      const mv=(ev)=>set(ev.touches?ev.touches[0].clientX:ev.clientX);
      const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);
        window.removeEventListener('touchmove',mv);window.removeEventListener('touchend',up);};
      window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);
      window.addEventListener('touchmove',mv,{passive:false});window.addEventListener('touchend',up); };
    const pct=((value-min)/(max-min))*100;
    return <div ref={ref} onMouseDown={onDown} onTouchStart={onDown} style={{
      height:36,borderRadius:12,background:'rgba(255,255,255,0.08)',position:'relative',cursor:'pointer',overflow:'hidden',userSelect:'none'}}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:pct+'%',background:acc,opacity:0.9,transition:'width .05s'}}/>
      <div style={{position:'absolute',left:`calc(${pct}% - 3px)`,top:4,bottom:4,width:6,borderRadius:4,background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.5)'}}/>
    </div>;
  }

  // ---- Bottom sheet ----
  function Sheet({open, onClose, children, title}){
    if(!open) return null;
    return <div onClick={onClose} style={{position:'absolute',inset:0,zIndex:200,display:'flex',alignItems:'flex-end',
      background:'rgba(8,8,18,0.6)',backdropFilter:'blur(2px)',animation:'ktFade .2s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',background:T.card,borderRadius:'28px 28px 0 0',
        padding:'10px 20px calc(20px + env(safe-area-inset-bottom))',boxShadow:'0 -8px 32px rgba(0,0,0,0.8)',
        maxHeight:'82%',overflow:'auto',animation:'ktSlideUp .26s cubic-bezier(.2,.9,.3,1)'}}>
        <div style={{width:38,height:5,borderRadius:100,background:'rgba(255,255,255,0.2)',margin:'4px auto 14px'}}/>
        {title&&<div style={{fontWeight:900,fontSize:20,marginBottom:14}}>{title}</div>}
        {children}
      </div>
    </div>;
  }

  // ---- Status dot ----
  function StatusDot({status}){
    const c=status==='online'?T.success:status==='offline'?T.error:T.warning;
    return <span style={{width:7,height:7,borderRadius:'50%',background:c,display:'inline-block',
      boxShadow:`0 0 6px ${c}`}}/>;
  }

  // ---- Top bar with back button ----
  function TopBar({title, onBack, right, sub}){
    return <div style={{display:'flex',alignItems:'center',gap:12,padding:'2px 16px 14px'}}>
      {onBack && <button onClick={()=>{haptic();onBack();}} style={{width:38,height:38,borderRadius:'50%',flexShrink:0,
        background:T.card,border:`1px solid ${T.border}`,color:T.text,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon name="back" size={20}/></button>}
      <div style={{flex:1,minWidth:0}}>
        {sub&&<div style={{fontSize:12,color:T.muted,fontWeight:700}}>{sub}</div>}
        <div style={{fontWeight:900,fontSize:26,letterSpacing:-0.5,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.15}}>{title}</div>
      </div>
      {right}
    </div>;
  }

  window.KT_UI={T,Icon,DEVICE_ICON,haptic,pressable,TweenNumber,EmptyState,Card,Btn,SourceBadge,ConfidenceDots,Toggle,Slider,Sheet,StatusDot,TopBar};
})();
