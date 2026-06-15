import ApiService from './apiService';
import { mockContactData } from '../data/mockContactData';

export interface ContactData {
  github: string;
  linkedin: string;
  email: string;
  resume: string;
}

class ContactService {
  static async getContactLinks(): Promise<ContactData> {
    try {
      const response = await ApiService.get('contact');
      return response;
    } catch (error) {
      console.error('Failed to fetch contact links:', error);
      return mockContactData;
    }
  }
}

export default ContactService;
