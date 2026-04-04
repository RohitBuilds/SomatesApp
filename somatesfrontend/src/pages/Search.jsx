import { useEffect, useState, useCallback, useRef } from "react";


const BASE_URL = "https://somatesappbackend.onrender.com";
async function api(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options, credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${res.status}`); }
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
  .fu{animation:fadeUp 0.4s ease both;}
  .material-symbols-outlined{font-family:'Material Symbols Outlined'!important;font-weight:normal;font-style:normal;font-size:24px;display:inline-block;line-height:1;text-transform:none;letter-spacing:normal;white-space:nowrap;direction:ltr;}
  @media(min-width:1024px){.lg\\:ml-60{margin-left:15.5rem;}.lg\\:hidden{display:none!important}.hidden.lg\\:flex{display:flex!important}}
  @media(max-width:1023px){.hidden.lg\\:flex{display:none!important}.lg\\:hidden{display:flex!important}}
`;

function Avatar({ src, name, size="md" }) {
  const sz={xs:"1.5rem",sm:"2rem",md:"2.5rem",lg:"3rem",xl:"4rem"};
  const pal=["#6e3bd8","#1c6b50","#77556a","#2563eb","#d97706","#b45309","#0891b2"];
  const bg=pal[(name?.charCodeAt(0)||65)%pal.length];
  const init=name?name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase():"?";
  const [err,setErr]=useState(false); const dim=sz[size]||"2.5rem";
  return (
    <div style={{width:dim,height:dim,borderRadius:"9999px",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"white",fontSize:"0.8rem",background:(src&&!err)?"transparent":bg,userSelect:"none"}}>
      {(src&&!err)?<img src={src} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setErr(true)}/>:init}
    </div>
  );
}
const Spinner = () => <div style={{width:"1.5rem",height:"1.5rem",borderRadius:"9999px",border:"2px solid #cbb6ff",borderTopColor:"#6e3bd8",animation:"spin 0.8s linear infinite"}}/>;

function UserCard({ user, onMessage, onProfile }) {
  const [following, setFollowing] = useState(user.is_following||false);
  const [loading, setLoading] = useState(false);
  const toggle = async () => {
    setLoading(true);
    try {
      if (following) { await fetch(`${BASE_URL}/unfollow/${user.id}`,{method:"DELETE",credentials:"include"}); setFollowing(false); }
      else           { await fetch(`${BASE_URL}/following/${user.id}`,{method:"POST",credentials:"include"}); setFollowing(true); }
    } catch {}
    finally { setLoading(false); }
  };
  return (
    <div className="fu" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.25rem",borderRadius:"1.25rem",background:T.glass,backdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.6)"}}>
      <button onClick={()=>onProfile?.(user)} style={{display:"flex",alignItems:"center",gap:"0.875rem",flex:1,minWidth:0,background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0}}>
        <Avatar src={user.photo} name={user.name} size="md"/>
        <div style={{minWidth:0}}>
          <p style={{fontWeight:700,color:T.onSurface,fontSize:"0.9rem"}}>{user.name}</p>
          <p style={{fontSize:"0.75rem",color:T.onVariant,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</p>
        </div>
      </button>
      <div style={{display:"flex",gap:"0.5rem",flexShrink:0}}>
        <button onClick={()=>onMessage(user)} style={{width:"2.25rem",height:"2.25rem",borderRadius:"9999px",border:"none",cursor:"pointer",background:T.surfaceLow,display:"flex",alignItems:"center",justifyContent:"center",color:T.onVariant}} onMouseEnter={e=>{e.currentTarget.style.background=T.container;}} onMouseLeave={e=>{e.currentTarget.style.background=T.surfaceLow;}}>
          <span className="material-symbols-outlined" style={{fontSize:"18px"}}>chat_bubble</span>
        </button>
        <button onClick={toggle} disabled={loading} style={{padding:"0.4rem 1rem",borderRadius:"9999px",border:"none",cursor:"pointer",fontSize:"0.8rem",fontWeight:700,transition:"all 0.2s",color:following?"white":T.primary,background:following?T.primary:"rgba(110,59,216,0.09)",opacity:loading?0.5:1}}>
          {loading?"…":following?"Following":"Follow"}
        </button>
      </div>
    </div>
  );
}

function PostResultCard({ post }) {
  const [imgLoaded,setImgLoaded]=useState(false);
  return (
    <div className="fu" style={{borderRadius:"1.25rem",overflow:"hidden",background:T.glass,backdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.6)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.875rem 1rem"}}>
        <Avatar  name={post.user?.name} size="sm"/>
        <div>
          <p style={{fontWeight:700,color:T.onSurface,fontSize:"0.8125rem"}}>{post.user?.name}</p>
          <p style={{fontSize:"0.7rem",color:T.onVariant}}>{new Date(post.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</p>
        </div>
      </div>
      {post.image_url && (
        <div style={{padding:"0 0.875rem"}}>
          {!imgLoaded&&<div style={{height:"10rem",display:"flex",alignItems:"center",justifyContent:"center",background:T.surfaceLow,borderRadius:"0.875rem"}}><Spinner/></div>}
          <img src={post.image_url} alt="" onLoad={()=>setImgLoaded(true)} style={{display:imgLoaded?"block":"none",width:"100%",height:"auto",maxHeight:"16rem",objectFit:"contain",borderRadius:"0.875rem",background:"#f8f8fb"}}/>
        </div>
      )}
      {post.content && <div style={{padding:"0.75rem 1rem"}}><p style={{fontSize:"0.875rem",color:T.onVariant,lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>{post.content}</p></div>}
    </div>
  );
}

export default function Search({ navigate }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("people");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const [me, setMe] = useState(null);

useEffect(() => {
  api("/me")
    .then(data => {
      console.log("ME DATA:", data);
      setMe(data);
    })
    .catch(() => {});
}, []);


  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setUsers([]); setPosts([]); return; }
    setLoading(true);
    try {
      if (tab==="people") { const d=await api(`/search/users?query=${encodeURIComponent(q)}&page=1&limit=20`); setUsers(d.users||[]); }
      else                { const d=await api(`/search/posts?query=${encodeURIComponent(q)}&page=1&limit=20`); setPosts(d.posts||[]); }
    } catch { setUsers([]); setPosts([]); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, tab, doSearch]);

  const navItems = [
    {icon:"grid_view",label:"Feed",page:"feed"},
    {icon:"explore",label:"Search",page:"search",active:true},
    {icon:"groups",label:"People",page:"people"},
    {icon:"chat_bubble",label:"Messages",page:"messages"},
    {icon:"account_circle",label:"Profile",page:"profile"},
  ];

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
        <aside style={{position:"fixed",left:"1rem",top:"4.5rem",width:"15rem",padding:"1.25rem",zIndex:40,display:"flex",flexDirection:"column",height:"calc(100vh - 5.5rem)",marginTop:"0.5rem",borderRadius:"0 2.5rem 2.5rem 0",background:T.glass,backdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.6)"}} className="hidden lg:flex">
          <div style={{marginBottom:"1.75rem",padding:"0 0.5rem"}}>
            <h2 style={{fontSize:"1rem",fontWeight:700,color:T.onSurface}}>Somates</h2>
          </div>
          <nav style={{display:"flex",flexDirection:"column",gap:"0.25rem",flex:1}}>
            {navItems.map(({icon,label,page,active})=>(
              <button key={page} onClick={()=>navigate?.(page)} style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.75rem 0.875rem",borderRadius:"0.75rem",fontWeight:500,fontSize:"0.875rem",border:"none",cursor:"pointer",color:active?T.primary:T.onVariant,background:active?`linear-gradient(to right,rgba(110,59,216,0.09),transparent)`:"transparent",borderRight:active?`3px solid ${T.primary}`:"3px solid transparent",transition:"all 0.2s",textAlign:"left"}}>
                <span className="material-symbols-outlined" style={{fontSize:"20px",fontVariationSettings:active?"'FILL' 1":"'FILL' 0"}}>{icon}</span>{label}
              </button>
            ))}
          </nav>
          <button onClick={()=>{fetch(`${BASE_URL}/logout`,{method:"POST",credentials:"include"}).catch(()=>{});navigate?.("login");}} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.625rem 0.875rem",borderRadius:"0.75rem",border:"none",cursor:"pointer",background:"transparent",fontSize:"0.875rem",color:T.onVariant,marginTop:"0.5rem"}} onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.onVariant;}}>
            <span className="material-symbols-outlined" style={{fontSize:"20px"}}>logout</span>Logout
          </button>
        </aside>

        {/* Main */}
        <main style={{paddingTop:"5.5rem",paddingBottom:"6rem",paddingLeft:"1rem",paddingRight:"1rem"}} className="lg:ml-60">
          <div style={{maxWidth:"40rem",margin:"0 auto",display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            <h1 style={{fontSize:"1.5rem",fontWeight:800,color:T.onSurface}}>Search</h1>

            {/* Search Input */}
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",background:T.glass,backdropFilter:"blur(40px)",border:"1px solid rgba(255,255,255,0.6)",borderRadius:"9999px",padding:"0.875rem 1.25rem",boxShadow:"0 8px 24px rgba(0,0,0,0.04)"}}>
              <span className="material-symbols-outlined" style={{color:T.outline,fontSize:"22px"}}>search</span>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search people, posts…" autoFocus style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:"1rem",color:T.onSurface}}/>
              {query && <button onClick={()=>setQuery("")} style={{background:"none",border:"none",cursor:"pointer",color:T.outline,display:"flex",alignItems:"center"}}><span className="material-symbols-outlined" style={{fontSize:"20px"}}>close</span></button>}
            </div>

            {/* Tab toggle */}
            <div style={{display:"flex",gap:"0.5rem",background:T.glass,backdropFilter:"blur(20px)",borderRadius:"9999px",padding:"0.3rem",border:"1px solid rgba(255,255,255,0.6)"}}>
              {[{k:"people",icon:"person",label:"People"},{k:"posts",icon:"article",label:"Posts"}].map(({k,icon,label})=>(
                <button key={k} onClick={()=>setTab(k)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",padding:"0.6rem",borderRadius:"9999px",border:"none",cursor:"pointer",fontSize:"0.875rem",fontWeight:600,transition:"all 0.2s",background:tab===k?`linear-gradient(135deg,${T.primary},${T.primaryDim})`:"transparent",color:tab===k?"white":T.onVariant}}>
                  <span className="material-symbols-outlined" style={{fontSize:"18px"}}>{icon}</span>{label}
                </button>
              ))}
            </div>

            {/* Results */}
            {loading ? <div style={{display:"flex",justifyContent:"center",padding:"3rem"}}><Spinner/></div>
            : !query.trim() ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"4rem 0",color:T.onVariant}}>
                <span className="material-symbols-outlined" style={{fontSize:"3rem",color:"rgba(110,59,216,0.25)",marginBottom:"1rem"}}>search</span>
                <p style={{fontWeight:600,color:T.onSurface,marginBottom:"0.25rem"}}>Find people & posts</p>
                <p style={{fontSize:"0.875rem"}}>Type to search across Somates</p>
              </div>
            ) : tab==="people" ? (
              users.length===0 ? (
                <div style={{textAlign:"center",padding:"3rem",color:T.onVariant}}>
                  <span className="material-symbols-outlined" style={{fontSize:"2.5rem",color:"rgba(110,59,216,0.25)",display:"block",marginBottom:"0.75rem"}}>person_search</span>
                  <p style={{fontWeight:600,color:T.onSurface}}>No users found</p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"0.625rem"}}>
                  <p style={{fontSize:"0.75rem",fontWeight:600,color:T.onVariant,textTransform:"uppercase",letterSpacing:"0.05em"}}>{users.length} result{users.length!==1?"s":""}</p>
                  {users.map((u,i)=>(
                    <div key={u.id} style={{animationDelay:`${i*0.05}s`}}>
                      <UserCard user={u} onMessage={()=>navigate?.("messages")} onProfile={(u)=>navigate?.("userprofile", u.id)} />
                        
                    </div>
                  ))}
                </div>
              )
            ) : (
              posts.length===0 ? (
                <div style={{textAlign:"center",padding:"3rem",color:T.onVariant}}>
                  <span className="material-symbols-outlined" style={{fontSize:"2.5rem",color:"rgba(110,59,216,0.25)",display:"block",marginBottom:"0.75rem"}}>article</span>
                  <p style={{fontWeight:600,color:T.onSurface}}>No posts found</p>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                  <p style={{fontSize:"0.75rem",fontWeight:600,color:T.onVariant,textTransform:"uppercase",letterSpacing:"0.05em"}}>{posts.length} post{posts.length!==1?"s":""}</p>
                  {posts.map((p,i)=>(
                    <div key={p.post_id} style={{animationDelay:`${i*0.05}s`}}>
                      <PostResultCard post={p}/>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav style={{position:"fixed",bottom:"0.75rem",left:"0.75rem",right:"0.75rem",height:"4rem",display:"flex",alignItems:"center",justifyContent:"space-around",zIndex:50,borderRadius:"9999px",background:"rgba(255,255,255,0.75)",backdropFilter:"blur(40px)",boxShadow:"0 16px 40px rgba(0,0,0,0.08)"}} className="lg:hidden">
          {navItems.map(({icon,label,page,active})=>(
            <button key={page} onClick={()=>navigate?.(page)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",border:"none",background:"transparent",cursor:"pointer",color:active?T.primary:T.onVariant}}>
              <span className="material-symbols-outlined" style={{fontSize:"20px",fontVariationSettings:active?"'FILL' 1":"'FILL' 0"}}>{icon}</span>
              <span style={{fontSize:"0.6rem",fontWeight:600}}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
