// import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
// import Landing from "./pages/Landing";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import UserFeed from "./pages/UserFeed";
// import Messages from "./pages/Messages"; 
// import Profile from "./pages/Profile";
// import Search from "./pages/Search";
// import People from './pages/People';
// import "./styles/landing.css";

// // Shared navigate helper: handles ("userprofile", id) to navigate to /profile/:id, and other pages normally
// function makeNavigate(nav) {
//   return (p, id) => {
//     if (p === "userprofile" && id != null) {
//       nav(`/profile/${id}`);
//     } else {
//       nav("/" + p);
//     }
//   };
// }

// function FeedPage()     { const nav = useNavigate(); return <UserFeed  navigate={makeNavigate(nav)} />; }
// function MessagesPage() { const nav = useNavigate(); return <Messages  navigate={makeNavigate(nav)} />; }
// function ProfilePage()  { const nav = useNavigate(); return <Profile   navigate={makeNavigate(nav)} />; }
// function SearchPage()   { const nav = useNavigate(); return <Search    navigate={makeNavigate(nav)} />; }
// function PeoplePage()   { const nav = useNavigate(); return <People    navigate={makeNavigate(nav)} />; }

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/"                element={<Landing />} />
//         <Route path="/login"           element={<Login />} />
//         <Route path="/signup"          element={<Signup />} />
//         <Route path="/userfeed"        element={<FeedPage />} />
//         <Route path="/feed"            element={<FeedPage />} />
//         <Route path="/messages"        element={<MessagesPage />} />
//         <Route path="/profile"         element={<ProfilePage />} />
//         <Route path="/profile/:userId" element={<ProfilePage />} />
//         <Route path="/user/:userId"    element={<ProfilePage />} />
//         <Route path="/search"          element={<SearchPage />} />
//         <Route path="/people"          element={<PeoplePage />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

//New code to protect the app from crashing after refresh
// import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import Landing from "./pages/Landing";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import UserFeed from "./pages/UserFeed";
// import Messages from "./pages/Messages";
// import Profile from "./pages/Profile";
// import Search from "./pages/Search";
// import People from "./pages/People";
// import "./styles/landing.css";

// const BASE_URL = import.meta.env.VITE_API_URL || "https://somatesappbackend.onrender.com";

// // ── Auth check ────────────────────────────────────────────────────────────
// function useAuth() {
//   const [status, setStatus] = useState("loading");

//   useEffect(() => {
//     fetch(`${BASE_URL}/me`, { credentials: "include" })
//       .then(res => setStatus(res.ok ? "auth" : "unauth"))
//       .catch(() => setStatus("unauth"));
//   }, []);

//   return status;
// }

// // ── Loading screen ────────────────────────────────────────────────────────
// function LoadingScreen() {
//   return (
//     <div style={{
//       minHeight: "100vh",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "center",
//       background: "#f7f9fb",
//       gap: "1rem"
//     }}>
//       <div style={{
//         width: "2.5rem",
//         height: "2.5rem",
//         borderRadius: "9999px",
//         border: "3px solid #cbb6ff",
//         borderTopColor: "#6e3bd8",
//         animation: "spin 0.8s linear infinite"
//       }}/>
//       <p style={{
//         fontSize: "0.875rem",
//         color: "#596063",
//         fontWeight: 600,
//         fontFamily: "sans-serif"
//       }}>
//         Loading Somates…
//       </p>
//       <style>{`
//         @keyframes spin {
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// }

// // ── Protected route: logged-out users → /login ────────────────────────────
// function Protected({ children, authStatus }) {
//   if (authStatus === "loading") return <LoadingScreen />;
//   if (authStatus === "unauth")  return <Navigate to="/login" replace />;
//   return children;
// }

// // ── Public route: already logged-in users → /feed ─────────────────────────
// function Public({ children, authStatus }) {
//   if (authStatus === "loading") return <LoadingScreen />;
//   if (authStatus === "auth")    return <Navigate to="/feed" replace />;
//   return children;
// }

// // ── Navigate helper (your existing pattern — unchanged) ───────────────────
// function makeNavigate(nav) {
//   return (p, id) => {
//     if (p === "userprofile" && id != null) {
//       nav(`/profile/${id}`);
//     } else {
//       nav("/" + p);
//     }
//   };
// }

// // ── Page wrappers (your existing pattern — unchanged) ─────────────────────
// function FeedPage()     { const nav = useNavigate(); return <UserFeed  navigate={makeNavigate(nav)} />; }
// function MessagesPage() { const nav = useNavigate(); return <Messages  navigate={makeNavigate(nav)} />; }
// function ProfilePage()  { const nav = useNavigate(); return <Profile   navigate={makeNavigate(nav)} />; }
// function SearchPage()   { const nav = useNavigate(); return <Search    navigate={makeNavigate(nav)} />; }
// function PeoplePage()   { const nav = useNavigate(); return <People    navigate={makeNavigate(nav)} />; }

// // ── App ───────────────────────────────────────────────────────────────────
// function App() {
//   const authStatus = useAuth();

//   return (
//     <BrowserRouter>
//       <Routes>

//         {/* Public routes — already logged-in users get redirected to /feed */}
//         <Route path="/" element={
//           <Public authStatus={authStatus}>
//             <Landing />
//           </Public>
//         }/>

//         <Route path="/login" element={
//           <Public authStatus={authStatus}>
//             <Login />
//           </Public>
//         }/>

//         <Route path="/signup" element={
//           <Public authStatus={authStatus}>
//             <Signup />
//           </Public>
//         }/>

//         {/* Protected routes — logged-out users get redirected to /login */}
//         <Route path="/feed" element={
//           <Protected authStatus={authStatus}>
//             <FeedPage />
//           </Protected>
//         }/>

//         {/* Keep /userfeed working for any old links */}
//         <Route path="/userfeed" element={
//           <Navigate to="/feed" replace />
//         }/>

//         <Route path="/messages" element={
//           <Protected authStatus={authStatus}>
//             <MessagesPage />
//           </Protected>
//         }/>

//         <Route path="/profile" element={
//           <Protected authStatus={authStatus}>
//             <ProfilePage />
//           </Protected>
//         }/>

//         <Route path="/profile/:userId" element={
//           <Protected authStatus={authStatus}>
//             <ProfilePage />
//           </Protected>
//         }/>

//         <Route path="/user/:userId" element={
//           <Protected authStatus={authStatus}>
//             <ProfilePage />
//           </Protected>
//         }/>

//         <Route path="/search" element={
//           <Protected authStatus={authStatus}>
//             <SearchPage />
//           </Protected>
//         }/>

//         <Route path="/people" element={
//           <Protected authStatus={authStatus}>
//             <PeoplePage />
//           </Protected>
//         }/>

//         {/* Catch-all: unknown URLs go to feed if authed, login if not */}
//         <Route path="*" element={
//           authStatus === "loading" ? <LoadingScreen />        :
//           authStatus === "auth"    ? <Navigate to="/feed"  replace /> :
//                                      <Navigate to="/login" replace />
//         }/>

//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

//New code to handle login auth
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserFeed from "./pages/UserFeed";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import People from "./pages/People";
import "./styles/landing.css";

const BASE_URL = import.meta.env.VITE_API_URL || "https://somatesappbackend.onrender.com";

// ── Auth check ────────────────────────────────────────────────────────────
function useAuth() {
  const [status, setStatus] = useState("loading");

  // useCallback so we can pass it down and call it after login/signup
  const checkAuth = useCallback(() => {
    setStatus("loading");
    fetch(`${BASE_URL}/me`, { credentials: "include" })
      .then(res => setStatus(res.ok ? "auth" : "unauth"))
      .catch(() => setStatus("unauth"));
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  return { status, checkAuth };
}

// ── Loading screen ─────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#f7f9fb", gap: "1rem"
    }}>
      <div style={{
        width: "2.5rem", height: "2.5rem", borderRadius: "9999px",
        border: "3px solid #cbb6ff", borderTopColor: "#6e3bd8",
        animation: "spin 0.8s linear infinite"
      }}/>
      <p style={{ fontSize: "0.875rem", color: "#596063",
        fontWeight: 600, fontFamily: "sans-serif" }}>
        Loading Somates…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Route guards ───────────────────────────────────────────────────────────
function Protected({ children, authStatus }) {
  if (authStatus === "loading") return <LoadingScreen />;
  if (authStatus === "unauth")  return <Navigate to="/login" replace />;
  return children;
}

function Public({ children, authStatus }) {
  if (authStatus === "loading") return <LoadingScreen />;
  if (authStatus === "auth")    return <Navigate to="/feed" replace />;
  return children;
}

// ── Navigate helper ────────────────────────────────────────────────────────
function makeNavigate(nav) {
  return (p, id) => {
    if (p === "userprofile" && id != null) {
      nav(`/profile/${id}`);
    } else {
      nav("/" + p);
    }
  };
}

// ── Page wrappers ──────────────────────────────────────────────────────────
function FeedPage()     { const nav = useNavigate(); return <UserFeed  navigate={makeNavigate(nav)} />; }
function MessagesPage() { const nav = useNavigate(); return <Messages  navigate={makeNavigate(nav)} />; }
function ProfilePage()  { const nav = useNavigate(); return <Profile   navigate={makeNavigate(nav)} />; }
function SearchPage()   { const nav = useNavigate(); return <Search    navigate={makeNavigate(nav)} />; }
function PeoplePage()   { const nav = useNavigate(); return <People    navigate={makeNavigate(nav)} />; }

// ── App ────────────────────────────────────────────────────────────────────
function App() {
  const { status: authStatus, checkAuth } = useAuth();

  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/" element={
          <Public authStatus={authStatus}><Landing /></Public>
        }/>
        <Route path="/login" element={
          <Public authStatus={authStatus}>
            {/* Pass checkAuth so Login can refresh auth state after login */}
            <Login onLoginSuccess={checkAuth} />
          </Public>
        }/>
        <Route path="/signup" element={
          <Public authStatus={authStatus}>
            <Signup onSignupSuccess={checkAuth} />
          </Public>
        }/>

        {/* Protected routes */}
        <Route path="/feed" element={
          <Protected authStatus={authStatus}><FeedPage /></Protected>
        }/>
        <Route path="/userfeed" element={<Navigate to="/feed" replace />}/>
        <Route path="/messages" element={
          <Protected authStatus={authStatus}><MessagesPage /></Protected>
        }/>
        <Route path="/profile" element={
          <Protected authStatus={authStatus}><ProfilePage /></Protected>
        }/>
        <Route path="/profile/:userId" element={
          <Protected authStatus={authStatus}><ProfilePage /></Protected>
        }/>
        <Route path="/user/:userId" element={
          <Protected authStatus={authStatus}><ProfilePage /></Protected>
        }/>
        <Route path="/search" element={
          <Protected authStatus={authStatus}><SearchPage /></Protected>
        }/>
        <Route path="/people" element={
          <Protected authStatus={authStatus}><PeoplePage /></Protected>
        }/>

        {/* Catch-all */}
        <Route path="*" element={
          authStatus === "loading" ? <LoadingScreen />                :
          authStatus === "auth"    ? <Navigate to="/feed"  replace /> :
                                     <Navigate to="/login" replace />
        }/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
