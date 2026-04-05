// import { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { signupUser } from "../api/auth"; // Your backend signup API
// import { BsPhone } from "react-icons/bs";

// function Signup() {
//   const navigate = useNavigate();
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [phoneNum, setPhoneNum] = useState("");
//   const [error, setError] = useState("");
//   const animationRef = useRef(null);

//   // Animated floating balls
//   useEffect(() => {
//     const container = animationRef.current;
//     const balls = [];

//     for (let i = 0; i < 20; i++) {
//       const div = document.createElement("div");
//       const size = 30 + Math.random() * 40; // random size
//       div.className =
//         "absolute bg-blue-400 opacity-60 rounded-full shadow-lg";
//       div.style.width = `${size}px`;
//       div.style.height = `${size}px`;
//       div.style.left = `${Math.random() * (container.offsetWidth - size)}px`;
//       div.style.top = `${Math.random() * (container.offsetHeight - size)}px`;
//       div.dataset.vx = (Math.random() - 0.5) * 1.5;
//       div.dataset.vy = 0.2 + Math.random() * 0.5; // falling speed
//       container.appendChild(div);
//       balls.push(div);
//     }

//     const animate = () => {
//       balls.forEach((ball) => {
//         let x = parseFloat(ball.style.left);
//         let y = parseFloat(ball.style.top);
//         let vx = parseFloat(ball.dataset.vx);
//         let vy = parseFloat(ball.dataset.vy);

//         x += vx;
//         y += vy;

//         // wrap around top
//         if (y > container.offsetHeight) y = -50;

//         // bounce left/right
//         if (x <= 0 || x >= container.offsetWidth - ball.offsetWidth) ball.dataset.vx = -vx;

//         ball.style.left = x + "px";
//         ball.style.top = y + "px";
//       });
//       requestAnimationFrame(animate);
//     };

//     animate();
//   }, []);

//   const handleSignup = async () => {
//     try {
//       const data = await signupUser(name, email, password,phoneNum);
//       console.log("Signup success:", data);
//       navigate("/login"); // After signup, redirect to login
//     } catch (err) {
//       setError(err.detail || "Signup failed. Try again.");
//     }
//   };

//   return (
//     <div className="relative w-screen h-screen bg-[#eef2f6] overflow-hidden flex items-center justify-center">

//       {/* Animated background container */}
//       <div
//         ref={animationRef}
//         className="absolute inset-0 w-full h-full"
//       ></div>

//       {/* Large landing-style circles behind form */}
//       <div className="absolute w-[1000px] h-[1000px] border border-blue-700 rounded-full opacity-30 -top-96 -left-64"></div>
//       <div className="absolute w-[800px] h-[800px] border border-blue-500 rounded-full opacity-30 -bottom-96 -right-48"></div>
//       <div className="absolute w-[600px] h-[600px] border border-blue-500 rounded-full opacity-30 top-40 right-20"></div>

//       {/* Signup form centered */}
//         <div className="relative z-10 w-[90%] sm:w-[400px] p-6 sm:p-10 bg-white rounded-3xl shadow-2xl flex flex-col gap-6">
//         <h2 className="text-3xl font-bold text-blue-600 text-center mb-4">Signup</h2>
//         {error && <p className="text-red-500 text-center">{error}</p>}

//         <input
//           type="text"
//           placeholder="Full Name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />

//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="border  border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />

//         <input
//         type="tel"
//         placeholder="Phone Number"
//         value={phoneNum}
//         onChange={(e) => setPhoneNum(e.target.value)}
//         className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />


//         <button
//           onClick={handleSignup}
//           className="bg-blue-500 text-white py-3 rounded-full hover:scale-105 transition"
//         >
//           Signup
//         </button>

//         <p className="text-sm text-gray-500 text-center">
//           Already have an account?{" "}
//           <span
//             className="text-blue-500 cursor-pointer hover:underline"
//             onClick={() => navigate("/login")}
//           >
//             Login
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// }

// export default Signup;


//New code
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, loginUser } from "../api/auth";
import { BsPhone } from "react-icons/bs";

function Signup({ onSignupSuccess }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const animationRef = useRef(null);

  // Animated floating balls — unchanged
  useEffect(() => {
    const container = animationRef.current;
    if (!container) return;
    const balls = [];

    for (let i = 0; i < 20; i++) {
      const div = document.createElement("div");
      const size = 30 + Math.random() * 40;
      div.className = "absolute bg-blue-400 opacity-60 rounded-full shadow-lg";
      div.style.width = `${size}px`;
      div.style.height = `${size}px`;
      div.style.left = `${Math.random() * (container.offsetWidth - size)}px`;
      div.style.top = `${Math.random() * (container.offsetHeight - size)}px`;
      div.dataset.vx = (Math.random() - 0.5) * 1.5;
      div.dataset.vy = 0.2 + Math.random() * 0.5;
      container.appendChild(div);
      balls.push(div);
    }

    const animate = () => {
      balls.forEach((ball) => {
        let x = parseFloat(ball.style.left);
        let y = parseFloat(ball.style.top);
        let vx = parseFloat(ball.dataset.vx);
        let vy = parseFloat(ball.dataset.vy);
        x += vx;
        y += vy;
        if (y > container.offsetHeight) y = -50;
        if (x <= 0 || x >= container.offsetWidth - ball.offsetWidth)
          ball.dataset.vx = -vx;
        ball.style.left = x + "px";
        ball.style.top = y + "px";
      });
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const handleSignup = async () => {
    if (loading) return;

    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Create account
      const data = await signupUser(name, email, password, phoneNum);
      console.log("Signup success:", data);

      // Step 2: Auto-login after signup so user goes straight to feed
      await loginUser(email, password);
      console.log("Auto-login after signup success");

      // ── KEY FIX: re-check auth state in App.jsx BEFORE navigating ──
      if (onSignupSuccess) await onSignupSuccess();

      navigate("/feed");
    } catch (err) {
      console.log("Signup/login error:", err);
      setError(
        typeof err === "string"
          ? err
          : err?.detail || "Signup failed. Try again."
      );
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSignup();
  };

  return (
    <div className="relative w-screen h-screen bg-[#eef2f6] overflow-hidden flex items-center justify-center">

      {/* Animated background */}
      <div ref={animationRef} className="absolute inset-0 w-full h-full" />

      {/* Decorative circles */}
      <div className="absolute w-[1000px] h-[1000px] border border-blue-700 rounded-full opacity-30 -top-96 -left-64" />
      <div className="absolute w-[800px] h-[800px] border border-blue-500 rounded-full opacity-30 -bottom-96 -right-48" />
      <div className="absolute w-[600px] h-[600px] border border-blue-500 rounded-full opacity-30 top-40 right-20" />

      {/* Signup form */}
      <div className="relative z-10 w-[90%] sm:w-[400px] p-6 sm:p-10 bg-white rounded-3xl shadow-2xl flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-4">
          Signup
        </h2>

        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={phoneNum}
          onChange={(e) => setPhoneNum(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="bg-blue-500 text-white py-3 rounded-full hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Creating account…
            </span>
          ) : "Signup"}
        </button>

        <p className="text-sm text-gray-500 text-center">
          Already have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
