
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const BASE_URL = "http://localhost:8000";

async function api(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || `HTTP ${res.status}`);
  }
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
  .fu { animation: fadeUp 0.4s ease both; }
  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined' !important;
    font-weight: normal; font-style: normal; font-size: 24px;
    display: inline-block; line-height: 1; text-transform: none;
    letter-spacing: normal; white-space: nowrap; direction: ltr;
  }
  .desktop-sidebar { display: none; }
  @media (min-width: 1024px) { .desktop-sidebar { display: flex; } }
  .mobile-nav { display: flex; }
  @media (min-width: 1024px) { .mobile-nav { display: none; } }
  .main-content { padding-left: 1rem; padding-right: 1rem; }
  @media (min-width: 1024px) { .main-content { margin-left: 16rem; } }
  .user-row:hover .user-row-inner { background: rgba(110,59,216,0.04) !important; }
  .profile-link:hover { text-decoration: underline; }
`;

function Avatar({ src, name, size = "md" }) {
  const sz = { xs:"1.5rem", sm:"2rem", md:"2.5rem", lg:"3rem", xl:"4rem" };
  const pal = ["#6e3bd8","#1c6b50","#77556a","#2563eb","#d97706","#b45309","#0891b2"];
  const bg = pal[(name?.charCodeAt(0) || 65) % pal.length];
  const init = name ? name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() : "?";
  const [err, setErr] = useState(false);
  const dim = sz[size] || "2.5rem";
  return (
    <div style={{ width:dim, height:dim, borderRadius:"9999px", flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"white", fontSize: size==="xs"?"0.6rem": size==="sm"?"0.7rem":"0.85rem", background:(src&&!err)?"transparent":bg, userSelect:"none" }}>
      {(src&&!err) ? <img src={src} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setErr(true)}/> : init}
    </div>
  );
}

const Spinner = () => (
  <div style={{ width:"1.5rem", height:"1.5rem", borderRadius:"9999px", border:"2px solid #cbb6ff", borderTopColor:"#6e3bd8", animation:"spin 0.8s linear infinite" }} />
);

export default function People() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [me, setMe] = useState(null);

  const handleNavigate = (page, id) => {
  if (page === "userprofile") {
    navigate(`/user/${id}`); // 👈 dynamic route
  } else {
    navigate(`/${page}`);
  }
};


  useEffect(() => {
    api("/me").then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api("/allusersprofile");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId, isFollowing, e) => {
    e.stopPropagation(); // prevent card click from firing
    try {
      if (isFollowing) {
        await fetch(`${BASE_URL}/unfollow/${userId}`, { method:"DELETE", credentials:"include" });
      } else {
        await fetch(`${BASE_URL}/following/${userId}`, { method:"POST", credentials:"include" });
      }
      setUsers(prev => prev.map(u => u.id === userId ? {...u, is_following: !isFollowing} : u));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    if (tab === "all") return matchesSearch;
    if (tab === "following") return matchesSearch && u.is_following;
    if (tab === "suggestions") return matchesSearch && !u.is_following;
    return matchesSearch;
  });

  const navItems = [
    {icon:"grid_view",label:"Feed",page:"feed"},
    {icon:"explore",label:"Search",page:"search"},
    {icon:"groups",label:"People",page:"people",active:true},
    {icon:"chat_bubble",label:"Messages",page:"messages"},
    {icon:"account_circle",label:"Profile",page:"profile"},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:PRISM, color:T.onSurface }}>
        <div style={{ position:"fixed", top:"25%", left:"-5rem", width:"20rem", height:"20rem", borderRadius:"9999px", background:"rgba(110,59,216,0.07)", filter:"blur(120px)", pointerEvents:"none", zIndex:0 }}/>

        {/* Header */}
        <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:"4.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 1.5rem", background:"rgba(247,249,251,0.82)", backdropFilter:"blur(40px)", boxShadow:"0 16px 40px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize:"1.35rem", fontWeight:800, letterSpacing:"-0.02em", color:T.onSurface }}>Somates</span>
          <button onClick={() => handleNavigate("profile")} style={{ width:"2.25rem", height:"2.25rem", borderRadius:"9999px", padding:"2px", background:T.primaryContainer, border:"none", cursor:"pointer", overflow:"hidden" }}>
            <Avatar src={me?.profilepic} name={me?.name || "Me"} size="sm" />
          </button>
        </header>

        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar" style={{ position:"fixed", left:"1rem", top:"4.5rem", width:"15rem", padding:"1.25rem", zIndex:40, flexDirection:"column", height:"calc(100vh - 5.5rem)", marginTop:"0.5rem", borderRadius:"0 2.5rem 2.5rem 0", background:T.glass, backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)" }}>
          <div style={{ marginBottom:"1.75rem", padding:"0 0.5rem" }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700, color:T.onSurface }}>Somates</h2>
          </div>
          <nav style={{ display:"flex", flexDirection:"column", gap:"0.25rem", flex:1 }}>
            {navItems.map(({icon,label,page,active})=>(
              <button key={page} onClick={() => handleNavigate(page)}
                style={{ display:"flex", alignItems:"center", gap:"0.875rem", padding:"0.75rem 0.875rem", borderRadius:"0.75rem", fontWeight:500, fontSize:"0.875rem", border:"none", cursor:"pointer", color:active?T.primary:T.onVariant, background:active?`linear-gradient(to right,rgba(110,59,216,0.09),transparent)`:"transparent", borderRight:active?`3px solid ${T.primary}`:"3px solid transparent", transition:"all 0.2s", textAlign:"left" }}>
                <span className="material-symbols-outlined" style={{ fontSize:"20px", fontVariationSettings:active?"'FILL' 1":"'FILL' 0" }}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
          <button onClick={()=>{fetch(`${BASE_URL}/logout`,{method:"POST",credentials:"include"}).catch(()=>{});handleNavigate("login");}}
            style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 0.875rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", background:"transparent", fontSize:"0.875rem", color:T.onVariant, marginTop:"0.5rem" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.onVariant;}}>
            <span className="material-symbols-outlined" style={{ fontSize:"20px" }}>logout</span>Logout
          </button>
        </aside>

        {/* Main */}
        <main className="main-content" style={{ paddingTop:"5.5rem", paddingBottom:"6rem" }}>
          <div style={{ maxWidth:"40rem", margin:"0 auto", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
            <h1 style={{ fontSize:"1.5rem", fontWeight:800, color:T.onSurface }}>People</h1>

            {/* Search bar */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", background:T.glass, backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)", borderRadius:"9999px", padding:"0.875rem 1.25rem" }}>
              <span className="material-symbols-outlined" style={{ color:T.outline, fontSize:"22px" }}>search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search people…" style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:"1rem", color:T.onSurface }}/>
              {search && <button onClick={()=>setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", color:T.outline, display:"flex", alignItems:"center" }}><span className="material-symbols-outlined" style={{ fontSize:"20px" }}>close</span></button>}
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"0.5rem", background:T.glass, backdropFilter:"blur(20px)", borderRadius:"9999px", padding:"0.3rem", border:"1px solid rgba(255,255,255,0.6)" }}>
              {[{k:"all",label:"All"},{k:"following",label:"Following"},{k:"suggestions",label:"Suggestions"}].map(({k,label})=>(
                <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"0.6rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.875rem", fontWeight:600, transition:"all 0.2s", background:tab===k?`linear-gradient(135deg,${T.primary},${T.primaryDim})`:"transparent", color:tab===k?"white":T.onVariant }}>
                  {label}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}><Spinner/></div>
            ) : filtered.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"4rem 0", color:T.onVariant }}>
                <span className="material-symbols-outlined" style={{ fontSize:"3rem", color:"rgba(110,59,216,0.2)", marginBottom:"0.75rem" }}>group</span>
                <p style={{ fontWeight:600, color:T.onSurface }}>No users found</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                {filtered.map((u, i) => (
                  <div
                    key={u.id}
                    className="fu user-row"
                    style={{ animationDelay:`${i*0.04}s` }}
                  >
                    <div
                      className="user-row-inner"
                      style={{ display:"flex", alignItems:"center", gap:"0.875rem", padding:"1rem 1.25rem", borderRadius:"1.25rem", background:T.glass, backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.6)", transition:"background 0.15s" }}
                    >
                      {/* ── Clickable left section: avatar + name ── */}
                      <button
                        onClick={() => handleNavigate("userprofile", u.id)}
                        style={{ display:"flex", alignItems:"center", gap:"0.875rem", flex:1, minWidth:0, background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:0 }}
                      >
                        <div style={{ position:"relative" }}>
                          <Avatar src={u.photo} name={u.name} size="md"/>
                          {u.is_private && (
                            <div style={{ position:"absolute", bottom:0, right:0, width:"0.875rem", height:"0.875rem", borderRadius:"9999px", background:T.primary, border:"1.5px solid white", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span className="material-symbols-outlined" style={{ fontSize:"9px", color:"white", fontVariationSettings:"'FILL' 1" }}>lock</span>
                            </div>
                          )}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p className="profile-link" style={{ fontWeight:700, color:T.onSurface, fontSize:"0.9rem" }}>{u.name}</p>
                          <p style={{ fontSize:"0.74rem", color:T.onVariant, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</p>
                        </div>
                      </button>

                      {/* ── Action buttons ── */}
                      <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNavigate("messages"); }}
                          style={{ width:"2.25rem", height:"2.25rem", borderRadius:"9999px", border:"none", cursor:"pointer", background:T.surfaceLow, display:"flex", alignItems:"center", justifyContent:"center", color:T.onVariant, transition:"all 0.2s" }}
                          onMouseEnter={e=>{e.currentTarget.style.background=T.container;}}
                          onMouseLeave={e=>{e.currentTarget.style.background=T.surfaceLow;}}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize:"17px" }}>chat_bubble</span>
                        </button>
                        <button
                          onClick={(e) => toggleFollow(u.id, u.is_following, e)}
                          style={{ padding:"0.45rem 1rem", borderRadius:"9999px", border:"none", cursor:"pointer", fontSize:"0.78rem", fontWeight:700, transition:"all 0.2s", color:u.is_following?"white":T.primary, background:u.is_following?T.primary:"rgba(110,59,216,0.09)" }}
                        >
                          {u.is_following ? "Following" : "Follow"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Mobile Nav */}
        <nav className="mobile-nav" style={{ position:"fixed", bottom:"0.75rem", left:"0.75rem", right:"0.75rem", height:"4rem", alignItems:"center", justifyContent:"space-around", zIndex:50, borderRadius:"9999px", background:"rgba(255,255,255,0.85)", backdropFilter:"blur(40px)", boxShadow:"0 8px 32px rgba(0,0,0,0.08)", border:"1px solid rgba(255,255,255,0.7)" }}>
          {navItems.map(({icon,label,page,active})=>(
            <button key={page} onClick={() => handleNavigate(page)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", border:"none", background:"transparent", cursor:"pointer", color:active?T.primary:T.onVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize:"20px", fontVariationSettings:active?"'FILL' 1":"'FILL' 0" }}>{icon}</span>
              <span style={{ fontSize:"0.58rem", fontWeight:600 }}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}