import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Detection API endpoints
export const detectionAPI = {
  predictDisease: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/detection/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Disease prediction error:', error);
      throw error;
    }
  },

  getDetections: async () => {
    try {
      const response = await apiClient.get('/detection');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch detections:', error);
      throw error;
    }
  },

  getDetectionById: async (id) => {
    try {
      const response = await apiClient.get(`/detection/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch detection ${id}:`, error);
      throw error;
    }
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await axios.get('http://localhost:5000/health');
    return response.status === 200;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

export default apiClient;
