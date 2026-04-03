import { useRef, useEffect } from "react"; // ✅ Import useRef and useEffect
import { FaTwitter, FaHeart } from "react-icons/fa";
import { BsMessenger } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/landingpage.png"; // 👈 your image path


const emojis = ["💙"];


function Hero() {
   const boxRef = useRef(null);
   const navigate = useNavigate();

  useEffect(() => {
    const box = boxRef.current;
    const icons = [];

    // Create 10 floating icons
    for (let i = 0; i < 10; i++) {
      const span = document.createElement("span");
      span.innerText = emojis[Math.floor(Math.random() * emojis.length)];
      span.className = "absolute text-2xl";
      span.style.left = Math.random() * (box.offsetWidth - 30) + "px";
      span.style.top = Math.random() * (box.offsetHeight - 30) + "px";

      // Random speed and direction
      span.dataset.vx = (Math.random() - 0.5) * 2;
      span.dataset.vy = (Math.random() - 0.5) * 2;

      box.appendChild(span);
      icons.push(span);
    }

    // Animation loop
    const animate = () => {
      icons.forEach((icon) => {
        let x = parseFloat(icon.style.left);
        let y = parseFloat(icon.style.top);
        let vx = parseFloat(icon.dataset.vx);
        let vy = parseFloat(icon.dataset.vy);

        x += vx;
        y += vy;

        // Bounce off edges
        if (x <= 0 || x >= box.offsetWidth - 30) icon.dataset.vx = -vx;
        if (y <= 0 || y >= box.offsetHeight - 30) icon.dataset.vy = -vy;

        icon.style.left = x + "px";
        icon.style.top = y + "px";
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#2FA39A] flex items-center justify-center overflow-hidden">
      {/* <div className="w-full min-h-screen bg-[#eef2f6] relative overflow-hidden px-16 py-10"> */}
      <div className="w-full min-h-screen bg-[#eef2f6] relative overflow-hidden px-4 sm:px-10 md:px-16 py-6 sm:py-10">


        {/* 🔵 Background Circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* <div className="w-[1000px] h-[1000px] border border-blue-700 rounded-full opacity-30"></div>
          <div className="absolute w-[800px] h-[800px] border border-blue-500 rounded-full opacity-30"></div>
          <div className="absolute w-[600px] h-[600px] border border-blue-500 rounded-full opacity-30"></div> */}
          <div className="w-[500px] sm:w-[800px] md:w-[1000px] h-[500px] sm:h-[800px] md:h-[1000px] border border-blue-700 rounded-full opacity-30"></div>
          <div className="absolute w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] border border-blue-500 rounded-full opacity-30"></div>
          <div className="absolute w-[300px] sm:w-[450px] md:w-[600px] h-[300px] sm:h-[450px] md:h-[600px] border border-blue-500 rounded-full opacity-30"></div>
        </div>

        {/* 🔥 Navbar */}
        <div className="flex justify-between items-center relative z-10">
          <h1 className="text-blue-600 font-bold text-xl">Somates</h1>

        <div className="hidden md:flex gap-10 text-gray-600">
            <p className="cursor-pointer hover:text-black">Home</p>
            <p className="cursor-pointer hover:text-black">About us</p>
            <p className="cursor-pointer hover:text-black">Company</p>
            <p className="cursor-pointer hover:text-black">Blog</p>
          </div>

          <button onClick={() => navigate("/login")} 
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:scale-105 transition">
            Login
          </button>
        </div>

        {/* 💡 Main Content */}
        <div className="text-center mt-20 relative z-10">

          <p className="bg-blue-500 px-4 py-1 rounded-full inline-block text-sm shadow mb-4">
            Somates
          </p>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight text-gray-900">
            Where<br />
            <span className="text-blue-500">Similar Soul</span> Connects
          </h1>

          {/* 👤 Blue Box with Floating Emojis */}
          <div className="relative flex justify-center mt-12">
            {/* Blue Circle Background */}
            {/* <div className="absolute w-[320px] h-[320px] bg-blue-200 rounded-full top-6"></div> */}
            <div className="absolute w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] bg-blue-200 rounded-full top-6"></div>


            {/* Blue Box */}
            {/* <div
             ref={boxRef}
              className="relative w-96 h-96 bg-blue-400 rounded-full shadow-3xl  flex items-center justify-center overflow-hidden"
             ></div> */}
            <div ref={boxRef}className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden shadow-3xl">
              <img src={heroImg} alt="hero" className="w-full h-full object-cover rounded-full"/>
              </div>

            {/* Orange Shape */}
            {/* <div className="absolute sm:w-[120px] sm:h-[120px] md:w-[260px] md:h-[260px] bg-orange-400 rotate-45 right-[-20px] sm:right-[-40px] md:right-[-50px] top-10 sm:top-12 md:top-14 rounded-xl"></div> */}
             
          </div>
        </div>

        {/* ❤️ Likes Card */}
<div className="absolute left-2 sm:left-6 md:left-12 lg:left-18 top-[60%] sm:top-[55%] md:top-[50%] 
bg-white px-2 py-2 sm:px-4 sm:py-2.5 md:px-3 md:py-3 
rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 z-10 animate-bounce">

  <div className="bg-red-500 text-white p-1.5 sm:p-2 rounded-full text-xs sm:text-sm md:text-base">
    <FaHeart />
  </div>

  <div>
    <p className="font-bold text-[10px] sm:text-xs md:text-sm">Like</p>
    <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 hidden sm:block">
      LIKE LOVE CONNECT
    </p>
  </div>
</div>


{/* 🟡 Yellow Card */}
<div className="absolute right-2 sm:right-6 md:right-12 lg:right-20 
bottom-10 sm:bottom-16 md:bottom-20 
bg-white px-2 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 
rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 z-10 animate-pulse">

  <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full"></div>

  <div>
    <div className="w-12 sm:w-20 md:w-28 h-1.5 sm:h-2 bg-yellow-300 rounded mb-1 sm:mb-2"></div>
    <div className="w-10 sm:w-16 md:w-20 h-1.5 sm:h-2 bg-yellow-200 rounded"></div>
  </div>
</div>


{/* 🐦 Twitter */}
<div className="absolute left-3 sm:left-10 md:left-20 lg:left-32 
top-[30%] sm:top-[32%] md:top-[20%] 
text-xl sm:text-2xl md:text-3xl lg:text-4xl 
text-blue-500 animate-bounce z-10">
  <FaTwitter />
</div>


{/* 💬 Messenger */}
<div className="absolute right-3 sm:right-10 md:right-20 lg:right-32 
top-[28%] sm:top-[30%] md:top-[20%] 
text-xl sm:text-2xl md:text-3xl 
text-blue-600 animate-pulse z-10">
  <BsMessenger />
</div>


{/* 😍 Emoji */}
<div className="absolute right-4 sm:right-14 md:right-24 lg:right-30 
top-[45%] sm:top-[48%] md:top-[50%] 
text-xl sm:text-2xl md:text-4xl lg:text-5xl 
animate-bounce z-10">
  😍
</div>


{/* 👍 Thumbs */}
<div className="absolute left-4 sm:left-14 md:left-24 lg:left-56 lg:top-[85%]
bottom-[22%] sm:bottom-[26%] md:bottom-[30%] 
text-xl sm:text-2xl md:text-3xl lg:text-4xl 
animate-pulse z-10">
  👍
</div>


      </div>
    </div>
  );
}

export default Hero;

