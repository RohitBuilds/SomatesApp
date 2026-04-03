import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const animationRef = useRef(null);

  // Animated floating balls
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
        if (x <= 0 || x >= container.offsetWidth - ball.offsetWidth) ball.dataset.vx = -vx;

        ball.style.left = x + "px";
        ball.style.top = y + "px";
      });
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const handleLogin = async () => {
    try {
      await loginUser(email, password); // ✅ await login
      console.log("Login success");

      navigate("/userfeed"); // navigate after successful login
    } catch (err) {
      console.log("Login failed:", err);
      setError(typeof err === "string" ? err : "Login failed");
      setTimeout(() => navigate("/signup"), 1500);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#eef2f6] overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div ref={animationRef} className="absolute inset-0 w-full h-full"></div>

      {/* Large decorative circles */}
      {/* <div className="absolute w-[1000px] h-[1000px] border border-blue-700 rounded-full opacity-30 -top-96 -left-64"></div>
      <div className="absolute w-[800px] h-[800px] border border-blue-500 rounded-full opacity-30 -bottom-96 -right-48"></div>
      <div className="absolute w-[600px] h-[600px] border border-blue-500 rounded-full opacity-30 top-40 right-20"></div> */}
      <div className="absolute w-[600px] sm:w-[1000px] h-[600px] sm:h-[1000px] border border-blue-700 rounded-full opacity-30 -top-64 sm:-top-96 -left-40 sm:-left-64"></div>
       <div className="absolute w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] border border-blue-500 rounded-full opacity-30 -bottom-64 sm:-bottom-96 -right-32 sm:-right-48"></div>
       <div className="absolute w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] border border-blue-500 rounded-full opacity-30 top-20 sm:top-40 right-10 sm:right-20"></div>

      {/* Login form */}
      {/* <div className="relative z-10 w-[400px] p-10 bg-white rounded-3xl shadow-2xl flex flex-col gap-6"> */}

      <div className="relative z-10 w-[90%] sm:w-[400px] p-6 sm:p-10 bg-white rounded-3xl shadow-2xl flex flex-col gap-6">

        <h2 className="text-3xl font-bold text-blue-600 text-center mb-4">Login</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white py-3 rounded-full hover:scale-105 transition"
        >
          Login
        </button>

        <p className="text-sm text-gray-500 text-center">
          Don't have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
