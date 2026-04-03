
import { useEffect, useState, useRef } from "react";
const BASE_URL = "http://localhost:8000";

async function api(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const T = {
  primary:"#6e3bd8", primaryDim:"#622bcb", secondary:"#1c6b50",
  surface:"#f7f9fb", surfaceLow:"#f1f4f6", container:"#eaeef1",
  outline:"#acb3b7", onSurface:"#2d3337", onVariant:"#596063",
  primaryContainer:"#cbb6ff", glass:"rgba(255,255,255,0.60)",
};

const PRISM = `radial-gradient(circle at 0% 0%,rgba(110,59,216,0.08) 0%,transparent 50%),radial-gradient(circle at 100% 100%,rgba(177,254,218,0.10) 0%,transparent 50%),#f7f9fb`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
  *,*::before,*::after{font-family:'Plus Jakarta Sans',sans-serif!important;box-sizing:border-box;margin:0;padding:0;}
  body{background:#f7f9fb!important;overflow-x:hidden;}
  ::-webkit-scrollbar{display:none;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  .fu{animation:fadeUp 0.4s ease both;}
  .material-symbols-outlined{font-family:'Material Symbols Outlined'!important;font-weight:normal;font-style:normal;font-size:24px;display:inline-block;line-height:1;text-transform:none;letter-spacing:normal;white-space:nowrap;direction:ltr;}
  
  .desktop-sidebar {
    display: none;
  }
  @media (min-width: 1024px) {
    .desktop-sidebar {
      display: flex;
    }
  }
  
  .mobile-nav {
    display: flex;
  }
  @media (min-width: 1024px) {
    .mobile-nav {
      display: none;
    }
  }
  
  .main-content {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  @media (min-width: 1024px) {
    .main-content {
      margin-left: 16rem;
    }
  }
`;

function Avatar({ src, name, size="md", isBot=false }) {
  const sz={xs:"1.5rem",sm:"2rem",md:"2.5rem",lg:"3rem",xl:"4rem"};
  const pal=["#6e3bd8","#1c6b50","#77556a","#2563eb","#d97706","#b45309","#0891b2"];
  const bg= isBot ? "linear-gradient(135deg, #6e3bd8, #b47ede)" : pal[(name?.charCodeAt(0)||65)%pal.length];
  const init=name?name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase():"?";
  const [err,setErr]=useState(false); 
  const dim=sz[size]||"2.5rem";
  return (
    <div style={{width:dim,height:dim,borderRadius:"9999px",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"white",fontSize:"0.75rem",background:(src&&!err)?"transparent":bg,userSelect:"none"}}>
      {isBot ? (
        <span className="material-symbols-outlined" style={{fontSize:size==="md"?"20px":"24px",fontVariationSettings:"'FILL' 1"}}>smart_toy</span>
      ) : (src&&!err) ? (
        <img src={src} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setErr(true)}/>
      ) : init}
    </div>
  );
}

const Spinner = () => <div style={{width:"1.5rem",height:"1.5rem",borderRadius:"9999px",border:"2px solid #cbb6ff",borderTopColor:"#6e3bd8",animation:"spin 0.8s linear infinite"}}/>;

// ── Chatbot Window ─────────────────────────────────────────────────────────
function ChatbotWindow({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await api("/chatbot/history");
        setMessages(Array.isArray(data) ? data : []);
      } catch { 
        setMessages([]); 
      } finally { 
        setLoading(false); 
      }
    };
    loadHistory();
  }, []);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior:"smooth" }); 
  }, [messages]);

  const sendMsg = async () => {
    if (!text.trim() || sending) return;
    
    const userMessage = text.trim();
    setText("");
    setSending(true);

    // Add user message immediately
    const userMsgObj = {
      id: `temp_${Date.now()}`,
      sender_id: "me",
      content: userMessage,
      created_at: new Date().toISOString(),
      is_read: true
    };
    setMessages(prev => [...prev, userMsgObj]);

    try {
      // Call chatbot API
      const response = await fetch(`${BASE_URL}/chatbot/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      // Add bot response
      const botMsgObj = {
        id: `bot_${Date.now()}`,
        sender_id: "chatbot",
        content: data.response,
        created_at: new Date().toISOString(),
        is_read: true
      };
      
      setMessages(prev => [...prev, botMsgObj]);
    } catch (error) {
      console.error("Chatbot error:", error);
      // Add error message
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        sender_id: "chatbot",
        content: "Sorry, I'm having trouble connecting right now. Please try again! 😔",
        created_at: new Date().toISOString(),
        is_read: true
      }]);
    } finally {
      setSending(false);
    }
  };

  const fmt = d => { 
    try { 
      const dt=new Date(d); 
      return dt.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}); 
    } catch { return ""; } 
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.glass,backdropFilter:"blur(40px)",borderRadius:"1.5rem",border:"1px solid rgba(255,255,255,0.6)",overflow:"hidden"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem 1.25rem",borderBottom:`1px solid ${T.surfaceLow}`,background:"rgba(255,255,255,0.8)"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:T.onVariant,display:"flex",alignItems:"center"}}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <Avatar name="SomatesBot" size="md" isBot={true}/>
        
        <div style={{flex:1}}>
          <p style={{fontWeight:700,color:T.onSurface,fontSize:"0.9rem"}}>SomatesBot </p>
          <p style={{fontSize:"0.7rem",color:T.secondary}}>Always here to chat</p>
        </div>
        <div style={{padding:"0.25rem 0.75rem",borderRadius:"9999px",background:"rgba(110,59,216,0.1)",fontSize:"0.65rem",fontWeight:600,color:T.primary}}>
          AI Assistant
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.625rem"}}>
        {loading ? (
          <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}><Spinner/></div>
        ) : messages.length===0 ? (
          <div style={{textAlign:"center",padding:"3rem 0"}}>
            <div style={{width:"4rem",height:"4rem",borderRadius:"9999px",margin:"0 auto 1rem",background:"linear-gradient(135deg, rgba(110,59,216,0.1), rgba(180,126,222,0.1))",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span className="material-symbols-outlined" style={{fontSize:"2rem",color:T.primary,fontVariationSettings:"'FILL' 1"}}>smart_toy</span>
            </div>
            <p style={{fontWeight:700,color:T.onSurface,marginBottom:"0.5rem"}}>Chat with SomatesBot</p>
            <p style={{fontSize:"0.875rem",color:T.outline}}>I'm here 24/7 to chat, help, and keep you company</p>
          </div>
        ) : (
          messages.map((msg,i) => {
            const mine = msg.sender_id === "me";
            return (
              <div key={msg.id||i} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"70%",display:"flex",flexDirection:"column",gap:"0.2rem",alignItems:mine?"flex-end":"flex-start"}}>
                  {!mine&&<span style={{fontSize:"0.65rem",color:T.onVariant,paddingLeft:"0.5rem"}}>SomatesBot </span>}
                  <div style={{padding:"0.625rem 1rem",borderRadius:mine?"1rem 1rem 0.25rem 1rem":"1rem 1rem 1rem 0.25rem",background:mine?`linear-gradient(135deg,${T.primary},${T.primaryDim})`:"rgba(241,244,246,0.9)",color:mine?"white":T.onSurface,fontSize:"0.875rem",lineHeight:1.5,wordBreak:"break-word"}}>
                    {msg.content}
                  </div>
                  <span style={{fontSize:"0.6rem",color:T.outline}}>{fmt(msg.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        {sending && (
          <div style={{display:"flex",justifyContent:"flex-start"}}>
            <div style={{maxWidth:"70%",display:"flex",flexDirection:"column",gap:"0.2rem",alignItems:"flex-start"}}>
              <span style={{fontSize:"0.65rem",color:T.onVariant,paddingLeft:"0.5rem"}}>SomatesBot </span>
              <div style={{padding:"0.625rem 1rem",borderRadius:"1rem 1rem 1rem 0.25rem",background:"rgba(241,244,246,0.9)",fontSize:"0.875rem",display:"flex",gap:"0.25rem"}}>
                <span style={{animation:"pulse 1.4s ease-in-out infinite"}}>●</span>
                <span style={{animation:"pulse 1.4s ease-in-out 0.2s infinite"}}>●</span>
                <span style={{animation:"pulse 1.4s ease-in-out 0.4s infinite"}}>●</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"0.875rem 1rem",borderTop:`1px solid ${T.surfaceLow}`,display:"flex",gap:"0.625rem",alignItems:"center",background:"rgba(255,255,255,0.8)"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",background:T.surfaceLow,borderRadius:"9999px",padding:"0.625rem 1rem",gap:"0.5rem"}}>
          <input 
            value={text} 
            onChange={e=>setText(e.target.value)} 
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()} 
            placeholder="Ask me anything…"
            disabled={sending}
            style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:"0.875rem",color:T.onSurface}}
          />
        </div>
        <button 
          onClick={sendMsg} 
          disabled={!text.trim()||sending}
          style={{width:"2.5rem",height:"2.5rem",borderRadius:"9999px",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white",background:`linear-gradient(135deg,${T.primary},${T.primaryDim})`,opacity:!text.trim()||sending?0.5:1,flexShrink:0}}>
          <span className="material-symbols-outlined" style={{fontSize:"20px"}}>send</span>
        </button>
      </div>
    </div>
  );
}

// ── Regular Chat Window ────────────────────────────────────────────────────
function ChatWindow({ user, onBack, navigate }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);

  const loadMessages = async () => {
    try {
      const data = await api(`/messages/with/${user.id}`);
      // Handle both array response and {messages:[...]} response shapes
      const msgs = Array.isArray(data) ? data
        : Array.isArray(data?.messages) ? data.messages
        : Array.isArray(data?.data) ? data.data
        : [];
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to load messages:", e);
      setMessages([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadMessages();
    try {
      const ws = new WebSocket(`ws://localhost:8000/ws`);
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === "new_message") {
            setMessages(prev => [...prev, d.message]);
          }
        } catch {}
      };
      wsRef.current = ws;
    } catch {}
    return () => wsRef.current?.close();
  }, [user.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const sendMsg = async () => {
    if (!text.trim()) return;
    setSending(true);
    const content = text; 
    setText("");
    try {
      const res = await fetch(`${BASE_URL}/messages/send?receiver_id=${user.id}&content=${encodeURIComponent(content)}`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const d = await res.json();
        setMessages(prev => [...prev, { id:d.id, sender_id:"me", content, created_at: new Date().toISOString(), is_read:false }]);
      }
    } catch { setText(content); }
    finally { setSending(false); }
  };

  const fmt = d => { 
    try { 
      const dt=new Date(d); 
      return dt.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}); 
    } catch { return ""; } 
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.glass,backdropFilter:"blur(40px)",borderRadius:"1.5rem",border:"1px solid rgba(255,255,255,0.6)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem 1.25rem",borderBottom:`1px solid ${T.surfaceLow}`,background:"rgba(255,255,255,0.8)"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:T.onVariant,display:"flex",alignItems:"center",flexShrink:0}}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button onClick={()=>navigate?.("userprofile", user.id)} style={{display:"flex",alignItems:"center",gap:"0.75rem",flex:1,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,minWidth:0}}>
          <Avatar src={user.profile_picture} name={user.name} size="md"/>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontWeight:700,color:T.onSurface,fontSize:"0.9rem"}}>{user.name}</p>
            <p style={{fontSize:"0.7rem",color:T.secondary}}>Tap to view profile</p>
          </div>
        </button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.625rem"}}>
        {loading ? <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}><Spinner/></div>
        : messages.length===0 ? <p style={{color:T.outline,textAlign:"center",padding:"3rem 0",fontSize:"0.875rem"}}>Start a conversation with {user.name}!</p>
        : messages.map((msg,i) => {
          const mine = String(msg.sender_id) !== String(user.id);
          return (
            <div key={msg.id||i} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"70%",display:"flex",flexDirection:"column",gap:"0.2rem",alignItems:mine?"flex-end":"flex-start"}}>
                {!mine&&<span style={{fontSize:"0.65rem",color:T.onVariant,paddingLeft:"0.5rem"}}>{user.name}</span>}
                <div style={{padding:"0.625rem 1rem",borderRadius:mine?"1rem 1rem 0.25rem 1rem":"1rem 1rem 1rem 0.25rem",background:mine?`linear-gradient(135deg,${T.primary},${T.primaryDim})`:"rgba(241,244,246,0.9)",color:mine?"white":T.onSurface,fontSize:"0.875rem",lineHeight:1.5,wordBreak:"break-word"}}>
                  {msg.content}
                </div>
                <span style={{fontSize:"0.6rem",color:T.outline}}>{fmt(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      <div style={{padding:"0.875rem 1rem",borderTop:`1px solid ${T.surfaceLow}`,display:"flex",gap:"0.625rem",alignItems:"center",background:"rgba(255,255,255,0.8)"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",background:T.surfaceLow,borderRadius:"9999px",padding:"0.625rem 1rem",gap:"0.5rem"}}>
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()} placeholder={`Message ${user.name}…`}
            style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:"0.875rem",color:T.onSurface}}/>
        </div>
        <button onClick={sendMsg} disabled={!text.trim()||sending}
          style={{width:"2.5rem",height:"2.5rem",borderRadius:"9999px",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white",background:`linear-gradient(135deg,${T.primary},${T.primaryDim})`,opacity:!text.trim()||sending?0.5:1,flexShrink:0}}>
          <span className="material-symbols-outlined" style={{fontSize:"20px"}}>send</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Messages Component ────────────────────────────────────────────────
export default function Messages({ navigate }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unread, setUnread] = useState(0);
  const [me, setMe] = useState(null);

useEffect(() => {
  api("/me")
    .then(data => {
      console.log("ME DATA:", data);
      setMe(data);
    })
    .catch(() => {});
}, []);

  // Special chatbot user object
  const chatbot = {
    id: "chatbot",
    name: "SomatesBot",
    email: "AI Assistant Always available to chat...",
    isBot: true
  };

  useEffect(() => {
    api("/messages/users")
      .then(d => {console.log("USERS DATA:", d.users); setUsers(d.users||[])})
      .catch(()=>setUsers([]))
      .finally(()=>setLoading(false));

    api("/messages/unread/count")
      .then(d => setUnread(d.unread_count||0))
      .catch(()=>{});
  }, []);

  const navItems = [
    {icon:"grid_view",label:"Feed",page:"feed"},
    {icon:"explore",label:"Search",page:"search"},
    {icon:"groups",label:"People",page:"people"},
    {icon:"chat_bubble",label:"Messages",page:"messages",active:true},
    {icon:"account_circle",label:"Profile",page:"profile"},
  ];

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  // Combine chatbot with users (chatbot always at top)
  const allContacts = search ? filtered : [chatbot, ...users];
  const filteredContacts = search ? [chatbot, ...filtered].filter(u => 
    u.isBot || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  ) : allContacts;

  return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:PRISM,color:T.onSurface}}>
        <div style={{position:"fixed",top:"25%",left:"-5rem",width:"20rem",height:"20rem",borderRadius:"9999px",background:"rgba(110,59,216,0.07)",filter:"blur(120px)",pointerEvents:"none",zIndex:0}}/>

        {/* Top Nav */}
        <header style={{position:"fixed",top:0,left:0,right:0,zIndex:50,height:"4.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.5rem",background:"rgba(247,249,251,0.82)",backdropFilter:"blur(40px)",boxShadow:"0 16px 40px rgba(0,0,0,0.04)"}}>
          <span style={{fontSize:"1.35rem",fontWeight:800,letterSpacing:"-0.02em",color:T.onSurface}}>Somates</span>
          <button onClick={()=>navigate?.("profile")} style={{width:"2.25rem",height:"2.25rem",borderRadius:"9999px",padding:"2px",background:T.primaryContainer,border:"none",cursor:"pointer",overflow:"hidden"}}>
            <Avatar src={me?.profilepic} name={me?.name || "Me"} size="sm" />

            
            

          </button>
        </header>

        {/* Left Sidebar */}
        <aside className="desktop-sidebar" style={{position:"fixed",left:"1rem",top:"4.5rem",width:"15rem",padding:"1.25rem",zIndex:40,flexDirection:"column",height:"calc(100vh-5.5rem)",marginTop:"0.5rem",borderRadius:"0 2.5rem 2.5rem 0",background:T.glass,backdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.6)"}}>
          <div style={{marginBottom:"1.75rem",padding:"0 0.5rem"}}>
            <h2 style={{fontSize:"1rem",fontWeight:700}}>Somates</h2>
          </div>
          <nav style={{display:"flex",flexDirection:"column",gap:"0.25rem",flex:1}}>
            {navItems.map(({icon,label,page,active})=>(
              <button key={page} onClick={()=>navigate?.(page)}
                style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.75rem 0.875rem",borderRadius:"0.75rem",fontWeight:500,fontSize:"0.875rem",border:"none",cursor:"pointer",color:active?T.primary:T.onVariant,background:active?`linear-gradient(to right,rgba(110,59,216,0.09),transparent)`:"transparent",borderRight:active?`3px solid ${T.primary}`:"3px solid transparent",transition:"all 0.2s",textAlign:"left"}}>
                <span className="material-symbols-outlined" style={{fontSize:"20px",fontVariationSettings:active?"'FILL' 1":"'FILL' 0"}}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
          <button onClick={()=>{fetch(`${BASE_URL}/logout`,{method:"POST",credentials:"include"}).catch(()=>{});navigate?.("login");}}
            style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.625rem 0.875rem",borderRadius:"0.75rem",border:"none",cursor:"pointer",background:"transparent",fontSize:"0.875rem",color:T.onVariant,marginTop:"0.5rem"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.onVariant;}}>
            <span className="material-symbols-outlined" style={{fontSize:"20px"}}>logout</span>Logout
          </button>
        </aside>

        {/* Main */}
        <main className="main-content" style={{paddingTop:"5.5rem",paddingBottom:"6rem"}}>
          <div style={{maxWidth:"60rem",margin:"0 auto",height:"calc(100vh - 11rem)",display:"flex",gap:"1rem"}}>

            {/* Left panel: contacts */}
            {/* <div style={{width:"100%",maxWidth:"22rem",flexShrink:0,display:"flex",flexDirection:"column",gap:"0.75rem",overflowY:"auto"}} className={selected ? "hidden lg:flex" : "flex"}> */}
              <div style={{width:"100%",maxWidth:"22rem",flexShrink:0,display: selected && window.innerWidth < 1024 ? "none" : "flex",flexDirection:"column",gap:"0.75rem",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.25rem"}}>
                <h1 style={{fontSize:"1.25rem",fontWeight:800,color:T.onSurface}}>Messages</h1>
                {unread>0&&<span style={{padding:"0.2rem 0.625rem",borderRadius:"9999px",background:T.primary,color:"white",fontSize:"0.7rem",fontWeight:700}}>{unread} new</span>}
              </div>

              {/* Search */}
              <div style={{display:"flex",alignItems:"center",gap:"0.625rem",background:T.surfaceLow,borderRadius:"9999px",padding:"0.625rem 1rem"}}>
                <span className="material-symbols-outlined" style={{fontSize:"18px",color:T.outline}}>search</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search people…"
                  style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:"0.875rem",color:T.onSurface}}/>
              </div>

              {/* Contacts list (Chatbot + People) */}
              <div style={{display:"flex",flexDirection:"column",gap:"0.375rem",overflowY:"auto"}}>
                {loading ? <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}><Spinner/></div>
                : filteredContacts.length===0 ? <p style={{color:T.outline,textAlign:"center",padding:"2rem",fontSize:"0.875rem"}}>No users found</p>
                : filteredContacts.map(u=>(
                  <button key={u.id} onClick={()=>setSelected(u)}
                    style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.875rem 1rem",borderRadius:"1rem",border:u.isBot?"2px solid rgba(110,59,216,0.2)":"none",cursor:"pointer",background:selected?.id===u.id?`linear-gradient(to right,rgba(110,59,216,0.09),transparent)`:u.isBot?"rgba(110,59,216,0.03)":"rgba(255,255,255,0.5)",textAlign:"left",transition:"all 0.15s",backdropFilter:"blur(20px)"}}>
                    <div style={{position:"relative"}}>
                      {/* <Avatar name={u.name} size="md" isBot={u.isBot}/> */}
                      <Avatar src={u.profile_picture} name={u.name} size="md" isBot={u.isBot}/>
                      {!u.isBot && <div style={{position:"absolute",bottom:0,right:0,width:"0.625rem",height:"0.625rem",borderRadius:"9999px",background:"#22c55e",border:"2px solid white"}}/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:700,color:T.onSurface,fontSize:"0.875rem",display:"flex",alignItems:"center",gap:"0.375rem"}}>
                        {u.name}
                        {u.isBot && <span style={{fontSize:"0.75rem"}}>🤖</span>}
                      </p>
                      <p style={{fontSize:"0.75rem",color:T.onVariant,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</p>
                    </div>
                    {selected?.id===u.id&&<span className="material-symbols-outlined" style={{fontSize:"16px",color:T.primary}}>chevron_right</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Right panel: chat */}
            {/* <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}} className={selected ? "flex" : "hidden lg:flex"}> */}
            <div 
            style={{ flex:1,minWidth:0,display: !selected && window.innerWidth < 1024 ? "none" : "flex",flexDirection:"column"}}>
              {selected ? (
                selected.isBot ? (
                  <ChatbotWindow onBack={()=>setSelected(null)}/>
                ) : (
                  <ChatWindow user={selected} onBack={()=>setSelected(null)} navigate={navigate}/>
                )
              ) : (
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.glass,backdropFilter:"blur(40px)",borderRadius:"1.5rem",border:"1px solid rgba(255,255,255,0.6)"}}>
                  <div style={{width:"5rem",height:"5rem",borderRadius:"9999px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(110,59,216,0.06)",marginBottom:"1.25rem"}}>
                    <span className="material-symbols-outlined" style={{fontSize:"2.5rem",color:"rgba(110,59,216,0.3)"}}>chat_bubble</span>
                  </div>
                  <p style={{fontWeight:700,fontSize:"1rem",color:T.onSurface,marginBottom:"0.375rem"}}>Your messages</p>
                  <p style={{fontSize:"0.875rem",color:T.onVariant}}>Select someone to start a conversation</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="mobile-nav" style={{position:"fixed",bottom:"0.75rem",left:"0.75rem",right:"0.75rem",height:"4rem",alignItems:"center",justifyContent:"space-around",zIndex:50,borderRadius:"9999px",background:"rgba(255,255,255,0.85)",backdropFilter:"blur(40px)",boxShadow:"0 8px 32px rgba(0,0,0,0.08)",border:"1px solid rgba(255,255,255,0.7)"}}>
          {navItems.map(({icon,label,page,active})=>(
            <button key={page} onClick={()=>navigate?.(page)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",border:"none",background:"transparent",cursor:"pointer",color:active?T.primary:T.onVariant}}>
              <span className="material-symbols-outlined" style={{fontSize:"20px",fontVariationSettings:active?"'FILL' 1":"'FILL' 0"}}>{icon}</span>
              <span style={{fontSize:"0.58rem",fontWeight:600}}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}