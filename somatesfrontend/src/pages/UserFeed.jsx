import { useEffect, useState, useRef, useCallback } from "react";

const BASE_URL = "http://localhost:8000";

async function api(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options, credentials: "include",
    headers: isFormData ? {} : { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `HTTP ${res.status}`); }
  return res.json();
}

const T = {
  primary:"#6e3bd8", primaryDim:"#622bcb", secondary:"#1c6b50",
  surface:"#f7f9fb", surfaceLow:"#f1f4f6", container:"#eaeef1",
  outline:"#acb3b7", onSurface:"#2d3337", onVariant:"#596063",
  primaryContainer:"#cbb6ff", glass:"rgba(255,255,255,0.70)",
};
const PRISM = `radial-gradient(circle at 0% 0%,rgba(110,59,216,0.07) 0%,transparent 45%),radial-gradient(circle at 100% 100%,rgba(177,254,218,0.08) 0%,transparent 45%),#f7f9fb`;
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
  *, *::before, *::after { font-family: 'Plus Jakarta Sans', sans-serif !important; box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f7f9fb !important; overflow-x: hidden; }
  ::-webkit-scrollbar { display: none; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes heartPop { 0%{transform:scale(0);opacity:1} 50%{transform:scale(1.4);opacity:1} 100%{transform:scale(1);opacity:0} }
  .fu { animation: fadeUp 0.4s ease both; }
  .sd { animation: slideDown 0.25s ease both; }
  .si { animation: scaleIn 0.2s ease both; }
  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined' !important;
    font-weight: normal; font-style: normal; font-size: 24px;
    display: inline-block; line-height: 1; text-transform: none;
    letter-spacing: normal; white-space: nowrap; direction: ltr;
  }
  @media (min-width: 1024px) { .lg\\:ml-60 { margin-left: 15.5rem; } .lg\\:hidden { display: none !important; } .hidden.lg\\:flex { display: flex !important; } }
  @media (max-width: 1023px) { .hidden.lg\\:flex { display: none !important; } .lg\\:hidden { display: flex !important; } }
`;

function relTime(d) {
  try {
    const raw = typeof d === "string" && !d.endsWith("Z") ? d + "Z" : d;
    const diff = Math.floor((Date.now() - new Date(raw).getTime()) / 1000);
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return new Date(raw).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
  } catch { return ""; }
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, name, size="md", onClick }) {
  const sz = { xs:"1.5rem", sm:"2rem", md:"2.5rem", lg:"3rem", xl:"4.5rem" };
  const pal = ["#6e3bd8","#1c6b50","#77556a","#2563eb","#d97706","#b45309","#0891b2"];
  const bg = pal[(name?.charCodeAt(0)||65) % pal.length];
  const init = name ? name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() : "?";
  const [err, setErr] = useState(false);
  const [key, setKey] = useState(0);
  const dim = sz[size] || "2.5rem";
  useEffect(() => { setErr(false); setKey(k=>k+1); }, [src]);
  return (
    <div onClick={onClick} style={{ width:dim, height:dim, borderRadius:"9999px", flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"white", fontSize:size==="xs"?"0.6rem":size==="sm"?"0.7rem":"0.85rem", background:(src&&!err)?"transparent":bg, userSelect:"none", cursor:onClick?"pointer":"default" }}>
      {(src&&!err) ? <img key={key} src={src} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setErr(true)}/> : init}
    </div>
  );
}

const Spinner = () => (
  <div style={{ width:"1.5rem", height:"1.5rem", borderRadius:"9999px", border:"2px solid #cbb6ff", borderTopColor:"#6e3bd8", animation:"spin 0.8s linear infinite" }} />
);

// ── Story Viewer ──────────────────────────────────────────────────────────────
function StoryViewer({ story, onClose, onNext, onPrev }) {
  const [progress, setProgress] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    setProgress(0); setImgLoaded(false);
    timer.current = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(timer.current); setTimeout(() => onNext?.(), 200); return 100; } return p + 2; });
    }, 100);
    return () => clearInterval(timer.current);
  }, [story?.story_id]);
  if (!story) return null;
  const imgUrl = story.image_url || story.image || "";
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.95)" }} onClick={onClose}>
      <div style={{ position:"relative", width:"100%", maxWidth:"22rem", height:"90vh", borderRadius:"1.5rem", overflow:"hidden", background:"#111" }} onClick={e=>e.stopPropagation()}>
        <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:20, padding:"1rem 1rem 0" }}>
          <div style={{ height:"3px", borderRadius:"9999px", background:"rgba(255,255,255,0.2)", overflow:"hidden" }}>
            <div style={{ height:"100%", background:"white", borderRadius:"9999px", width:`${progress}%`, transition:"width 0.1s linear" }} />
          </div>
        </div>
        <div style={{ position:"absolute", top:"1.5rem", left:0, right:0, zIndex:20, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
            <Avatar name={story.user?.name} src={story.user?.profile_picture} size="sm" />
            <div>
              <p style={{ color:"white", fontSize:"0.875rem", fontWeight:700, lineHeight:1.2 }}>{story.user?.name||"Unknown"}</p>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.7rem" }}>{relTime(story.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:"2rem", height:"2rem", borderRadius:"9999px", background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ color:"white", fontSize:"18px" }}>close</span>
          </button>
        </div>
        {!imgLoaded && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#1a1a2e" }}><Spinner /></div>}
        {imgUrl
          ? <img src={imgUrl} alt="" onLoad={()=>setImgLoaded(true)} onError={()=>setImgLoaded(true)} style={{ width:"100%", height:"100%", objectFit:"cover", display:imgLoaded?"block":"none" }}/>
          : <div ref={r=>{if(r)setImgLoaded(true);}} style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#1a1a2e,#16213e)", padding:"2rem" }}>
              <p style={{ color:"white", fontSize:"1.1rem", fontWeight:600, textAlign:"center", lineHeight:1.6 }}>{story.content}</p>
            </div>}
        {story.content && imgUrl && (
          <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(to top,rgba(0,0,0,0.85),transparent)", padding:"3rem 1.25rem 2rem" }}>
            <p style={{ color:"white", fontSize:"0.875rem", lineHeight:1.6 }}>{story.content}</p>
          </div>
        )}
        <div style={{ position:"absolute", inset:"0 50% 0 0", zIndex:10 }} onClick={e=>{e.stopPropagation();onPrev?.();}} />
        <div style={{ position:"absolute", inset:"0 0 0 50%", zIndex:10 }} onClick={e=>{e.stopPropagation();onNext?.();}} />
      </div>
    </div>
  );
}

// ── Notification Panel ────────────────────────────────────────────────────────
function NotificationPanel({ onClose, navigate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);
  useEffect(() => {
    api("/notifications/?page=1&limit=20").then(d=>setNotifications(d.notifications||[])).catch(()=>setNotifications([])).finally(()=>setLoading(false));
    const h = e => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const markRead = async id => {
    try { await api(`/notifications/${id}/read`, {method:"PUT"}); } catch {}
    setNotifications(p => p.map(n => n.id===id ? {...n,is_read:true} : n));
  };
  const markAll = async () => {
    await Promise.all(notifications.filter(n=>!n.is_read).map(n=>api(`/notifications/${n.id}/read`,{method:"PUT"}).catch(()=>{})));
    setNotifications(p => p.map(n => ({...n,is_read:true})));
  };
  const getStyle = msg => {
    const m = (msg||"").toLowerCase();
    if (m.includes("liked"))   return { icon:"favorite",    color:"#ef4444", bg:"rgba(239,68,68,0.09)" };
    if (m.includes("comment")) return { icon:"chat_bubble", color:T.primary, bg:"rgba(110,59,216,0.09)" };
    if (m.includes("follow"))  return { icon:"person_add",  color:T.secondary, bg:"rgba(28,107,80,0.09)" };
    return                            { icon:"notifications",color:T.primary, bg:"rgba(110,59,216,0.09)" };
  };
  const unreadCount = notifications.filter(n=>!n.is_read).length;
  return (
    <div ref={panelRef} className="sd" style={{ position:"absolute", top:"calc(100% + 0.75rem)", right:"0", width:"min(22rem,calc(100vw - 2rem))", background:"rgba(255,255,255,0.97)", backdropFilter:"blur(40px)", borderRadius:"1.25rem", border:"1px solid rgba(255,255,255,0.7)", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", maxHeight:"28rem", display:"flex", flexDirection:"column", zIndex:200 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem", borderBottom:`1px solid ${T.surfaceLow}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <span style={{ fontWeight:700, color:T.onSurface, fontSize:"0.9375rem" }}>Notifications</span>
          {unreadCount > 0 && <span style={{ padding:"0.15rem 0.5rem", borderRadius:"9999px", background:T.primary, color:"white", fontSize:"0.65rem", fontWeight:800 }}>{unreadCount}</span>}
        </div>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
          {unreadCount > 0 && <button onClick={markAll} style={{ fontSize:"0.72rem", fontWeight:600, color:T.primary, background:"none", border:"none", cursor:"pointer" }}>Mark all read</button>}
          <button onClick={onClose} style={{ width:"1.75rem", height:"1.75rem", borderRadius:"9999px", background:T.surfaceLow, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ fontSize:"14px", color:T.onVariant }}>close</span>
          </button>
        </div>
      </div>
      <div style={{ overflowY:"auto", flex:1, padding:"0.75rem" }}>
        {loading ? <div style={{ display:"flex", justifyContent:"center", padding:"2rem" }}><Spinner /></div>
        : notifications.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"2.5rem 1rem", color:T.onVariant }}>
            <span className="material-symbols-outlined" style={{ fontSize:"2.5rem", color:"rgba(110,59,216,0.2)", marginBottom:"0.75rem" }}>notifications</span>
            <p style={{ fontWeight:600, color:T.onSurface, fontSize:"0.875rem" }}>All caught up!</p>
          </div>
        ) : notifications.map(n => {
          const { icon, color, bg } = getStyle(n.message);
          return (
            <div key={n.id} onClick={()=>!n.is_read&&markRead(n.id)} style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.75rem", borderRadius:"0.875rem", background:n.is_read?"transparent":"rgba(110,59,216,0.04)", border:`1px solid ${n.is_read?"transparent":"rgba(110,59,216,0.1)"}`, cursor:n.is_read?"default":"pointer", marginBottom:"0.25rem" }}>
              <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"9999px", display:"flex", alignItems:"center", justifyContent:"center", background:bg, flexShrink:0 }}>
                <span className="material-symbols-outlined" style={{ fontSize:"16px", color, fontVariationSettings:"'FILL' 1" }}>{icon}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:"0.8125rem", color:T.onSurface, lineHeight:1.5, fontWeight:n.is_read?400:600 }}>{n.message}</p>
                <p style={{ fontSize:"0.68rem", color:T.outline, marginTop:"0.125rem" }}>{relTime(n.created_at)}</p>
              </div>
              {!n.is_read && <div style={{ width:"0.45rem", height:"0.45rem", borderRadius:"9999px", background:T.primary, flexShrink:0, marginTop:"0.35rem" }} />}
            </div>
          );
        })}
      </div>
      <div style={{ padding:"0.75rem 1.25rem", borderTop:`1px solid ${T.surfaceLow}`, flexShrink:0 }}>
        <button onClick={()=>{navigate?.("profile");onClose();}} style={{ width:"100%", padding:"0.5rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, color:T.primary, background:"rgba(110,59,216,0.06)" }}>
          View all in Profile
        </button>
      </div>
    </div>
  );
}

// ── Comment Modal ─────────────────────────────────────────────────────────────
function CommentModal({ post, myProfile, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();
  useEffect(() => {
    api(`/comment/${post.post_id}`).then(d=>setComments(Array.isArray(d)?d:[])).catch(()=>setComments([])).finally(()=>setLoading(false));
  }, [post.post_id]);
  const send = async () => {
    if (!text.trim()||sending) return; setSending(true); const t=text; setText("");
    try {
      const res = await fetch(`${BASE_URL}/comment/${post.post_id}?content=${encodeURIComponent(t)}`, {method:"POST",credentials:"include",headers:{"Content-Type":"application/json"}});
      if (res.ok) { const c=await res.json(); setComments(p=>[...p,{comment_id:c.id,content:c.content,created_at:new Date().toISOString(),user:{name:myProfile?.name||"You"}}]); setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100); }
      else setText(t);
    } catch { setText(t); } finally { setSending(false); }
  };
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(8px)" }} />
      <div className="si" style={{ position:"relative", width:"100%", maxWidth:"36rem", background:"rgba(255,255,255,0.97)", backdropFilter:"blur(40px)", borderRadius:"1.5rem 1.5rem 0 0", border:"1px solid rgba(255,255,255,0.6)", maxHeight:"75vh", display:"flex", flexDirection:"column", zIndex:1 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.25rem 1.5rem", borderBottom:`1px solid ${T.surfaceLow}` }}>
          <span style={{ fontWeight:700, color:T.onSurface }}>Comments {comments.length>0&&`(${comments.length})`}</span>
          <button onClick={onClose} style={{ width:"2rem", height:"2rem", borderRadius:"9999px", background:T.surfaceLow, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ fontSize:"16px", color:T.onVariant }}>close</span>
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
          {loading ? <div style={{ display:"flex", justifyContent:"center", padding:"2rem" }}><Spinner/></div>
          : comments.length===0 ? <p style={{ color:T.outline, fontSize:"0.875rem", textAlign:"center", padding:"2rem 0" }}>No comments yet. Be the first!</p>
          : comments.map(c => (
            <div key={c.comment_id} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start" }}>
              <Avatar src={c.user?.profile_picture} name={c.user?.name} size="sm" />
              <div style={{ flex:1, background:T.surfaceLow, borderRadius:"1rem 1rem 1rem 0.25rem", padding:"0.75rem 1rem" }}>
                <p style={{ fontSize:"0.75rem", fontWeight:700, color:T.onSurface, marginBottom:"0.25rem" }}>{c.user?.name}</p>
                <p style={{ fontSize:"0.875rem", color:T.onVariant, lineHeight:1.5 }}>{c.content}</p>
              </div>
              <span style={{ fontSize:"0.65rem", color:T.outline, alignSelf:"flex-end", paddingBottom:"0.25rem", whiteSpace:"nowrap" }}>{relTime(c.created_at)}</span>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>
        <div style={{ padding:"1rem 1.5rem", borderTop:`1px solid ${T.surfaceLow}`, display:"flex", gap:"0.75rem", alignItems:"center" }}>
          <Avatar src={myProfile?.profilepic} name={myProfile?.name||"Me"} size="sm" />
          <div style={{ flex:1, display:"flex", alignItems:"center", background:T.surfaceLow, borderRadius:"9999px", padding:"0.625rem 1rem", gap:"0.5rem" }}>
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Add a comment…" style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:"0.875rem", color:T.onSurface }} />
            <button onClick={send} disabled={!text.trim()||sending} style={{ background:"none", border:"none", cursor:"pointer", opacity:!text.trim()||sending?0.35:1 }}>
              {sending ? <Spinner/> : <span className="material-symbols-outlined" style={{ color:T.primary, fontSize:"20px" }}>send</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Story Modal ────────────────────────────────────────────────────────
function CreateStoryModal({ onClose, onCreated }) {
  const [file, setFile] = useState(null); const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState(""); const [loading, setLoading] = useState(false);
  const ref = useRef();
  const pick = e => { const f=e.target.files[0]; if(!f)return; setFile(f); setPreview(URL.createObjectURL(f)); };
  const submit = async () => {
    if (!file) return; 
    setLoading(true);
    const fd = new FormData(); fd.append("file",file); fd.append("content",caption||" ");
    try { const r=await fetch(`${BASE_URL}/stories/create`,{method:"POST",body:fd,credentials:"include"}); if(r.ok){onCreated?.();onClose();}else{const d=await r.json();alert(d.detail||"Failed");} }
    catch { alert("Network error"); } finally { setLoading(false); }
  };
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(12px)" }} />
      <div className="si" style={{ position:"relative", width:"100%", maxWidth:"22rem", background:"rgba(255,255,255,0.96)", backdropFilter:"blur(40px)", borderRadius:"1.5rem", border:"1px solid rgba(255,255,255,0.6)", zIndex:1 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.25rem 1.5rem", borderBottom:`1px solid ${T.surfaceLow}` }}>
          <span style={{ fontWeight:700, color:T.onSurface }}>New Story</span>
          <button onClick={onClose} style={{ width:"2rem", height:"2rem", borderRadius:"9999px", background:T.surfaceLow, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ fontSize:"16px", color:T.onVariant }}>close</span>
          </button>
        </div>
        <div style={{ padding:"1.25rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div onClick={()=>ref.current?.click()} style={{ width:"100%", aspectRatio:"1/1", borderRadius:"1rem", overflow:"hidden", background:T.surfaceLow, border:`2px dashed rgba(172,179,183,0.5)`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {preview ? <img src={preview} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/>
            : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem", color:T.onVariant }}>
                <span className="material-symbols-outlined" style={{ fontSize:"2.5rem", color:"rgba(110,59,216,0.4)" }}>add_photo_alternate</span>
                <span style={{ fontSize:"0.75rem", fontWeight:500 }}>Tap to add photo</span>
              </div>}
            <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={pick}/>
          </div>
          <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Add a caption…" style={{ width:"100%", borderRadius:"9999px", padding:"0.75rem 1.25rem", fontSize:"0.875rem", outline:"none", background:"rgba(241,244,246,0.6)", border:"none", color:T.onSurface }}/>
          <button onClick={submit} disabled={!file||loading} style={{ width:"100%", padding:"0.75rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.875rem", fontWeight:700, color:"white", background:`linear-gradient(135deg,${T.primary},${T.primaryDim})`, opacity:!file||loading?0.5:1 }}>
            {loading?"Sharing…":"Share Story"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Post Modal ─────────────────────────────────────────────────────────
function CreatePostModal({ myProfile, onClose, onCreated }) {
  const [content, setContent] = useState(""); const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); const [loading, setLoading] = useState(false);
  const ref = useRef();
  const pick = e => { const f=e.target.files[0]; if(!f)return; setFile(f); setPreview(URL.createObjectURL(f)); };
  const submit = async () => {
    if (!content.trim()&&!file) return; setLoading(true);
    const fd = new FormData(); fd.append("content",content||" "); if(file)fd.append("file",file);
    try { const r=await fetch(`${BASE_URL}/posts/createpost`,{method:"POST",body:fd,credentials:"include"}); if(r.ok){onCreated?.();onClose();}else{const d=await r.json();alert(d.detail||"Error");} }
    catch { alert("Network error"); } finally { setLoading(false); }
  };
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(12px)" }} />
      <div className="si" style={{ position:"relative", width:"100%", maxWidth:"32rem", background:"rgba(255,255,255,0.97)", backdropFilter:"blur(40px)", borderRadius:"1.5rem", border:"1px solid rgba(255,255,255,0.6)", zIndex:1 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.25rem 1.5rem", borderBottom:`1px solid ${T.surfaceLow}` }}>
          <span style={{ fontWeight:700, color:T.onSurface, fontSize:"1rem" }}>Create Post</span>
          <button onClick={onClose} style={{ width:"2rem", height:"2rem", borderRadius:"9999px", background:T.surfaceLow, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ fontSize:"16px", color:T.onVariant }}>close</span>
          </button>
        </div>
        <div style={{ padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start" }}>
            <Avatar src={myProfile?.profilepic} name={myProfile?.name||"Me"} size="md"/>
            <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="What's reflecting in your mind?" rows={4} style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:"0.9375rem", color:T.onSurface, resize:"none", lineHeight:1.65 }}/>
          </div>
          {preview && (
            <div style={{ position:"relative", borderRadius:"1rem", overflow:"hidden" }}>
              <img src={preview} style={{ width:"100%", maxHeight:"14rem", objectFit:"cover", display:"block" }} alt=""/>
              <button onClick={()=>{setFile(null);setPreview(null);}} style={{ position:"absolute", top:"0.5rem", right:"0.5rem", width:"1.75rem", height:"1.75rem", borderRadius:"9999px", background:"rgba(0,0,0,0.5)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span className="material-symbols-outlined" style={{ color:"white", fontSize:"16px" }}>close</span>
              </button>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:"0.5rem", borderTop:`1px solid ${T.surfaceLow}` }}>
            <button onClick={()=>ref.current?.click()} style={{ display:"flex", alignItems:"center", gap:"0.375rem", padding:"0.5rem 0.875rem", borderRadius:"9999px", border:"none", cursor:"pointer", background:"transparent", fontSize:"0.8rem", fontWeight:600, color:T.secondary }}>
              <span className="material-symbols-outlined" style={{ fontSize:"20px" }}>image</span>Photo
            </button>
            <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={pick}/>
            <button onClick={submit} disabled={(!content.trim()&&!file)||loading} style={{ padding:"0.625rem 1.5rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.875rem", fontWeight:700, color:"white", background:`linear-gradient(135deg,${T.primary},${T.primaryDim})`, opacity:(!content.trim()&&!file)||loading?0.5:1 }}>
              {loading?"Posting…":"Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Post Confirm ───────────────────────────────────────────────────────
function DeletePostModal({ postId, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const del = async () => {
    setLoading(true);
    try { await fetch(`${BASE_URL}/posts/${postId}`,{method:"DELETE",credentials:"include"}); onDeleted(postId); onClose(); }
    catch { alert("Delete failed"); } finally { setLoading(false); }
  };
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)" }} />
      <div className="si" style={{ position:"relative", width:"100%", maxWidth:"22rem", background:"rgba(255,255,255,0.97)", backdropFilter:"blur(40px)", borderRadius:"1.5rem", border:"1px solid rgba(255,255,255,0.6)", padding:"1.75rem", zIndex:1, textAlign:"center" }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:"3.5rem", height:"3.5rem", borderRadius:"9999px", background:"rgba(239,68,68,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize:"1.75rem", color:"#ef4444" }}>delete</span>
        </div>
        <h3 style={{ fontWeight:800, color:T.onSurface, marginBottom:"0.5rem" }}>Delete Post?</h3>
        <p style={{ fontSize:"0.875rem", color:T.onVariant, marginBottom:"1.5rem", lineHeight:1.6 }}>This cannot be undone. The post and all its likes and comments will be permanently removed.</p>
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <button onClick={onClose} style={{ flex:1, padding:"0.75rem", borderRadius:"9999px", border:`1.5px solid ${T.container}`, cursor:"pointer", background:"transparent", fontSize:"0.875rem", fontWeight:600, color:T.onVariant }}>Cancel</button>
          <button onClick={del} disabled={loading} style={{ flex:1, padding:"0.75rem", borderRadius:"9999px", border:"none", cursor:"pointer", background:"#ef4444", fontSize:"0.875rem", fontWeight:700, color:"white", opacity:loading?0.6:1 }}>{loading?"Deleting…":"Delete"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, myUserId, onDelete, myProfile, onNavigate }) {
  const [liked, setLiked] = useState(post.is_liked||false);
  const [likeCount, setLikeCount] = useState(post.likes||0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [liking, setLiking] = useState(false);
  const [heartShow, setHeartShow] = useState(false);
  const menuRef = useRef();
  const isMyPost = (post.user?.id && post.user.id === myUserId) || (post.user_id && post.user_id === myUserId);
  const isQuote = !post.image_url && (post.content?.length||0) > 100;
  const shapes = [{ borderRadius:"2rem" },{ borderRadius:"2rem 3rem 2rem 2rem" },{ borderRadius:"2rem 2rem 3rem 2rem" }];
  const shape = shapes[(post.post_id||0) % 3];

  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggleLike = async () => {
    if (liking) return; setLiking(true);
    const was = liked; setLiked(!was); setLikeCount(c=>was?c-1:c+1);
    if (!was) { setHeartShow(true); setTimeout(()=>setHeartShow(false),700); }
    try { await fetch(`${BASE_URL}/like/${post.post_id}`,{method:was?"DELETE":"POST",credentials:"include"}); }
    catch { setLiked(was); setLikeCount(c=>was?c+1:c-1); } finally { setLiking(false); }
  };

  return (
    <>
      <article style={{ position:"relative", overflow:"hidden", background:T.glass, backdropFilter:"blur(30px)", border:"1px solid rgba(255,255,255,0.7)", boxShadow:"0 2px 20px rgba(0,0,0,0.04)", ...shape }}>
        {isQuote && <>
          <div style={{ position:"absolute", top:"-3rem", right:"-3rem", width:"10rem", height:"10rem", borderRadius:"9999px", background:"rgba(110,59,216,0.04)", filter:"blur(50px)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:"-3rem", left:"-3rem", width:"10rem", height:"10rem", borderRadius:"9999px", background:"rgba(177,254,218,0.06)", filter:"blur(50px)", pointerEvents:"none" }}/>
        </>}
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.875rem", padding:"1rem 1.25rem 0.75rem", position:"relative", zIndex:3 }}>
          <Avatar src={post.user?.profile_picture} name={post.user?.name} size="md" onClick={post.user?.id ? ()=>onNavigate?.(post.user.id) : undefined}/>
          <button onClick={post.user?.id ? ()=>onNavigate?.(post.user.id) : undefined} style={{ flex:1, minWidth:0, background:"none", border:"none", cursor:post.user?.id?"pointer":"default", textAlign:"left", padding:0 }}>
            <p style={{ fontWeight:700, color:T.onSurface, fontSize:"0.9375rem" }}>{post.user?.name||"Unknown"}</p>
            <p style={{ fontSize:"0.72rem", color:T.onVariant }}>{relTime(post.created_at)}</p>
          </button>
          {/* 3-dot menu */}
          <div ref={menuRef} style={{ position:"relative" }}>
            <button onClick={()=>setShowMenu(s=>!s)} style={{ width:"2rem", height:"2rem", borderRadius:"9999px", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:T.onVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize:"20px" }}>more_horiz</span>
            </button>
            {showMenu && (
              <div className="sd" style={{ position:"absolute", top:"calc(100% + 0.25rem)", right:0, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(40px)", borderRadius:"1rem", border:"1px solid rgba(255,255,255,0.7)", boxShadow:"0 8px 32px rgba(0,0,0,0.1)", overflow:"hidden", minWidth:"10rem", zIndex:100 }}>
                <button onClick={()=>{navigator.clipboard?.writeText(`${location.origin}/post/${post.post_id}`).catch(()=>{});setShowMenu(false);}} style={{ width:"100%", padding:"0.75rem 1rem", border:"none", background:"none", display:"flex", alignItems:"center", gap:"0.625rem", fontSize:"0.875rem", fontWeight:500, color:T.onSurface, cursor:"pointer", textAlign:"left" }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"17px" }}>link</span>Copy link
                </button>
                {isMyPost && (
                  <button onClick={()=>{setShowMenu(false);setShowDel(true);}} style={{ width:"100%", padding:"0.75rem 1rem", border:"none", background:"none", display:"flex", alignItems:"center", gap:"0.625rem", fontSize:"0.875rem", fontWeight:600, color:"#ef4444", cursor:"pointer", textAlign:"left", borderTop:`1px solid ${T.surfaceLow}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize:"17px" }}>delete</span>Delete post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Text content (non-quote) */}
        {post.content && !post.image_url && !isQuote && (
          <div style={{ padding:"0 1.25rem 0.875rem", position:"relative", zIndex:1 }}>
            <p style={{ fontSize:"0.9375rem", color:T.onSurface, lineHeight:1.65 }}>{post.content}</p>
          </div>
        )}
        {/* Quote style */}
        {isQuote && (
          <div style={{ padding:"0.625rem 1.5rem 0.875rem", position:"relative", zIndex:1 }}>
            <blockquote style={{ fontSize:"1.05rem", fontWeight:600, color:T.onSurface, fontStyle:"italic", lineHeight:1.65, paddingLeft:"1rem", borderLeft:`3px solid rgba(110,59,216,0.3)`, margin:0 }}>
              "{post.content}"
            </blockquote>
          </div>
        )}
        {/* Image */}
        {post.image_url && (
          <div style={{ padding:"0.25rem 1rem 0.625rem", position:"relative", zIndex:1 }} onDoubleClick={toggleLike}>
            <div style={{ borderRadius:"1.25rem", overflow:"hidden", border:"1px solid rgba(0,0,0,0.06)", boxShadow:"0 4px 16px rgba(0,0,0,0.08)", background:T.surfaceLow, position:"relative" }}>
              {!imgLoaded && <div style={{ height:"14rem", display:"flex", alignItems:"center", justifyContent:"center" }}><Spinner/></div>}
              <img src={post.image_url} alt="" onLoad={()=>setImgLoaded(true)} style={{ display:imgLoaded?"block":"none", width:"100%", height:"auto", maxHeight:"28rem", objectFit:"contain", objectPosition:"center", background:"#f8f9fb" }}/>
              {/* Caption below image */}
              {post.content && imgLoaded && (
                <div style={{ padding:"0.75rem 1rem", borderTop:`1px solid ${T.surfaceLow}` }}>
                  <p style={{ fontSize:"0.875rem", color:T.onVariant, lineHeight:1.6 }}>{post.content}</p>
                </div>
              )}
              {/* Heart burst on dblclick */}
              {heartShow && (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"5rem", color:"white", fontVariationSettings:"'FILL' 1", animation:"heartPop 0.7s ease forwards", filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}>favorite</span>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Actions */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.375rem 1.5rem 1.25rem", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"1.25rem" }}>
            <button onClick={toggleLike} disabled={liking} style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:"none", border:"none", cursor:"pointer", color:liked?"#ef4444":T.onVariant, transition:"color 0.15s", padding:"0.25rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize:"21px", fontVariationSettings:liked?"'FILL' 1":"'FILL' 0", transition:"all 0.15s" }}>favorite</span>
              <span style={{ fontSize:"0.85rem", fontWeight:700 }}>{likeCount.toLocaleString()}</span>
            </button>
            <button onClick={()=>setShowComments(true)} style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:"none", border:"none", cursor:"pointer", color:T.onVariant, padding:"0.25rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize:"21px" }}>chat_bubble_outline</span>
              <span style={{ fontSize:"0.85rem", fontWeight:700 }}>{post.comments||0}</span>
            </button>
            <button onClick={()=>{try{navigator.share({url:`${location.origin}/post/${post.post_id}`});}catch{navigator.clipboard?.writeText(`${location.origin}/post/${post.post_id}`).catch(()=>{});}}} style={{ background:"none", border:"none", cursor:"pointer", color:T.onVariant, padding:"0.25rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize:"21px" }}>share</span>
            </button>
          </div>
          <button onClick={()=>setSaved(s=>!s)} style={{ background:"none", border:"none", cursor:"pointer", color:saved?T.primary:T.onVariant, transition:"color 0.15s", padding:"0.25rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize:"21px", fontVariationSettings:saved?"'FILL' 1":"'FILL' 0" }}>bookmark</span>
          </button>
        </div>
      </article>
      {showComments && <CommentModal post={post} myProfile={myProfile} onClose={()=>setShowComments(false)}/>}
      {showDel && <DeletePostModal postId={post.post_id} onClose={()=>setShowDel(false)} onDeleted={onDelete}/>}
    </>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ navigate, active="feed", myProfile, unreadCount=0 }) {
  const navItems = [
    { icon:"grid_view",      label:"Feed",     page:"feed" },
    { icon:"explore",        label:"Search",   page:"search" },
    {icon:"groups",    label:"People",        page:"people"},
    { icon:"chat_bubble",    label:"Messages", page:"messages" },
    { icon:"account_circle", label:"Profile",  page:"profile" },
  ];
  return (
    <aside style={{ position:"fixed", left:"1rem", top:"4.5rem", width:"14rem", padding:"1.25rem", zIndex:40, display:"none", flexDirection:"column", height:"calc(100vh - 5.5rem)", marginTop:"0.5rem", borderRadius:"0 2rem 2rem 0", background:T.glass, backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.7)" }} className="hidden lg:flex">
      <div style={{ marginBottom:"1.5rem", padding:"0 0.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
          {myProfile && <Avatar src={myProfile.profilepic} name={myProfile.name} size="sm"/>}
          <div>
            <h2 style={{ fontSize:"0.875rem", fontWeight:700, color:T.onSurface }}>{myProfile?.name||"Somates"}</h2>
            <p style={{ fontSize:"0.65rem", color:T.onVariant }}>{myProfile?.email||""}</p>
          </div>
        </div>
      </div>
      <nav style={{ display:"flex", flexDirection:"column", gap:"0.2rem", flex:1 }}>
        {navItems.map(({ icon, label, page }) => {
          const isActive = active === page;
          return (
            <button key={page} onClick={()=>navigate?.(page)} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.7rem 0.875rem", borderRadius:"0.75rem", fontWeight:500, fontSize:"0.875rem", border:"none", cursor:"pointer", color:isActive?T.primary:T.onVariant, background:isActive?`linear-gradient(to right,rgba(110,59,216,0.09),transparent)`:"transparent", borderRight:isActive?`3px solid ${T.primary}`:"3px solid transparent", transition:"all 0.2s", textAlign:"left", position:"relative" }}>
              <span className="material-symbols-outlined" style={{ fontSize:"20px", fontVariationSettings:isActive?"'FILL' 1":"'FILL' 0" }}>{icon}</span>
              {label}
              {page==="profile" && unreadCount > 0 && (
                <span style={{ marginLeft:"auto", minWidth:"1.25rem", height:"1.25rem", borderRadius:"9999px", background:"#ef4444", color:"white", fontSize:"0.6rem", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{unreadCount>9?"9+":unreadCount}</span>
              )}
            </button>
          );
        })}
      </nav>
      <button onClick={()=>{fetch(`${BASE_URL}/logout`,{method:"POST",credentials:"include"}).catch(()=>{});navigate?.("login");}} style={{ marginTop:"0.5rem", display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 0.875rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", background:"transparent", fontSize:"0.875rem", fontWeight:500, color:T.onVariant }} onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.onVariant;}}>
        <span className="material-symbols-outlined" style={{ fontSize:"20px" }}>logout</span>Logout
      </button>
    </aside>
  );
}

// ── People / Followers Page ───────────────────────────────────────────────────
function PeoplePage({ navigate }) {
  const [users, setUsers] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    Promise.allSettled([api("/allusersprofile"),api("/followers"),api("/following"),api("/me"),api("/notifications/unread/count")])
    .then(([all,frs,fing,me,uc]) => {
      const allU = all.status==="fulfilled"?(all.value||[]):[];
      const frL  = frs.status==="fulfilled"?(frs.value||[]):[];
      const fiL  = fing.status==="fulfilled"?(fing.value||[]):[];
      if (me.status==="fulfilled") setMyProfile(me.value);
      if (uc.status==="fulfilled") setUnreadCount(uc.value?.unread_count||0);
      const fiIds = new Set(fiL.map(u=>u.id)); const frIds = new Set(frL.map(u=>u.id));
      setUsers(allU.map(u=>({...u, is_following:fiIds.has(u.id), is_follower:frIds.has(u.id)})));
    }).finally(()=>setLoading(false));
  }, []);

  const toggleFollow = async (uid, isF) => {
    setUsers(p=>p.map(u=>u.id===uid?{...u,is_following:!isF}:u));
    try { if(isF)await fetch(`${BASE_URL}/unfollow/${uid}`,{method:"DELETE",credentials:"include"}); else await fetch(`${BASE_URL}/following/${uid}`,{method:"POST",credentials:"include"}); }
    catch { setUsers(p=>p.map(u=>u.id===uid?{...u,is_following:isF}:u)); }
  };

  const filtered = users.filter(u => {
    const ms = !search.trim() || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    if (tab==="followers") return ms && u.is_follower;
    if (tab==="following") return ms && u.is_following;
    return ms;
  });

  const navItems = [
    {icon:"grid_view",label:"Feed",page:"feed"},{icon:"explore",label:"Search",page:"search"},
    {icon:"groups",label:"People",page:"followers",active:true},{icon:"chat_bubble",label:"Messages",page:"messages"},
    {icon:"account_circle",label:"Profile",page:"profile"},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:PRISM, color:T.onSurface }}>
        {/* Top Nav */}
        <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:"4.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem", background:"rgba(247,249,251,0.85)", backdropFilter:"blur(40px)", boxShadow:"0 1px 0 rgba(0,0,0,0.06)" }}>
          <span style={{ fontSize:"1.35rem", fontWeight:800, letterSpacing:"-0.02em", color:T.onSurface }}>Somates</span>
          <Avatar src={myProfile?.profilepic} name={myProfile?.name||"Me"} size="sm" onClick={()=>navigate?.("profile")}/>
        </header>
        {/* Sidebar */}
        <Sidebar navigate={navigate} active="followers" myProfile={myProfile} unreadCount={unreadCount}/>
        <main style={{ paddingTop:"5.5rem", paddingBottom:"6rem", paddingLeft:"1rem", paddingRight:"1rem" }} className="lg:ml-60">
          <div style={{ maxWidth:"38rem", margin:"0 auto", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
            <h1 style={{ fontSize:"1.5rem", fontWeight:800, color:T.onSurface }}>People</h1>
            {/* Search */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", background:T.glass, backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)", borderRadius:"9999px", padding:"0.75rem 1.25rem" }}>
              <span className="material-symbols-outlined" style={{ color:T.outline, fontSize:"20px" }}>search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search people…" style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:"0.9rem", color:T.onSurface }}/>
              {search && <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:T.outline, display:"flex" }}><span className="material-symbols-outlined" style={{ fontSize:"18px" }}>close</span></button>}
            </div>
            {/* Tabs */}
            <div style={{ display:"flex", gap:"0.375rem", background:T.glass, backdropFilter:"blur(20px)", borderRadius:"9999px", padding:"0.3rem", border:"1px solid rgba(255,255,255,0.6)" }}>
              {[{k:"all",label:"All Users"},{k:"followers",label:"Followers"},{k:"following",label:"Following"}].map(({k,label})=>(
                <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"0.55rem 0.5rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, transition:"all 0.2s", background:tab===k?`linear-gradient(135deg,${T.primary},${T.primaryDim})`:"transparent", color:tab===k?"white":T.onVariant }}>
                  {label}
                </button>
              ))}
            </div>
            {/* Cards */}
            {loading ? <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}><Spinner/></div>
            : filtered.length===0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"4rem 0", color:T.onVariant }}>
                <span className="material-symbols-outlined" style={{ fontSize:"3rem", color:"rgba(110,59,216,0.2)", marginBottom:"0.75rem" }}>group</span>
                <p style={{ fontWeight:600, color:T.onSurface }}>No users found</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                {filtered.map((u,i) => (
                  <div key={u.id} className="fu" style={{ animationDelay:`${i*0.04}s`, display:"flex", alignItems:"center", gap:"0.875rem", padding:"1rem 1.25rem", borderRadius:"1.25rem", background:T.glass, backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)" }}>
                    <Avatar  name={u.name}  size="md"/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, color:T.onSurface, fontSize:"0.9rem" }}>{u.name}</p>
                      <p style={{ fontSize:"0.74rem", color:T.onVariant, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</p>
                      {u.is_follower && !u.is_following && <span style={{ fontSize:"0.65rem", fontWeight:600, color:T.secondary, background:"rgba(28,107,80,0.08)", padding:"0.1rem 0.4rem", borderRadius:"9999px" }}>Follows you</span>}
                    </div>
                    <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
                      <button onClick={()=>navigate?.("messages")} style={{ width:"2.25rem", height:"2.25rem", borderRadius:"9999px", border:"none", cursor:"pointer", background:T.surfaceLow, display:"flex", alignItems:"center", justifyContent:"center", color:T.onVariant }}>
                        <span className="material-symbols-outlined" style={{ fontSize:"17px" }}>chat_bubble</span>
                      </button>
                      <button onClick={()=>toggleFollow(u.id,u.is_following)} style={{ padding:"0.45rem 1rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.78rem", fontWeight:700, transition:"all 0.2s", color:u.is_following?"white":T.primary, background:u.is_following?T.primary:"rgba(110,59,216,0.09)" }}>
                        {u.is_following?"Following":"Follow"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        {/* Mobile bottom nav */}
        <nav style={{ position:"fixed", bottom:"0.75rem", left:"0.75rem", right:"0.75rem", height:"4rem", display:"flex", alignItems:"center", justifyContent:"space-around", zIndex:50, borderRadius:"9999px", background:"rgba(255,255,255,0.85)", backdropFilter:"blur(40px)", boxShadow:"0 8px 32px rgba(0,0,0,0.08)", border:"1px solid rgba(255,255,255,0.7)" }} className="lg:hidden">
          {navItems.map(({icon,label,page,active})=>(
            <button key={page} onClick={()=>navigate?.(page)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", border:"none", background:"transparent", cursor:"pointer", color:active?T.primary:T.onVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize:"20px", fontVariationSettings:active?"'FILL' 1":"'FILL' 0" }}>{icon}</span>
              <span style={{ fontSize:"0.58rem", fontWeight:600 }}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

// ── Main UserFeed ─────────────────────────────────────────────────────────────
export default function UserFeed({ navigate }) {
  const [activePage, setActivePage] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storyIdx, setStoryIdx] = useState(null);
  const [seenStories, setSeenStories] = useState(new Set());
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMe     = useCallback(async()=>{ try{ const d=await api("/me"); setMyProfile(d); }catch{} },[]);
  const loadUnread = useCallback(async()=>{ try{ const d=await api("/notifications/unread/count"); setUnreadCount(d.unread_count||0); }catch{} },[]);
  const loadFeed   = useCallback(async(p=1,append=false)=>{
    if(p===1)setLoading(true); else setLoadingMore(true);
    try{ const d=await api(`/posts/feed?page=${p}&limit=10`); const np=d.posts||[]; setPosts(prev=>append?[...prev,...np]:np); setHasMore(np.length===10); setPage(p); }
    catch(e){ if(e.message?.includes("authenticated")||e.message?.includes("logged"))navigate?.("login"); }
    finally{ setLoading(false); setLoadingMore(false); }
  },[navigate]);
  const loadStories = useCallback(async()=>{ 
  try{ 
    const d = await api("/stories/feed"); 
    console.log("Story API response:", d); // ADD THIS
    setStories([...(d.my_stories||[]),...(d.following_stories||[])]); 
  } catch(e){ 
    console.error("Story error:", e); // ADD THIS
  } 
},[]);
  useEffect(()=>{ loadMe(); loadFeed(1); loadStories(); loadUnread(); const t=setInterval(loadUnread,30000); return()=>clearInterval(t); },[]);

  const openStory = idx => { setStoryIdx(idx); setSeenStories(s=>new Set([...s,stories[idx]?.story_id])); };
  const nextStory = () => { if(storyIdx<stories.length-1)openStory(storyIdx+1); else setStoryIdx(null); };
  const prevStory = () => { if(storyIdx>0)setStoryIdx(storyIdx-1); };
  const handleDeletePost = id => setPosts(p=>p.filter(x=>x.post_id!==id));

  const nav = pg => { if(pg==="followers"){ setActivePage("followers"); return; } navigate?.(pg); };

  if (activePage==="followers") return <PeoplePage navigate={pg=>{ if(pg!=="followers"){ setActivePage("feed"); navigate?.(pg); } }}/>;

  const mobileNav = [
    {icon:"grid_view",label:"Feed",page:"feed",active:true},
    {icon:"explore",label:"Search",page:"search"},
    {icon:"groups",label:"People",page:"followers"},
    {icon:"chat_bubble",label:"Messages",page:"messages"},
    {icon:"account_circle",label:"Profile",page:"profile"},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:PRISM, color:T.onSurface }}>

        {/* Top Header */}
        <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:"4.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem", background:"rgba(247,249,251,0.85)", backdropFilter:"blur(40px)", boxShadow:"0 1px 0 rgba(0,0,0,0.06)" }}>
          <span style={{ fontSize:"1.35rem", fontWeight:800, letterSpacing:"-0.02em", color:T.onSurface }}>Somates</span>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <button onClick={()=>setShowCreatePost(true)} style={{ display:"flex", alignItems:"center", gap:"0.375rem", padding:"0.5rem 1rem", borderRadius:"9999px", border:"none", cursor:"pointer", background:`linear-gradient(135deg,${T.primary},${T.primaryDim})`, color:"white", fontSize:"0.8rem", fontWeight:700, boxShadow:"0 4px 12px rgba(110,59,216,0.3)" }}>
              <span className="material-symbols-outlined" style={{ fontSize:"18px" }}>add</span>
              <span>Post</span>
            </button>
            {/* Notification bell */}
            <div style={{ position:"relative" }}>
              <button onClick={()=>setShowNotifPanel(s=>!s)} style={{ position:"relative", width:"2.25rem", height:"2.25rem", borderRadius:"9999px", border:"none", cursor:"pointer", background:showNotifPanel?"rgba(110,59,216,0.1)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", color:T.onVariant }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings:unreadCount>0?"'FILL' 1":"'FILL' 0", color:unreadCount>0?T.primary:T.onVariant }}>notifications</span>
                {unreadCount>0 && <div style={{ position:"absolute", top:"0.15rem", right:"0.15rem", minWidth:"0.9rem", height:"0.9rem", borderRadius:"9999px", background:"#ef4444", border:"2px solid #f7f9fb", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:"0.5rem", fontWeight:800, color:"white", lineHeight:1 }}>{unreadCount>9?"9+":unreadCount}</span></div>}
              </button>
              {showNotifPanel && <NotificationPanel onClose={()=>{setShowNotifPanel(false);loadUnread();}} navigate={nav}/>}
            </div>
            <Avatar src={myProfile?.profilepic} name={myProfile?.name||"Me"} size="sm" onClick={()=>nav("profile")}/>
          </div>
        </header>

        {/* Sidebar */}
        <Sidebar navigate={nav} active="feed" myProfile={myProfile} unreadCount={unreadCount}/>

        {/* Main */}
        <main style={{ paddingTop:"5.5rem", paddingBottom:"6rem", paddingLeft:"1rem", paddingRight:"1rem" }} className="lg:ml-60">
          <div style={{ maxWidth:"36rem", margin:"0 auto" }}>

            {/* Stories Row */}
            <section style={{ marginBottom:"1.5rem", overflowX:"auto", paddingBottom:"0.375rem" }}>
              <div style={{ display:"flex", gap:"0.875rem", alignItems:"flex-start", minWidth:"max-content" }}>
                {/* Add Story */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.4rem", flexShrink:0, cursor:"pointer" }} onClick={()=>setShowCreateStory(true)}>
                  <div style={{ width:"3.75rem", height:"3.75rem", borderRadius:"9999px", display:"flex", alignItems:"center", justifyContent:"center", background:"white", border:`2px dashed ${T.outline}`, position:"relative" }}>
                    {myProfile?.profilepic && <div style={{ position:"absolute", inset:0, borderRadius:"9999px", overflow:"hidden", opacity:0.3 }}><img src={myProfile.profilepic} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/></div>}
                    <span className="material-symbols-outlined" style={{ fontSize:"20px", color:T.primary, position:"relative", zIndex:1 }}>add</span>
                  </div>
                  <span style={{ fontSize:"0.6rem", fontWeight:600, color:T.onVariant }}>Your story</span>
                </div>
                
                {stories.map((s,idx)=>(
                <div key={s.story_id||idx} 
                 style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.4rem", flexShrink:0, cursor:"pointer", opacity:seenStories.has(s.story_id)?0.5:1, transition:"opacity 0.2s" }} 
                onClick={()=>openStory(idx)}>
                <div style={{ width:"3.75rem", height:"3.75rem", borderRadius:"9999px", padding:"2.5px", background:seenStories.has(s.story_id)?"#dde3e7":`linear-gradient(135deg,${T.primary},#b1feda)` }}>
                  <div style={{ width:"100%", height:"100%", borderRadius:"9999px", border:`2px solid ${T.surface}`, background:"white", overflow:"hidden" }}>
                {s.image_url ? <img src={s.image_url} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"9999px" }} alt="" onError={e=>{e.target.style.display="none";}}/>
        : <Avatar name={s.user?.name} size="lg"/>}
      </div>
    </div>
    <span style={{ fontSize:"0.6rem", fontWeight:500, color:T.onSurface, maxWidth:"3.75rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"center" }}>
      {s.user?.name?.split(" ")[0]||"User"}
    </span>
  </div>
))}
              </div>
            </section>

            {/* Feed */}
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              {loading ? (
                [...Array(3)].map((_,i)=>(
                  <div key={i} className="fu" style={{ borderRadius:"2rem", padding:"1.5rem", background:T.glass, backdropFilter:"blur(30px)", border:"1px solid rgba(255,255,255,0.7)", animationDelay:`${i*0.1}s` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.875rem", marginBottom:"1rem" }}>
                      <div style={{ width:"2.5rem", height:"2.5rem", borderRadius:"9999px", background:T.container, animation:"pulse 1.5s ease infinite" }}/>
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                        <div style={{ height:"0.75rem", background:T.container, borderRadius:"9999px", width:"7rem", animation:"pulse 1.5s ease infinite" }}/>
                        <div style={{ height:"0.6rem", background:T.surfaceLow, borderRadius:"9999px", width:"5rem", animation:"pulse 1.5s ease infinite" }}/>
                      </div>
                    </div>
                    <div style={{ height:"13rem", background:T.surfaceLow, borderRadius:"1.25rem", animation:"pulse 1.5s ease infinite" }}/>
                  </div>
                ))
              ) : posts.length > 0 ? (
                <>
                  {posts.map((post,i)=>(
                    <div key={post.post_id} className="fu" style={{ animationDelay:`${i*0.06}s` }}>
                      <PostCard post={post} myUserId={myProfile?.id} myProfile={myProfile} onDelete={handleDeletePost} onNavigate={id=>navigate?.("userprofile", id)}/>
                    </div>
                  ))}
                  {hasMore && (
                    <div style={{ display:"flex", justifyContent:"center", paddingTop:"0.5rem" }}>
                      <button onClick={()=>loadFeed(page+1,true)} disabled={loadingMore} style={{ padding:"0.75rem 2rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.875rem", fontWeight:600, color:T.primary, background:"rgba(110,59,216,0.08)" }}>
                        {loadingMore?"Loading…":"Load more"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"5rem 0", color:T.onVariant }}>
                  <div style={{ width:"4.5rem", height:"4.5rem", borderRadius:"9999px", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(110,59,216,0.06)", marginBottom:"1rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize:"2.25rem", color:"rgba(110,59,216,0.3)" }}>auto_awesome</span>
                  </div>
                  <p style={{ fontWeight:700, fontSize:"1rem", color:T.onSurface, marginBottom:"0.25rem" }}>Your feed is empty</p>
                  <p style={{ fontSize:"0.875rem" }}>Follow people or create your first post</p>
                  <button onClick={()=>setShowCreatePost(true)} style={{ marginTop:"1.25rem", padding:"0.75rem 1.75rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.875rem", fontWeight:700, color:"white", background:`linear-gradient(135deg,${T.primary},${T.primaryDim})` }}>Create your first post</button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* FAB mobile */}
        <button onClick={()=>setShowCreatePost(true)} style={{ position:"fixed", bottom:"5.5rem", right:"1.25rem", width:"3.25rem", height:"3.25rem", borderRadius:"9999px", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white", background:`linear-gradient(135deg,${T.primary},${T.primaryDim})`, boxShadow:"0 8px 24px rgba(110,59,216,0.4)", zIndex:40 }} className="lg:hidden">
          <span className="material-symbols-outlined">add</span>
        </button>
        {showCreateStory && <CreateStoryModal onClose={()=>setShowCreateStory(false)} onCreated={loadStories}/>}
        {/* Mobile bottom nav */}
        <nav style={{ position:"fixed", bottom:"0.75rem", left:"0.75rem", right:"0.75rem", height:"4rem", display:"flex", alignItems:"center", justifyContent:"space-around", zIndex:50, borderRadius:"9999px", background:"rgba(255,255,255,0.85)", backdropFilter:"blur(40px)", boxShadow:"0 8px 32px rgba(0,0,0,0.08)", border:"1px solid rgba(255,255,255,0.7)" }} className="lg:hidden">
          {mobileNav.map(({icon,label,page,active})=>(
            <button key={page} onClick={()=>nav(page)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", border:"none", background:"transparent", cursor:"pointer", color:active?T.primary:T.onVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize:"20px", fontVariationSettings:active?"'FILL' 1":"'FILL' 0" }}>{icon}</span>
              <span style={{ fontSize:"0.58rem", fontWeight:600 }}>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {storyIdx!==null && <StoryViewer story={stories[storyIdx]} onClose={()=>setStoryIdx(null)} onNext={nextStory} onPrev={prevStory}/>}
      {showCreatePost && <CreatePostModal myProfile={myProfile} onClose={()=>setShowCreatePost(false)} onCreated={()=>loadFeed(1)}/>}
      {showCreateStory && <CreateStoryModal onClose={()=>setShowCreateStory(false)} onCreated={loadStories}/>}
    </>
  );
}