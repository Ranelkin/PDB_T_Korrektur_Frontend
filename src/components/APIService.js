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

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (refreshTokenValue) {
        try {
          const response = await refreshToken(refreshTokenValue); // Fixed: Call the exported function
          if (!response.error) {
            const originalRequest = error.config;
            originalRequest.headers['Authorization'] = `Bearer ${response.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
        }
      }
    }
    return Promise.reject(error);
  }
);

const handleApiError = (error) => {
  if (error.response) {
    console.error("Response data:", error.response.data);
    console.error("Response status:", error.response.status);
    console.error("Response headers:", error.response.headers);
    if (error.response.status === 401) {
      return { error: "Authentication failed. Please log in again." };
    } else if (error.response.status === 422) {
      return { error: "Invalid request format. Please check your input." };
    }
    return { error: error.response.data.detail || "An error occurred" };
  } else if (error.request) {
    console.error("No response received:", error.request);
    return { error: "No response from server. Please try again later." };
  } else {
    console.error("Error setting up request:", error.message);
    return { error: "An unexpected error occurred. Please try again." };
  }
};

export const login = async (credentials) => {
  try {
    const response = await api.post("/login", credentials);
    if (response.data.access_token) {
      localStorage.setItem("authToken", response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem("refreshToken", response.data.refresh_token);
      }
    }
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const verifyToken = async () => {
  try {
    const response = await api.get("/verify-token");
    return response.data;
  } catch (error) {
    localStorage.removeItem("authToken");
    return handleApiError(error);
  }
};

export const getGradedExercises = async (type) => {
  try {
    const response = await api.get("/exercises/graded", {
      params: { type }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const downloadFile = async (filename, type) => {
  try {
    const response = await api.get("/exercises/download", {
      params: { filename, type },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    return handleApiError(error);
  }
};

export const uploadSubmissions = async (exerciseType, files) => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('exercise_type', exerciseType);

    const response = await api.post('/exercises/submit', formData);
    const { results } = response.data;

    if (!results || results.length === 0) {
      console.error('No results in response');
      return response.data;
    }

    const hasSuccessfulFiles = results.some(result => result.status === 'success' && result.feedback_file);
    results.forEach(result => {
      if (result.status === 'success' && result.feedback_file) {
        console.log(`File ${result.filename} processed: ${result.message}`);
        console.log(`Feedback file: ${result.feedback_file}`);
      } else {
        console.error(`Error with ${result.filename}: ${result.message || 'No feedback file available'}`);
      }
    });

    if (hasSuccessfulFiles) {
      const downloadResponse = await api.get(`/exercises/download?exercise_type=${exerciseType}`, {
        responseType: 'blob'
      });
      const zipFilename = downloadResponse.headers['content-disposition']
        ? downloadResponse.headers['content-disposition'].match(/filename="(.+)"/)?.[1]
        : 'feedback.zip';
      const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', zipFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`Downloaded ZIP archive: ${zipFilename}`);
    } else {
      console.error('No successful files to download');
    }

    return response.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    return handleApiError(error);
  }
};

export const registerUser = async (username, password, role) => {
  try {
    const response = await api.post("/register/user", { username, password, role });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.post("/refresh", { refresh_token: refreshToken });
    if (response.data.access_token) {
      localStorage.setItem("authToken", response.data.access_token);
    }
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export default api;