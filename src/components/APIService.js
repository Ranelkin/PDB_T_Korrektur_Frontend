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
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `feedback_${exerciseType}.zip`;
    
    if (contentDisposition) {
      // Parse filename from header
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a short delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Download error:', error);
    if (error.response?.status === 404) {
      return { error: "No feedback files available for download" };
    }
    return handleApiError(error);
  }
};

export const uploadSubmissions = async (exerciseType, file) => {
  if (!exerciseType) throw new Error('Exercise type is required');
  if (!file || !(file instanceof File)) throw new Error('A valid file is required');

  console.log('Submitting file:', {
    name: file.name,
    size: `${(file.size / 1024).toFixed(2)} KB`,
    type: file.type,
    isFile: file instanceof File
  });

  if (!file.name.toLowerCase().endsWith('.zip')) {
    throw new Error('Only ZIP files are allowed');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('exercise_type', exerciseType);

  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value instanceof File ? `${value.name} (${(value.size / 1024).toFixed(2)} KB)` : value);
  }

  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('Please log in to submit files');

  try {
    const response = await api.post('/exercises/submit', formData, {
      headers: { 'Authorization': `Bearer ${token}` }
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
      availableGradedFiles,
      hasGradedResults: response.data.has_graded_results || false,
      finalGradedZip: response.data.final_graded_zip || null
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
    return null;
  }

  const encodedToken = encodeURIComponent(token);
  const wsUrl = `ws://localhost:8000/ws/depict-corrected-files?exercise_type=${exerciseType}&token=${encodedToken}`;
  
  const ws = new WebSocket(wsUrl);
  
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.close();
      onError(new Error('WebSocket connection timeout'));
    }
  }, 10000); 

  ws.onopen = () => {
    clearTimeout(connectionTimeout);
    console.log('WebSocket connected for depict-corrected-files');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.error) {
        console.error('Server error:', data.error);
        onError(new Error(data.error));
      } else if (data.available_files) {
        console.log(`Received ${data.available_files.length} files`);
        onFilesReceived(data.available_files);
      } else {
        console.warn('Unexpected message format:', data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      onError(new Error('Failed to parse server response'));
    }
  };

  ws.onerror = (error) => {
    clearTimeout(connectionTimeout);
    console.error('WebSocket error:', error);
    
    if (ws.readyState === WebSocket.CLOSED) {
      onError(new Error('Failed to connect to server. Please check your authentication.'));
    } else {
      onError(new Error('WebSocket connection error'));
    }
  };

  ws.onclose = (event) => {
    clearTimeout(connectionTimeout);
    console.log('WebSocket closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    // Close codes handling 
    if (event.code === 1008) {
      // Policy violation - likely authentication failed
      onError(new Error('Authentication failed. Please log in again.'));
    } else if (event.code === 1006) {
      // Abnormal closure
      onError(new Error('Connection lost unexpectedly'));
    }
  };

  //Cleanup 
  return () => {
    clearTimeout(connectionTimeout);
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close(1000, 'Client closing connection');
    }
  };
};

export const registerUser = async (username, password, role) => {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('role', role);
    
    const response = await api.post("/register/user", formData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const refreshToken = async (refreshTokenValue) => {
  try {
    const formData = new FormData();
    formData.append('refresh_token', refreshTokenValue);
    
    const response = await api.post("/refresh", formData);
    if (response.data.access_token) {
      localStorage.setItem("authToken", response.data.access_token);
    }
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export default api;