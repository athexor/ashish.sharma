import axios from 'axios';

export const axiosInstance = axios.create();

const ApiService = {
  get: async (endpoint: string) => {
    const response = await axiosInstance.get(`/${endpoint}`);
    return response.data;
  },
};

export default ApiService;
