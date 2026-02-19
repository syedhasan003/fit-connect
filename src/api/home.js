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

export async function fetchHomeOverview() {
  try {
    const response = await fetch(`${API_BASE}/home`, {  // ← REMOVED TRAILING SLASH
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch home overview: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Home API Error:', error);
    throw error;
  }
}