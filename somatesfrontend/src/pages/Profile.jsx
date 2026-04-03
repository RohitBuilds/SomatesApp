
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";

const BASE_URL = "http://localhost:8000";

async function api(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: isFormData ? {} : { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const T = {
  primary: "#6e3bd8", primaryDim: "#622bcb", secondary: "#1c6b50",
  surface: "#f7f9fb", surfaceLow: "#f1f4f6", container: "#eaeef1",
  outline: "#acb3b7", onSurface: "#2d3337", onVariant: "#596063",
  primaryContainer: "#cbb6ff", glass: "rgba(255,255,255,0.70)",
};

const PRISM = `radial-gradient(circle at 10% 10%,rgba(110,59,216,0.07) 0%,transparent 50%),radial-gradient(circle at 90% 90%,rgba(177,254,218,0.09) 0%,transparent 50%),#f7f9fb`;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
  *,*::before,*::after{font-family:'Plus Jakarta Sans',sans-serif!important;box-sizing:border-box;margin:0;padding:0;}
  body{background:#f7f9fb!important;overflow-x:hidden;}
  ::-webkit-scrollbar{display:none;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  .fu{animation:fadeUp 0.4s ease both;}
  .si{animation:scaleIn 0.22s ease both;}
  .sd{animation:slideDown 0.3s ease both;}

  .material-symbols-outlined{
    font-family:'Material Symbols Outlined'!important;font-weight:normal;font-style:normal;
    font-size:24px;display:inline-block;line-height:1;text-transform:none;
    letter-spacing:normal;white-space:nowrap;direction:ltr;
  }

  .desktop-sidebar{display:none;}
  @media(min-width:1024px){.desktop-sidebar{display:flex;}}

  .mobile-nav{display:flex;}
  @media(min-width:1024px){.mobile-nav{display:none;}}

  .main-content{padding-left:1rem;padding-right:1rem;}
  @media(min-width:1024px){.main-content{margin-left:16rem;}}

  .posts-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;}
  @media(min-width:640px){.posts-grid{grid-template-columns:repeat(3,1fr);gap:0.75rem;}}
  @media(min-width:1024px){.posts-grid{gap:1rem;}}

  .profile-header{display:flex;flex-direction:column;gap:1rem;}
  @media(min-width:640px){.profile-header{flex-direction:row;gap:1.5rem;}}

  .stats-container{display:flex;gap:1.5rem;justify-content:space-around;}
  @media(min-width:640px){.stats-container{justify-content:flex-start;gap:2rem;}}

  /* ── Privacy Toggle Switch ── */
  .privacy-switch-track{
    position:relative;width:2.5rem;height:1.4rem;border-radius:9999px;
    transition:background 0.25s;cursor:pointer;border:none;outline:none;
    flex-shrink:0;
  }
  .privacy-switch-thumb{
    position:absolute;top:2px;width:1rem;height:1rem;border-radius:9999px;
    background:#fff;transition:transform 0.25s,box-shadow 0.25s;
    box-shadow:0 1px 4px rgba(0,0,0,0.25);
  }

  /* ── Request card pulse on new request ── */
  @keyframes requestPulse{0%,100%{box-shadow:0 0 0 0 rgba(110,59,216,0.25)}50%{box-shadow:0 0 0 6px rgba(110,59,216,0)}}
  .req-pulse{animation:requestPulse 2s infinite;}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = "md", onClick }) {
  const sz = { xs:"1.5rem", sm:"2rem", md:"2.5rem", lg:"3rem", xl:"5.5rem" };
  const pal = ["#6e3bd8","#1c6b50","#77556a","#2563eb","#d97706","#b45309","#0891b2"];
  const bg = pal[(name?.charCodeAt(0) || 65) % pal.length];
  const init = name ? name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() : "?";
  const [imgKey, setImgKey] = useState(0);
  const dim = sz[size] || "2.5rem";

  useEffect(() => { setImgKey(k => k + 1); }, [src]);

  return (
    <div onClick={onClick}
      style={{ width:dim, height:dim, borderRadius:"9999px", flexShrink:0, overflow:"hidden",
        display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700,
        color:"white", fontSize:size==="xl"?"1.4rem":"0.85rem",
        background:src?"transparent":bg, userSelect:"none", cursor:onClick?"pointer":"default" }}>
      {src
        ? <img key={imgKey} src={src} alt={name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.target.style.display="none"; e.target.parentNode.style.background=bg; }}/>
        : init}
    </div>
  );
}

const Spinner = () => (
  <div style={{ width:"1.5rem", height:"1.5rem", borderRadius:"9999px",
    border:"2px solid #cbb6ff", borderTopColor:"#6e3bd8",
    animation:"spin 0.8s linear infinite" }}/>
);

// ─────────────────────────────────────────────────────────────────────────────
// PrivacyToggle — the little switch shown on your own profile
// ─────────────────────────────────────────────────────────────────────────────

function PrivacyToggle({ isPrivate, onToggle, busy }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
      <span style={{ fontSize:"0.72rem", fontWeight:600,
        color: isPrivate ? T.primary : T.onVariant,
        display:"flex", alignItems:"center", gap:"0.25rem" }}>
        <span className="material-symbols-outlined"
          style={{ fontSize:"13px", fontVariationSettings: isPrivate ? "'FILL' 1" : "'FILL' 0" }}>
          {isPrivate ? "lock" : "public"}
        </span>
        {isPrivate ? "Private" : "Public"}
      </span>

      <button
        className="privacy-switch-track"
        onClick={!busy ? onToggle : undefined}
        disabled={busy}
        style={{ background: isPrivate ? T.primary : T.outline, opacity: busy ? 0.6 : 1 }}
        title={isPrivate ? "Switch to Public" : "Switch to Private"}
      >
        {busy
          ? <div style={{ position:"absolute", top:"3px", left:"3px", width:"0.875rem",
              height:"0.875rem", borderRadius:"9999px", border:"2px solid rgba(255,255,255,0.5)",
              borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/>
          : <div className="privacy-switch-thumb"
              style={{ transform: isPrivate ? "translateX(1.1rem)" : "translateX(2px)" }}/>
        }
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FollowRequestsPanel — shown on your own profile when account is private
// ─────────────────────────────────────────────────────────────────────────────

function FollowRequestsPanel({ requests, onAccept, onReject }) {
  if (!requests || requests.length === 0) return null;

  return (
    <div className="sd" style={{ background:T.glass, backdropFilter:"blur(40px)",
      borderRadius:"1.5rem", border:`1.5px solid rgba(110,59,216,0.18)`,
      padding:"1.25rem", boxShadow:"0 4px 16px rgba(110,59,216,0.08)" }}>

      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1rem" }}>
        <span className="material-symbols-outlined"
          style={{ fontSize:"18px", color:T.primary, fontVariationSettings:"'FILL' 1" }}>
          person_add
        </span>
        <h3 style={{ fontSize:"0.95rem", fontWeight:800, color:T.onSurface }}>
          Follow Requests
        </h3>
        <span style={{ marginLeft:"auto", background:`rgba(110,59,216,0.12)`,
          color:T.primary, fontSize:"0.7rem", fontWeight:700,
          padding:"0.2rem 0.6rem", borderRadius:"9999px" }}>
          {requests.length}
        </span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
        {requests.map(req => (
          <div key={req.id} className="req-pulse"
            style={{ display:"flex", alignItems:"center", gap:"0.75rem",
              padding:"0.75rem", borderRadius:"1rem",
              background:"rgba(255,255,255,0.85)",
              border:"1px solid rgba(255,255,255,0.9)" }}>

            <Avatar src={req.profilepic} name={req.name} size="sm"/>

            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontWeight:700, fontSize:"0.875rem", color:T.onSurface,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {req.name}
              </p>
              <p style={{ fontSize:"0.7rem", color:T.onVariant }}>wants to follow you</p>
            </div>

            <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
              <button onClick={() => onAccept(req.id)}
                style={{ padding:"0.35rem 0.85rem", borderRadius:"9999px", border:"none",
                  cursor:"pointer", fontSize:"0.75rem", fontWeight:700, color:"#fff",
                  background:T.primary }}>
                Confirm
              </button>
              <button onClick={() => onReject(req.id)}
                style={{ padding:"0.35rem 0.85rem", borderRadius:"9999px",
                  border:`1px solid ${T.container}`, cursor:"pointer",
                  fontSize:"0.75rem", fontWeight:600, color:T.onVariant,
                  background:"transparent" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PeopleListModal
// ─────────────────────────────────────────────────────────────────────────────

function PeopleListModal({ type, userId, onClose, onViewProfile, onCountChange }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPeople = async () => {
      try {
        const endpoint = userId ? `/${type}/${userId}` : `/${type}`;
        const data = await api(endpoint);
        setPeople(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(`Failed to load ${type}:`, e);
        setPeople([]);
      } finally {
        setLoading(false);
      }
    };
    loadPeople();
  }, [type, userId]);

  const handleRemove = async (followUserId) => {
    if (!window.confirm("Remove this follower?")) return;
    try {
      const response = await fetch(`${BASE_URL}/followers/${followUserId}`, {
        method:"DELETE", credentials:"include"
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to remove follower");
      }
      setPeople(prev => prev.filter(p => p.id !== followUserId));
      if (onCountChange) onCountChange(-1);
    } catch (e) {
      alert(e.message || "Failed to remove follower");
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex",
      alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)",
        backdropFilter:"blur(10px)" }}/>
      <div className="si" style={{ position:"relative", width:"100%", maxWidth:"26rem",
        background:"rgba(255,255,255,0.97)", backdropFilter:"blur(40px)",
        borderRadius:"1.5rem", border:"1px solid rgba(255,255,255,0.6)",
        maxHeight:"75vh", display:"flex", flexDirection:"column", zIndex:1 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"1.25rem 1.5rem", borderBottom:`1px solid ${T.surfaceLow}` }}>
          <h3 style={{ fontWeight:800, fontSize:"1.1rem", color:T.onSurface, textTransform:"capitalize" }}>
            {type} ({people.length})
          </h3>
          <button onClick={onClose} style={{ width:"2rem", height:"2rem", borderRadius:"9999px",
            background:T.surfaceLow, border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span className="material-symbols-outlined" style={{ fontSize:"18px", color:T.onVariant }}>close</span>
          </button>
        </div>

        <div style={{ overflowY:"auto", padding:"1rem 1.5rem",
          display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}><Spinner/></div>
          ) : people.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem" }}>
              <span className="material-symbols-outlined"
                style={{ fontSize:"3rem", color:"rgba(110,59,216,0.2)", marginBottom:"0.75rem" }}>group</span>
              <p style={{ color:T.outline, fontSize:"0.875rem" }}>No {type} yet</p>
            </div>
          ) : people.map(u => (
            <div key={u.id} style={{ display:"flex", alignItems:"center", gap:"0.875rem",
              padding:"0.75rem", borderRadius:"1rem",
              background:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.8)" }}>
              <Avatar src={u.profile_picture || u.profile_pic || u.profilepic} name={u.name} size="md"/>
              <div style={{ flex:1, minWidth:0, cursor:"pointer" }}
                onClick={() => { onViewProfile(u.id); onClose(); }}>
                <p style={{ fontWeight:700, color:T.onSurface, fontSize:"0.9rem" }}>{u.name}</p>
                <p style={{ fontSize:"0.74rem", color:T.onVariant, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email || ""}</p>
              </div>
              {type === "followers" && !userId && (
                <button onClick={e => { e.stopPropagation(); handleRemove(u.id); }}
                  style={{ padding:"0.4rem 0.875rem", borderRadius:"9999px", border:"none",
                    cursor:"pointer", background:"rgba(239,68,68,0.1)", color:"#ef4444",
                    fontSize:"0.75rem", fontWeight:600 }}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeleteConfirmModal
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:250, display:"flex",
      alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onCancel}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }}/>
      <div className="si" style={{ position:"relative", width:"100%", maxWidth:"20rem",
        background:"white", borderRadius:"1.25rem", padding:"1.5rem", zIndex:1 }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize:"1.1rem", fontWeight:700, color:T.onSurface, marginBottom:"0.5rem" }}>
          Delete Post?
        </h3>
        <p style={{ fontSize:"0.85rem", color:T.onVariant, marginBottom:"1.25rem" }}>
          This can't be undone.
        </p>
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"0.7rem", borderRadius:"9999px",
              border:`1.5px solid ${T.surfaceLow}`, cursor:"pointer",
              background:"transparent", fontSize:"0.85rem", fontWeight:600, color:T.onVariant }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"0.7rem", borderRadius:"9999px", border:"none",
              cursor:"pointer", background:"#ef4444", fontSize:"0.85rem",
              fontWeight:700, color:"white" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PostCard
// ─────────────────────────────────────────────────────────────────────────────

function PostCard({ post, isOwn, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now - d;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
    } catch { return ""; }
  };

  return (
    <>
      <div style={{ background:T.glass, backdropFilter:"blur(40px)", borderRadius:"1rem",
        border:"1px solid rgba(255,255,255,0.7)", overflow:"hidden",
        boxShadow:"0 4px 16px rgba(0,0,0,0.04)" }}>
        {post.image_url && (
          <div style={{ width:"100%", aspectRatio:"1/1", overflow:"hidden", background:"#000" }}>
            <img src={post.image_url} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
        )}
        <div style={{ padding:"0.75rem" }}>
          {post.content && (
            <p style={{ fontSize:"0.8rem", color:T.onSurface, lineHeight:1.5,
              marginBottom:"0.625rem", overflow:"hidden", display:"-webkit-box",
              WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
              {post.content}
            </p>
          )}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            paddingTop:"0.5rem", borderTop:`1px solid ${T.surfaceLow}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.25rem" }}>
                <span className="material-symbols-outlined"
                  style={{ fontSize:"14px", color:T.primary, fontVariationSettings:"'FILL' 1" }}>favorite</span>
                <span style={{ fontSize:"0.7rem", fontWeight:600, color:T.onSurface }}>
                  {post.likes || 0}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.25rem" }}>
                <span className="material-symbols-outlined"
                  style={{ fontSize:"14px", color:T.onVariant }}>chat_bubble</span>
                <span style={{ fontSize:"0.7rem", fontWeight:600, color:T.onSurface }}>
                  {post.comments || 0}
                </span>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <span style={{ fontSize:"0.65rem", color:T.outline }}>
                {formatDate(post.created_at)}
              </span>
              {isOwn && (
                <button onClick={() => setShowDeleteConfirm(true)}
                  style={{ width:"1.5rem", height:"1.5rem", borderRadius:"9999px",
                    border:"none", cursor:"pointer", background:"rgba(239,68,68,0.1)",
                    display:"flex", alignItems:"center", justifyContent:"center", color:"#ef4444" }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"14px" }}>delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => { setShowDeleteConfirm(false); onDelete(post.id); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditProfileModal
// ─────────────────────────────────────────────────────────────────────────────

function EditProfileModal({ profile, onClose, onSaved }) {
  const [name, setName] = useState(profile?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      const updated = await api("/edituser", { method:"PUT", body:formData });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex",
      alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)",
        backdropFilter:"blur(10px)" }}/>
      <div className="si" style={{ position:"relative", width:"100%", maxWidth:"24rem",
        background:"rgba(255,255,255,0.97)", backdropFilter:"blur(40px)",
        borderRadius:"1.5rem", border:"1px solid rgba(255,255,255,0.6)",
        padding:"1.75rem", zIndex:1 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight:800, fontSize:"1.25rem", color:T.onSurface, marginBottom:"1.5rem" }}>
          Edit Profile
        </h3>
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div>
            <label style={{ fontSize:"0.8rem", fontWeight:600, color:T.onVariant,
              marginBottom:"0.5rem", display:"block" }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"0.875rem",
                border:`1.5px solid ${T.surfaceLow}`, background:"white",
                fontSize:"0.9rem", outline:"none", color:T.onSurface }}/>
          </div>
          <div>
            <label style={{ fontSize:"0.8rem", fontWeight:600, color:T.onVariant,
              marginBottom:"0.5rem", display:"block" }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"0.875rem",
                border:`1.5px solid ${T.surfaceLow}`, background:"white",
                fontSize:"0.9rem", outline:"none", resize:"none", color:T.onSurface }}/>
          </div>
          {error && <p style={{ fontSize:"0.82rem", color:"#ef4444" }}>⚠ {error}</p>}
          <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.5rem" }}>
            <button onClick={onClose}
              style={{ flex:1, padding:"0.75rem", borderRadius:"9999px",
                border:`1.5px solid ${T.container}`, cursor:"pointer",
                background:"transparent", fontSize:"0.875rem",
                fontWeight:600, color:T.onVariant }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex:1, padding:"0.75rem", borderRadius:"9999px", border:"none",
                cursor:saving?"not-allowed":"pointer", fontSize:"0.875rem",
                fontWeight:700, color:"white",
                background:`linear-gradient(135deg,${T.primary},${T.primaryDim})`,
                opacity:saving?0.65:1 }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LockedProfileWall — shown when a private account hasn't accepted you yet
// ─────────────────────────────────────────────────────────────────────────────

function LockedProfileWall({ name }) {
  return (
    <div className="fu" style={{ display:"flex", flexDirection:"column", alignItems:"center",
      padding:"3rem 1rem", gap:"0.875rem", color:T.onVariant }}>
      <div style={{ width:"4rem", height:"4rem", borderRadius:"9999px",
        background:`rgba(110,59,216,0.08)`, display:"flex",
        alignItems:"center", justifyContent:"center" }}>
        <span className="material-symbols-outlined"
          style={{ fontSize:"2rem", color:T.primary, fontVariationSettings:"'FILL' 1" }}>
          lock
        </span>
      </div>
      <p style={{ fontWeight:800, color:T.onSurface, fontSize:"1rem" }}>
        This account is private
      </p>
      <p style={{ fontSize:"0.82rem", textAlign:"center", maxWidth:"18rem", lineHeight:1.6 }}>
        Follow {name || "this account"} to see their photos and videos.
        Send a follow request and wait for them to accept.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ViewUserProfile — viewing someone else's profile
//   • Public account  → Follow / Following buttons as before
//   • Private account → Request / Requested (cancel) / Following
//   • Private + locked → LockedProfileWall instead of posts
// ─────────────────────────────────────────────────────────────────────────────

function ViewUserProfile({ userId, onBack, onFollowChange, setViewingUserId }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPeopleModal, setShowPeopleModal] = useState(null);

  // "none" | "pending" | "following"
  const [relationStatus, setRelationStatus] = useState("none");
  const [requestId, setRequestId] = useState(null); // id of pending request if any
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [profileData, statusData] = await Promise.all([
          api(`/userprofilebyid/${userId}`),
          api(`/follow-request/status/${userId}`),
        ]);

        setProfile(profileData);
        setPosts(profileData.posts || []);

        // status can be "following", "pending", "none"
        setRelationStatus(statusData.status || "none");
        setRequestId(statusData.request_id || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [userId]);

  // ── action handlers ──────────────────────────────────────────────────────

  const handleFollow = async () => {
    // For public accounts: instant follow
    setActionBusy(true);
    try {
      await fetch(`${BASE_URL}/following/${userId}`, { method:"POST", credentials:"include" });
      setRelationStatus("following");
      setProfile(prev => ({ ...prev, followers: (prev.followers || 0) + 1 }));
      onFollowChange?.();
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const handleUnfollow = async () => {
    setActionBusy(true);
    try {
      await fetch(`${BASE_URL}/unfollow/${userId}`, { method:"DELETE", credentials:"include" });
      setRelationStatus("none");
      setProfile(prev => ({ ...prev, followers: Math.max(0, (prev.followers || 0) - 1) }));
      onFollowChange?.();
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const handleSendRequest = async () => {
    // For private accounts: send follow request
    setActionBusy(true);
    try {
      const res = await api(`/follow-request/${userId}`, { method:"POST" });
      if (res.status === "pending") {
        setRelationStatus("pending");
        setRequestId(res.request_id || null);
      } else if (res.status === "following") {
        // public account edge case
        setRelationStatus("following");
        setProfile(prev => ({ ...prev, followers: (prev.followers || 0) + 1 }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancelRequest = async () => {
    setActionBusy(true);
    try {
      await api(`/follow-request/cancel/${userId}`, { method:"DELETE" });
      setRelationStatus("none");
      setRequestId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  // ── button rendering based on privacy + status ───────────────────────────

  const renderFollowButton = () => {
    const isPrivate = profile?.is_private;
    const base = { padding:"0.5rem 1rem", borderRadius:"9999px", border:"none",
      cursor: actionBusy ? "not-allowed" : "pointer",
      fontSize:"0.8rem", fontWeight:700, flexShrink:0,
      opacity: actionBusy ? 0.65 : 1,
      display:"flex", alignItems:"center", gap:"0.35rem",
      transition:"all 0.2s" };

    if (relationStatus === "following") {
      return (
        <button onClick={!actionBusy ? handleUnfollow : undefined}
          style={{ ...base, color:"white", background:T.primary }}>
          <span className="material-symbols-outlined"
            style={{ fontSize:"14px", fontVariationSettings:"'FILL' 1" }}>check</span>
          Following
        </button>
      );
    }

    if (isPrivate && relationStatus === "pending") {
      return (
        <button onClick={!actionBusy ? handleCancelRequest : undefined}
          style={{ ...base, color:T.primary,
            background:`rgba(110,59,216,0.1)`,
            border:`1.5px solid rgba(110,59,216,0.3)` }}>
          <span className="material-symbols-outlined"
            style={{ fontSize:"14px", fontVariationSettings:"'FILL' 1" }}>schedule</span>
          Requested
        </button>
      );
    }

    if (isPrivate) {
      return (
        <button onClick={!actionBusy ? handleSendRequest : undefined}
          style={{ ...base, color:"white",
            background:`linear-gradient(135deg,${T.primary},${T.primaryDim})` }}>
          <span className="material-symbols-outlined"
            style={{ fontSize:"14px" }}>person_add</span>
          Request
        </button>
      );
    }

    // Public account — classic Follow
    return (
      <button onClick={!actionBusy ? handleFollow : undefined}
        style={{ ...base, color:T.primary, background:`rgba(110,59,216,0.1)` }}>
        Follow
      </button>
    );
  };

  // ── render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"60vh" }}>
        <Spinner/>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign:"center", padding:"3rem" }}>
        <p style={{ color:T.onVariant }}>User not found</p>
        <button onClick={onBack}
          style={{ marginTop:"1rem", padding:"0.6rem 1.25rem", borderRadius:"9999px",
            border:"none", cursor:"pointer", background:T.primary,
            color:"white", fontSize:"0.85rem", fontWeight:600 }}>
          Go Back
        </button>
      </div>
    );
  }

  const isLocked = profile.is_locked && relationStatus !== "following";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

      {/* Back button */}
      <button onClick={onBack}
        style={{ display:"flex", alignItems:"center", gap:"0.5rem", background:"none",
          border:"none", cursor:"pointer", color:T.onVariant,
          fontSize:"0.9rem", fontWeight:600, padding:"0.5rem 0" }}>
        <span className="material-symbols-outlined" style={{ fontSize:"20px" }}>arrow_back</span>
        Back
      </button>

      {/* Profile card */}
      <div style={{ background:T.glass, backdropFilter:"blur(40px)", borderRadius:"1.5rem",
        border:"1px solid rgba(255,255,255,0.7)", padding:"1.25rem",
        boxShadow:"0 4px 16px rgba(0,0,0,0.04)" }}>

        <div className="profile-header" style={{ alignItems:"flex-start", marginBottom:"1rem" }}>
          <Avatar src={profile.profilepic || profile.profile_pic || profile.profile_picture}
            name={profile.name} size="xl"/>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.4rem",
              flexWrap:"wrap", marginBottom:"0.25rem" }}>
              <h1 style={{ fontSize:"1.25rem", fontWeight:800, color:T.onSurface, lineHeight:1.2 }}>
                {profile.name}
              </h1>
              {profile.is_private && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:"0.2rem",
                  background:"rgba(110,59,216,0.1)", color:T.primary,
                  fontSize:"0.65rem", fontWeight:700,
                  padding:"0.15rem 0.5rem", borderRadius:"9999px" }}>
                  <span className="material-symbols-outlined"
                    style={{ fontSize:"11px", fontVariationSettings:"'FILL' 1" }}>lock</span>
                  Private
                </span>
              )}
            </div>
            <p style={{ fontSize:"0.8rem", color:T.onVariant, marginBottom:"0.5rem" }}>
              {profile.email}
            </p>
            {!isLocked && profile.bio && (
              <p style={{ fontSize:"0.8rem", color:T.onVariant, marginTop:"0.5rem", lineHeight:1.6 }}>
                {profile.bio}
              </p>
            )}
          </div>

          {renderFollowButton()}
        </div>

        {/* Stats — always visible (Instagram shows counts even for locked accounts) */}
        <div className="stats-container"
          style={{ paddingTop:"1rem", borderTop:`1px solid ${T.surfaceLow}` }}>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:"1.1rem", fontWeight:800, color:T.onSurface, lineHeight:1 }}>
              {isLocked ? "—" : posts.length}
            </p>
            <p style={{ fontSize:"0.65rem", color:T.onVariant, fontWeight:600,
              textTransform:"uppercase", marginTop:"0.25rem" }}>Posts</p>
          </div>
          <div style={{ textAlign:"center", cursor: isLocked ? "default" : "pointer" }}
            onClick={() => !isLocked && setShowPeopleModal("followers")}>
            <p style={{ fontSize:"1.1rem", fontWeight:800, color:T.onSurface, lineHeight:1 }}>
              {profile.followers ?? 0}
            </p>
            <p style={{ fontSize:"0.65rem", color:T.onVariant, fontWeight:600,
              textTransform:"uppercase", marginTop:"0.25rem" }}>Followers</p>
          </div>
          <div style={{ textAlign:"center", cursor: isLocked ? "default" : "pointer" }}
            onClick={() => !isLocked && setShowPeopleModal("following")}>
            <p style={{ fontSize:"1.1rem", fontWeight:800, color:T.onSurface, lineHeight:1 }}>
              {profile.following ?? 0}
            </p>
            <p style={{ fontSize:"0.65rem", color:T.onVariant, fontWeight:600,
              textTransform:"uppercase", marginTop:"0.25rem" }}>Following</p>
          </div>
        </div>
      </div>

      {/* Locked wall OR posts */}
      {isLocked ? (
        <div style={{ background:T.glass, backdropFilter:"blur(40px)", borderRadius:"1.5rem",
          border:"1px solid rgba(255,255,255,0.7)" }}>
          <LockedProfileWall name={profile.name}/>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
          padding:"3rem 0", color:T.onVariant }}>
          <span className="material-symbols-outlined"
            style={{ fontSize:"2.5rem", color:"rgba(110,59,216,0.25)", marginBottom:"0.75rem" }}>
            grid_on
          </span>
          <p style={{ fontWeight:700, color:T.onSurface, fontSize:"0.9rem" }}>No posts yet</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post, i) => (
            <div key={post.id} className="fu" style={{ animationDelay:`${i*0.02}s` }}>
              <PostCard post={post} isOwn={false}/>
            </div>
          ))}
        </div>
      )}

      {/* Followers / Following modal (only for unlocked profiles) */}
      {showPeopleModal && !isLocked && (
        <PeopleListModal
          type={showPeopleModal}
          userId={userId}
          onClose={() => setShowPeopleModal(null)}
          onViewProfile={id => {
            setShowPeopleModal(null);
            setViewingUserId(id);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Profile Component — your own profile
// ─────────────────────────────────────────────────────────────────────────────

export default function Profile({ navigate }) {
  const { userId: urlUserId } = useParams();

  const [profile, setProfile]               = useState(null);
  const [posts, setPosts]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showEdit, setShowEdit]             = useState(false);
  const [showPeopleModal, setShowPeopleModal] = useState(null);
  // If a userId is in the URL (e.g. /profile/6), open that user's profile directly
  const [viewingUserId, setViewingUserId]   = useState(urlUserId ? parseInt(urlUserId) : null);

  // ── Privacy & Follow-request state ──────────────────────────────────────
  const [isPrivate, setIsPrivate]           = useState(false);
  const [privacyLoaded, setPrivacyLoaded]   = useState(false);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const [followRequests, setFollowRequests] = useState([]);

  const fileInputRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const loadFollowRequests = useCallback(async () => {
    try {
      const reqs = await api("/follow-requests/pending");
      setFollowRequests(Array.isArray(reqs) ? reqs : []);
    } catch (e) {
      console.error("Could not load follow requests:", e);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, privacyData] = await Promise.all([
        api("/me"),
        api("/privacy"),
      ]);

      setProfile(profileData);
      setPosts(profileData.posts || []);
      setIsPrivate(privacyData.is_private);
      setPrivacyLoaded(true);

      if (privacyData.is_private) {
        // Load pending requests in parallel
        const reqs = await api("/follow-requests/pending");
        setFollowRequests(Array.isArray(reqs) ? reqs : []);
      }
    } catch (e) {
      console.error("Profile load error:", e);
      if (e.message?.includes("logged") || e.message?.includes("authenticated"))
        navigate?.("login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Privacy toggle ────────────────────────────────────────────────────────

  const handlePrivacyToggle = async () => {
    setTogglingPrivacy(true);
    try {
      const res = await api("/privacy", { method:"PUT" });
      setIsPrivate(res.is_private);
      if (res.is_private) {
        await loadFollowRequests();
      } else {
        setFollowRequests([]);
      }
    } catch (e) {
      console.error("Privacy toggle failed:", e);
    } finally {
      setTogglingPrivacy(false);
    }
  };

  // ── Follow request handlers ───────────────────────────────────────────────

  const handleAcceptRequest = async (requestId) => {
    try {
      await api(`/follow-request/${requestId}/accept`, { method:"PUT" });
      setFollowRequests(prev => prev.filter(r => r.id !== requestId));
      setProfile(prev => ({ ...prev, followers: (prev?.followers || 0) + 1 }));
    } catch (e) {
      console.error("Accept failed:", e);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api(`/follow-request/${requestId}`, { method:"DELETE" });
      setFollowRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e) {
      console.error("Reject failed:", e);
    }
  };

  // ── Other handlers ────────────────────────────────────────────────────────

  const handleFollowerCountChange = (delta) => {
    setProfile(prev => ({
      ...prev,
      followers: Math.max(0, (prev?.followers || 0) + delta)
    }));
  };

  const onProfileSaved = (updated) => {
    setProfile(prev => ({
      ...prev,
      name: updated.user.name,
      bio: updated.user.bio,
      profilepic: updated.user.profilepic || updated.user.profile_pic,
    }));
  };

  const handleDeletePost = async (postId) => {
    try {
      await fetch(`${BASE_URL}/posts/${postId}`, { method:"DELETE", credentials:"include" });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {
      alert("Failed to delete post");
    }
  };

  const handlePicClick = () => fileInputRef.current?.click();

  const handlePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const r = await api("/profile/upload-picture", { method:"POST", body:formData });
      setProfile(prev => ({ ...prev, profilepic: r.profilepic }));
    } catch (e) {
      alert("Upload failed: " + e.message);
    }
  };

  // ── Nav ───────────────────────────────────────────────────────────────────

  const navItems = [
    { icon:"grid_view",     label:"Feed",     page:"feed" },
    { icon:"explore",       label:"Search",   page:"search" },
    { icon:"groups",        label:"People",   page:"people" },
    { icon:"chat_bubble",   label:"Messages", page:"messages" },
    { icon:"account_circle",label:"Profile",  page:"profile", active:true },
  ];

  const handleNavigate = (page) => {
    if (navigate && typeof navigate === "function") navigate(page);
  };

  // ── Sidebar + nav shell (shared for both views) ───────────────────────────

  const SidebarContent = () => (
    <>
      <div style={{ marginBottom:"1.5rem", padding:"0 0.5rem" }}>
        <h2 style={{ fontSize:"0.9375rem", fontWeight:700, color:T.onSurface }}>Somates</h2>
      </div>
      <nav style={{ display:"flex", flexDirection:"column", gap:"0.2rem", flex:1 }}>
        {navItems.map(({ icon, label, page, active }) => (
          <button key={page} onClick={() => handleNavigate(page)}
            style={{ display:"flex", alignItems:"center", gap:"0.75rem",
              padding:"0.7rem 0.875rem", borderRadius:"0.75rem", fontWeight:500,
              fontSize:"0.875rem", border:"none", cursor:"pointer",
              color:active?T.primary:T.onVariant,
              background:active?`linear-gradient(to right,rgba(110,59,216,0.09),transparent)`:"transparent",
              borderRight:active?`3px solid ${T.primary}`:"3px solid transparent",
              transition:"all 0.2s", textAlign:"left" }}>
            <span className="material-symbols-outlined"
              style={{ fontSize:"20px", fontVariationSettings:active?"'FILL' 1":"'FILL' 0" }}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </nav>
      <button
        onClick={() => {
          fetch(`${BASE_URL}/logout`, { method:"POST", credentials:"include" }).catch(() => {});
          handleNavigate("login");
        }}
        style={{ marginTop:"0.5rem", display:"flex", alignItems:"center", gap:"0.5rem",
          padding:"0.625rem 0.875rem", borderRadius:"0.75rem", border:"none",
          cursor:"pointer", background:"transparent", fontSize:"0.875rem",
          fontWeight:500, color:T.onVariant }}
        onMouseEnter={e => { e.currentTarget.style.background="#fef2f2"; e.currentTarget.style.color="#ef4444"; }}
        onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.onVariant; }}>
        <span className="material-symbols-outlined" style={{ fontSize:"20px" }}>logout</span>
        Logout
      </button>
    </>
  );

  const MobileNav = () => (
    <nav className="mobile-nav"
      style={{ position:"fixed", bottom:"0.75rem", left:"0.75rem", right:"0.75rem",
        height:"4rem", alignItems:"center", justifyContent:"space-around", zIndex:50,
        borderRadius:"9999px", background:"rgba(255,255,255,0.88)",
        backdropFilter:"blur(40px)", boxShadow:"0 8px 32px rgba(0,0,0,0.08)",
        border:"1px solid rgba(255,255,255,0.7)" }}>
      {navItems.map(({ icon, label, page, active }) => (
        <button key={page} onClick={() => handleNavigate(page)}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            gap:"2px", border:"none", background:"transparent", cursor:"pointer",
            color:active?T.primary:T.onVariant }}>
          <span className="material-symbols-outlined"
            style={{ fontSize:"20px", fontVariationSettings:active?"'FILL' 1":"'FILL' 0" }}>
            {icon}
          </span>
          <span style={{ fontSize:"0.58rem", fontWeight:600 }}>{label}</span>
        </button>
      ))}
    </nav>
  );

  // ── VIEWING ANOTHER USER ──────────────────────────────────────────────────

  if (viewingUserId) {
    return (
      <>
        <style>{CSS}</style>
        <div style={{ minHeight:"100vh", background:PRISM, color:T.onSurface }}>

          <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:"4.5rem",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"0 1.5rem", background:"rgba(247,249,251,0.85)",
            backdropFilter:"blur(40px)", boxShadow:"0 1px 0 rgba(0,0,0,0.06)" }}>
            <span style={{ fontSize:"1.35rem", fontWeight:800, letterSpacing:"-0.02em",
              color:T.onSurface }}>Somates</span>
          </header>

          <aside className="desktop-sidebar"
            style={{ position:"fixed", left:"1rem", top:"4.5rem", width:"14rem",
              padding:"1.25rem", zIndex:40, flexDirection:"column",
              height:"calc(100vh - 5.5rem)", marginTop:"0.5rem",
              borderRadius:"0 2rem 2rem 0", background:T.glass,
              backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.7)" }}>
            <SidebarContent/>
          </aside>

          <main className="main-content" style={{ paddingTop:"5.5rem", paddingBottom:"6rem" }}>
            <div style={{ maxWidth:"50rem", margin:"0 auto" }}>
              <ViewUserProfile
                userId={viewingUserId}
                onBack={() => {
                  setViewingUserId(null);
                  if (urlUserId) navigate?.("profile");
                }}
                onFollowChange={loadProfile}
                setViewingUserId={setViewingUserId}
              />
            </div>
          </main>

          <MobileNav/>
        </div>
      </>
    );
  }

  // ── OWN PROFILE ──────────────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:PRISM, color:T.onSurface }}>

        <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:"4.5rem",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 1.5rem", background:"rgba(247,249,251,0.85)",
          backdropFilter:"blur(40px)", boxShadow:"0 1px 0 rgba(0,0,0,0.06)" }}>
          <span style={{ fontSize:"1.35rem", fontWeight:800, letterSpacing:"-0.02em",
            color:T.onSurface }}>Somates</span>
        </header>

        <aside className="desktop-sidebar"
          style={{ position:"fixed", left:"1rem", top:"4.5rem", width:"14rem",
            padding:"1.25rem", zIndex:40, flexDirection:"column",
            height:"calc(100vh - 5.5rem)", marginTop:"0.5rem",
            borderRadius:"0 2rem 2rem 0", background:T.glass,
            backdropFilter:"blur(40px)", border:"1px solid rgba(255,255,255,0.7)" }}>
          <SidebarContent/>
        </aside>

        <main className="main-content" style={{ paddingTop:"5.5rem", paddingBottom:"6rem" }}>
          <div style={{ maxWidth:"50rem", margin:"0 auto", display:"flex",
            flexDirection:"column", gap:"1.5rem" }}>

            {/* ── Profile card ── */}
            <div style={{ background:T.glass, backdropFilter:"blur(40px)",
              borderRadius:"1.5rem", border:"1px solid rgba(255,255,255,0.7)",
              padding:"1.25rem", boxShadow:"0 4px 16px rgba(0,0,0,0.04)" }}>

              {loading ? (
                <div style={{ display:"flex", justifyContent:"center", padding:"3rem" }}>
                  <Spinner/>
                </div>
              ) : (
                <>
                  <div className="profile-header"
                    style={{ alignItems:"flex-start", marginBottom:"1rem" }}>

                    {/* Avatar with upload button */}
                    <div style={{ position:"relative" }}>
                      <Avatar
                        src={profile?.profilepic || profile?.profile_pic || profile?.profile_picture}
                        name={profile?.name} size="xl" onClick={handlePicClick}/>
                      <input ref={fileInputRef} type="file" accept="image/*"
                        onChange={handlePicUpload} style={{ display:"none" }}/>
                      <button onClick={handlePicClick}
                        style={{ position:"absolute", bottom:"-4px", right:"-4px",
                          width:"2rem", height:"2rem", borderRadius:"9999px",
                          background:T.primary, border:"2px solid white",
                          cursor:"pointer", display:"flex", alignItems:"center",
                          justifyContent:"center" }}>
                        <span className="material-symbols-outlined"
                          style={{ fontSize:"16px", color:"white" }}>photo_camera</span>
                      </button>
                    </div>

                    {/* Name / email / bio */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.4rem",
                        flexWrap:"wrap", marginBottom:"0.25rem" }}>
                        <h1 style={{ fontSize:"1.25rem", fontWeight:800,
                          color:T.onSurface, lineHeight:1.2 }}>
                          {profile?.name}
                        </h1>
                        {privacyLoaded && isPrivate && (
                          <span style={{ display:"inline-flex", alignItems:"center",
                            gap:"0.2rem", background:"rgba(110,59,216,0.1)",
                            color:T.primary, fontSize:"0.65rem", fontWeight:700,
                            padding:"0.15rem 0.5rem", borderRadius:"9999px" }}>
                            <span className="material-symbols-outlined"
                              style={{ fontSize:"11px", fontVariationSettings:"'FILL' 1" }}>lock</span>
                            Private
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:"0.8rem", color:T.onVariant, marginBottom:"0.5rem" }}>
                        {profile?.email}
                      </p>
                      {profile?.bio && profile.bio.trim() ? (
                        <p style={{ fontSize:"0.8rem", color:T.onVariant,
                          marginTop:"0.5rem", lineHeight:1.6 }}>
                          {profile.bio}
                        </p>
                      ) : (
                        <button onClick={() => setShowEdit(true)}
                          style={{ fontSize:"0.75rem", color:T.outline, marginTop:"0.5rem",
                            background:"none", border:"none", cursor:"pointer",
                            display:"flex", alignItems:"center", gap:"0.25rem" }}>
                          <span className="material-symbols-outlined"
                            style={{ fontSize:"14px" }}>add</span>
                          Add bio
                        </button>
                      )}
                    </div>

                    {/* Edit + Privacy toggle stacked */}
                    <div style={{ display:"flex", flexDirection:"column",
                      gap:"0.75rem", alignItems:"flex-end", flexShrink:0 }}>
                      <button onClick={() => setShowEdit(true)}
                        style={{ padding:"0.5rem 1rem", borderRadius:"9999px",
                          border:`1.5px solid ${T.primary}`, cursor:"pointer",
                          background:"transparent", fontSize:"0.75rem",
                          fontWeight:700, color:T.primary }}
                        onMouseEnter={e => { e.currentTarget.style.background=T.primary; e.currentTarget.style.color="#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=T.primary; }}>
                        Edit
                      </button>

                      {/* ← Privacy Toggle */}
                      {privacyLoaded && (
                        <PrivacyToggle
                          isPrivate={isPrivate}
                          onToggle={handlePrivacyToggle}
                          busy={togglingPrivacy}
                        />
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="stats-container"
                    style={{ paddingTop:"1rem", borderTop:`1px solid ${T.surfaceLow}` }}>
                    <div style={{ textAlign:"center" }}>
                      <p style={{ fontSize:"1.1rem", fontWeight:800,
                        color:T.onSurface, lineHeight:1 }}>
                        {posts.length}
                      </p>
                      <p style={{ fontSize:"0.65rem", color:T.onVariant, fontWeight:600,
                        textTransform:"uppercase", marginTop:"0.25rem" }}>Posts</p>
                    </div>
                    <div style={{ textAlign:"center", cursor:"pointer" }}
                      onClick={() => setShowPeopleModal("followers")}>
                      <p style={{ fontSize:"1.1rem", fontWeight:800,
                        color:T.onSurface, lineHeight:1 }}>
                        {profile?.followers ?? 0}
                      </p>
                      <p style={{ fontSize:"0.65rem", color:T.onVariant, fontWeight:600,
                        textTransform:"uppercase", marginTop:"0.25rem" }}>Followers</p>
                    </div>
                    <div style={{ textAlign:"center", cursor:"pointer" }}
                      onClick={() => setShowPeopleModal("following")}>
                      <p style={{ fontSize:"1.1rem", fontWeight:800,
                        color:T.onSurface, lineHeight:1 }}>
                        {profile?.following ?? 0}
                      </p>
                      <p style={{ fontSize:"0.65rem", color:T.onVariant, fontWeight:600,
                        textTransform:"uppercase", marginTop:"0.25rem" }}>Following</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Follow Requests Panel (only shown when account is private) ── */}
            {privacyLoaded && isPrivate && (
              <FollowRequestsPanel
                requests={followRequests}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
              />
            )}

            {/* ── Posts ── */}
            {!loading && (
              posts.length === 0 ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  padding:"3rem 0", color:T.onVariant }}>
                  <span className="material-symbols-outlined"
                    style={{ fontSize:"2.5rem", color:"rgba(110,59,216,0.25)", marginBottom:"0.75rem" }}>
                    grid_on
                  </span>
                  <p style={{ fontWeight:700, color:T.onSurface, fontSize:"0.9rem",
                    marginBottom:"0.25rem" }}>No posts yet</p>
                  <p style={{ fontSize:"0.8rem" }}>Share your first moment</p>
                  <button onClick={() => handleNavigate("feed")}
                    style={{ marginTop:"1rem", padding:"0.5rem 1.25rem", borderRadius:"9999px",
                      border:"none", cursor:"pointer", fontSize:"0.8rem", fontWeight:700,
                      color:"white",
                      background:`linear-gradient(135deg,${T.primary},${T.primaryDim})` }}>
                    Go to Feed
                  </button>
                </div>
              ) : (
                <div>
                  <h2 style={{ fontSize:"1rem", fontWeight:800, color:T.onSurface,
                    marginBottom:"1rem" }}>My Posts</h2>
                  <div className="posts-grid">
                    {posts.map((post, i) => (
                      <div key={post.id} className="fu" style={{ animationDelay:`${i*0.02}s` }}>
                        <PostCard post={post} isOwn={true} onDelete={handleDeletePost}/>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

          </div>
        </main>

        <MobileNav/>
      </div>

      {/* Modals */}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={onProfileSaved}
        />
      )}
      {showPeopleModal && (
        <PeopleListModal
          type={showPeopleModal}
          userId={null}
          onClose={() => setShowPeopleModal(null)}
          onViewProfile={setViewingUserId}
          onCountChange={handleFollowerCountChange}
        />
      )}
    </>
  );
}