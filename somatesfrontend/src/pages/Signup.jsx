import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../api/auth"; // Your backend signup API
import { BsPhone } from "react-icons/bs";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [error, setError] = useState("");
  const animationRef = useRef(null);

  // Animated floating balls
  useEffect(() => {
    const container = animationRef.current;
    const balls = [];

    for (let i = 0; i < 20; i++) {
      const div = document.createElement("div");
      const size = 30 + Math.random() * 40; // random size
      div.className =
        "absolute bg-blue-400 opacity-60 rounded-full shadow-lg";
      div.style.width = `${size}px`;
      div.style.height = `${size}px`;
      div.style.left = `${Math.random() * (container.offsetWidth - size)}px`;
      div.style.top = `${Math.random() * (container.offsetHeight - size)}px`;
      div.dataset.vx = (Math.random() - 0.5) * 1.5;
      div.dataset.vy = 0.2 + Math.random() * 0.5; // falling speed
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

        // wrap around top
        if (y > container.offsetHeight) y = -50;

        // bounce left/right
        if (x <= 0 || x >= container.offsetWidth - ball.offsetWidth) ball.dataset.vx = -vx;

        ball.style.left = x + "px";
        ball.style.top = y + "px";
      });
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const handleSignup = async () => {
    try {
      const data = await signupUser(name, email, password,phoneNum);
      console.log("Signup success:", data);
      navigate("/login"); // After signup, redirect to login
    } catch (err) {
      setError(err.detail || "Signup failed. Try again.");
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#eef2f6] overflow-hidden flex items-center justify-center">

      {/* Animated background container */}
      <div
        ref={animationRef}
        className="absolute inset-0 w-full h-full"
      ></div>

      {/* Large landing-style circles behind form */}
      <div className="absolute w-[1000px] h-[1000px] border border-blue-700 rounded-full opacity-30 -top-96 -left-64"></div>
      <div className="absolute w-[800px] h-[800px] border border-blue-500 rounded-full opacity-30 -bottom-96 -right-48"></div>
      <div className="absolute w-[600px] h-[600px] border border-blue-500 rounded-full opacity-30 top-40 right-20"></div>

      {/* Signup form centered */}
        <div className="relative z-10 w-[90%] sm:w-[400px] p-6 sm:p-10 bg-white rounded-3xl shadow-2xl flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-4">Signup</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border  border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
        type="tel"
        placeholder="Phone Number"
        value={phoneNum}
        onChange={(e) => setPhoneNum(e.target.value)}
        className="border border-gray-300 text-black rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />


        <button
          onClick={handleSignup}
          className="bg-blue-500 text-white py-3 rounded-full hover:scale-105 transition"
        >
          Signup
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

