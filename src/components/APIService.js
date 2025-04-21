import axios from "axios";
const API_BASE_URL = "http://localhost:8000";

if (!API_BASE_URL) {
  throw new Error('API_BASE_URL environment variable is not set');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  
});

const userMail = localStorage.getItem("email")

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Error handling utility
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error("Response data:", error.response.data);
    console.error("Response status:", error.response.status);
    console.error("Response headers:", error.response.headers);
    
    if (error.response.status === 422) {
      return { error: "Authentication failed. Please log in again." };
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error("No response received:", error.request);
    return { error: "No response from server. Please try again later." };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error("Error setting up request:", error.message);
    return { error: "An unexpected error occurred. Please try again." };
  }
  return { error: error.message || "An unknown error occurred" };
};


export const testConnection = async () => {
  try {
    const response = await api.get("/test");
    console.log('Test connection successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Test connection failed:', error);
    throw error;
  }
};


export const login = async (credentials) => {
    try {
      const response = await api.post("/login", credentials);
      if (response.data.access_token) {
        localStorage.setItem("authToken", response.data.access_token);
      }
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  };

export const logout = async () => {
  try {
    await api.post("/logout");
    localStorage.removeItem("authToken");
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const validateToken = async () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return false;

    const response = await api.get("/validate/token"); // Add this endpoint on backend
    return response.status === 200;
  } catch (error) {
    localStorage.removeItem("authToken"); // Clear invalid token
    return false;
  }
};






export default api;