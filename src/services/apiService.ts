import axios from 'axios';
import { config } from '../config/env';

export const axiosInstance = axios.create({
  baseURL: config.backendUrl,
});

const ApiService = {
  get: async (endpoint: string) => {
    const response = await axiosInstance.get(`/${endpoint}`);
    return response.data;
  },
};

export default ApiService;