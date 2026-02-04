// frontend/src/api/vault.js

const API_BASE = 'http://localhost:8000';

export async function fetchVaultItems() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/vault/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch vault items');
  }
  
  return response.json();
}

export async function fetchVaultItem(itemId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/vault/${itemId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch vault item');
  }
  
  return response.json();
}

export async function createVaultItem(data) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/vault/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create vault item');
  }
  
  return response.json();
}

export async function updateVaultItem(itemId, data) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/vault/${itemId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update vault item');
  }
  
  return response.json();
}

export async function deleteVaultItem(itemId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/vault/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete vault item');
  }
  
  return response.json();
}

export async function fetchHealthTimeline() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/vault/health-timeline`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch health timeline');
  }
  
  return response.json();
}

// Calculate storage usage (files in vault)
export async function calculateStorageUsage() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/vault/storage`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    // Return mock data if endpoint doesn't exist yet
    return {
      used: 4.2,
      total: 10,
      percent: 42,
    };
  }
  
  return response.json();
}