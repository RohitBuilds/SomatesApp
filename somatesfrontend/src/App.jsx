import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserFeed from "./pages/UserFeed";
import Messages from "./pages/Messages"; 
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import People from './pages/People';
import "./styles/landing.css";

// Shared navigate helper: handles ("userprofile", id) to navigate to /profile/:id, and other pages normally
function makeNavigate(nav) {
  return (p, id) => {
    if (p === "userprofile" && id != null) {
      nav(`/profile/${id}`);
    } else {
      nav("/" + p);
    }
  };
}

function FeedPage()     { const nav = useNavigate(); return <UserFeed  navigate={makeNavigate(nav)} />; }
function MessagesPage() { const nav = useNavigate(); return <Messages  navigate={makeNavigate(nav)} />; }
function ProfilePage()  { const nav = useNavigate(); return <Profile   navigate={makeNavigate(nav)} />; }
function SearchPage()   { const nav = useNavigate(); return <Search    navigate={makeNavigate(nav)} />; }
function PeoplePage()   { const nav = useNavigate(); return <People    navigate={makeNavigate(nav)} />; }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Landing />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/userfeed"        element={<FeedPage />} />
        <Route path="/feed"            element={<FeedPage />} />
        <Route path="/messages"        element={<MessagesPage />} />
        <Route path="/profile"         element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/user/:userId"    element={<ProfilePage />} />
        <Route path="/search"          element={<SearchPage />} />
        <Route path="/people"          element={<PeoplePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;