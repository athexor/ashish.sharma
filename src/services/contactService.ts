import ApiService from './apiService';
import { mockContactData } from '../data/mockContactData';
import { config } from '../config/env';

class ContactService {
  static async getContactLinks() {
    if (!config.backendUrl) {
      return mockContactData;
    }
    try {
      return await ApiService.get('contact');
    } catch (error) {
      console.error('Failed to fetch contact links, falling back to mock:', error);
      return mockContactData;
    }
  }
}

export default ContactService;