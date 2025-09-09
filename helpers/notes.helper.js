import { authFetch, authGetFetch } from './server-fetch.helper';

const getJwtToken = () => {
  if (typeof window !== 'undefined') {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('factura-token='));
    
    if (cookieValue) {
      return cookieValue.split('=')[1];
    }
  }
  return null;
};

export const NotesAPI = {
  getAll: async () => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        console.error('No JWT token found');
        return [];
      }
      
      const response = await authGetFetch('notes', jwtToken);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        console.error('No JWT token found');
        return null;
      }
      
      const response = await authGetFetch(`notes/${id}`, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  },

  create: async (note) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      const response = await authFetch('POST', 'notes', note, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  update: async (id, note) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      const response = await authFetch('PUT', `notes/${id}`, note, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      await authFetch('DELETE', `notes/${id}`, null, jwtToken);
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  bulkCreate: async (notes) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      const response = await authFetch('POST', 'notes/bulk', { notes }, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error bulk creating notes:', error);
      throw error;
    }
  },

  deleteAll: async () => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      await authFetch('DELETE', 'notes', null, jwtToken);
      return true;
    } catch (error) {
      console.error('Error deleting all notes:', error);
      throw error;
    }
  }
};