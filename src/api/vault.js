const API_BASE = 'http://localhost:8000';

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

// ✅ GET ALL VAULT ITEMS
export async function fetchVaultItems() {
  try {
    const response = await fetch(`${API_BASE}/vault/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch vault items: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Vault API Error:', error);
    throw error;
  }
}

// ✅ GET SINGLE VAULT ITEM BY ID
export async function fetchVaultItemById(id) {
  try {
    const response = await fetch(`${API_BASE}/vault/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Item not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch vault item: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Vault API Error:', error);
    throw error;
  }
}

// ✅ CREATE VAULT ITEM
export async function createVaultItem(itemData) {
  try {
    const response = await fetch(`${API_BASE}/vault/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to create vault item: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Vault API Error:', error);
    throw error;
  }
}

// ✅ UPDATE VAULT ITEM
export async function updateVaultItem(id, updates) {
  try {
    const response = await fetch(`${API_BASE}/vault/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Item not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to update vault item: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Vault API Error:', error);
    throw error;
  }
}

// ✅ DELETE VAULT ITEM
export async function deleteVaultItem(id) {
  try {
    const response = await fetch(`${API_BASE}/vault/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Item not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to delete vault item: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Vault API Error:', error);
    throw error;
  }
}

// ✅ GET HEALTH TIMELINE
export async function fetchHealthTimeline() {
  try {
    const response = await fetch(`${API_BASE}/vault/health-timeline`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch health timeline: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Vault API Error:', error);
    throw error;
  }
}