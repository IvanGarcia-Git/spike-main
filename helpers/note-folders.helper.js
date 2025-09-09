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

export const NoteFoldersAPI = {
  getAll: async () => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        console.error('No JWT token found');
        return [];
      }
      
      const response = await authGetFetch('note-folders', jwtToken);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching folders:', error);
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
      
      const response = await authGetFetch(`note-folders/${id}`, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching folder:', error);
      return null;
    }
  },

  getByFolderId: async (folderId) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        console.error('No JWT token found');
        return null;
      }
      
      const response = await authGetFetch(`note-folders/folder/${folderId}`, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching folder by folderId:', error);
      return null;
    }
  },

  create: async (folder) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      const response = await authFetch('POST', 'note-folders', folder, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  update: async (id, folder) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      const response = await authFetch('PUT', `note-folders/${id}`, folder, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  },

  updateByFolderId: async (folderId, folder) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      const response = await authFetch('PUT', `note-folders/folder/${folderId}`, folder, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating folder by folderId:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      await authFetch('DELETE', `note-folders/${id}`, null, jwtToken);
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },

  deleteByFolderId: async (folderId) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      await authFetch('DELETE', `note-folders/folder/${folderId}`, null, jwtToken);
      return true;
    } catch (error) {
      console.error('Error deleting folder by folderId:', error);
      throw error;
    }
  },

  bulkCreate: async (folders) => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      const response = await authFetch('POST', 'note-folders/bulk', { folders }, jwtToken);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error bulk creating folders:', error);
      throw error;
    }
  },

  deleteAll: async () => {
    try {
      const jwtToken = getJwtToken();
      if (!jwtToken) {
        throw new Error('No JWT token found');
      }
      
      await authFetch('DELETE', 'note-folders', null, jwtToken);
      return true;
    } catch (error) {
      console.error('Error deleting all folders:', error);
      throw error;
    }
  }
};