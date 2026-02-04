// frontend/src/api/vault.js

const API_BASE = 'http://localhost:8000';

// Helper to get token
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchVaultItems() {
  try {
    const response = await fetch(`${API_BASE}/vault/`, {
      headers: getAuthHeaders(),
    });
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vault items: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Vault fetch error:', error);
    throw error;
  }
}

export async function fetchVaultItem(itemId) {
  try {
    const response = await fetch(`${API_BASE}/vault/${itemId}`, {
      headers: getAuthHeaders(),
    });
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vault item: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Vault item fetch error:', error);
    throw error;
  }
}

export async function createVaultItem(data) {
  try {
    const response = await fetch(`${API_BASE}/vault/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vault create error response:', errorText);
      throw new Error(`Failed to create vault item: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Vault create error:', error);
    throw error;
  }
}

export async function updateVaultItem(itemId, data) {
  try {
    const response = await fetch(`${API_BASE}/vault/${itemId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to update vault item: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Vault update error:', error);
    throw error;
  }
}

export async function deleteVaultItem(itemId) {
  try {
    const response = await fetch(`${API_BASE}/vault/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to delete vault item: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Vault delete error:', error);
    throw error;
  }
}

export async function fetchHealthTimeline() {
  try {
    const response = await fetch(`${API_BASE}/vault/health-timeline`, {
      headers: getAuthHeaders(),
    });
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch health timeline: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Health timeline fetch error:', error);
    throw error;
  }
}