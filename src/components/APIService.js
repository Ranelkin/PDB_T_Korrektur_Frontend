import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

if (!API_BASE_URL) {
  throw new Error('API_BASE_URL environment variable is not set');
}

const api = axios.create({
  baseURL: API_BASE_URL,
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
          const response = await refreshToken(refreshTokenValue);
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

export const downloadFile = async (exerciseType) => {
  try {
    const response = await api.get("/exercises/download", {
      params: { exercise_type: exerciseType },
      responseType: 'blob'
    });
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `feedback_${exerciseType}.zip`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, filename };
  } catch (error) {
    return handleApiError(error);
  }
};

export const uploadSubmissions = async (exerciseType, files) => {
  if (!exerciseType) {
    console.error('No exercise type provided');
    throw new Error('Exercise type is required');
  }
  if (!files || files.length === 0) {
    console.error('No files provided');
    throw new Error('At least one file is required');
  }

  console.log('Submitting files:', files.map(f => ({
    name: f.name,
    size: `${(f.size / 1024).toFixed(2)} KB`,
    type: f.type,
    isFile: f instanceof File
  })));

  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('exercise_type', exerciseType);

  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value instanceof File ? `${value.name} (${(value.size / 1024).toFixed(2)} KB)` : value);
  }

  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('No authentication token found in localStorage');
    throw new Error('Please log in to submit files');
  }

  try {
    const response = await api.post('/exercises/submit', formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Upload response:', response.data);
    const feedbackFiles = response.data.results
      .filter(result => result.status === 'success' && result.feedback_file)
      .map(result => ({
        filename: result.feedback_file,
        status: result.status,
        grading: result.grading,
        message: result.message
      }));
    const availableGradedFiles = response.data.available_graded_files || [];
    return {
      ...response.data,
      feedbackFiles,
      availableGradedFiles
    };
  } catch (error) {
    console.error('Error uploading files:', error);
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to upload files';
    throw new Error(Array.isArray(errorMessage) ? JSON.stringify(errorMessage) : errorMessage);
  }
};

export const connectToDepictFiles = (exerciseType, onFilesReceived, onError) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('No authentication token found');
    onError(new Error('Please log in to connect to WebSocket'));
    return;
  }

  const ws = new WebSocket(`ws://localhost:8000/ws/depict-corrected-files?exercise_type=${exerciseType}&token=${token}`);
  
  ws.onopen = () => {
    console.log('WebSocket connected for depict-corrected-files');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.error) {
        onError(new Error(data.error));
      } else {
        onFilesReceived(data.available_files);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      onError(error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError(error);
  };

  ws.onclose = () => {
    console.log('WebSocket closed');
  };

  return () => ws.close();
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