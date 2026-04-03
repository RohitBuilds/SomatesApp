import axios from "axios";
const BASE_URL = "http://localhost:8000";

export const loginUser = async (email, password) => {
  console.log("Sending login:", email, password); // debug

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // ✅ important to store session cookie
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("ERROR RESPONSE:", data);

      // If FastAPI returns validation errors array
      if (data.detail && Array.isArray(data.detail)) {
        throw data.detail[0].msg;
      }

      throw data.detail || "Login failed";
    }

    return data; // { message: "Login successful" }
  } catch (err) {
    console.error("Login error:", err);
    throw typeof err === "string" ? err : "Login failed";
  }
};

export const fetchWithSession = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include", // ✅ important for session auth
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw data.detail || "Request failed";
    }

    return data;
  } catch (err) {
    console.error("Fetch error:", err);
    throw err;
  }
};


export const signupUser = async (name, email, password, phoneNum) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/signup`,
      {
        name: name,
        email: email,
        password: password,
        phoneNum: phoneNum, // ✅ MUST MATCH BACKEND
      },
      { withCredentials: true }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || { detail: "Signup failed" };
  }
};
