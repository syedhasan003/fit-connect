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

// ✅ GET CURRENT USER
export async function getCurrentUser() {
  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('User API Error:', error);
    throw error;
  }
}

// ✅ SET ACTIVE WORKOUT PROGRAM
export async function setActiveWorkoutProgram(workoutId) {
  try {
    const response = await fetch(`${API_BASE}/users/active-workout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ workout_id: workoutId }),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Workout not found or does not belong to you');
    }

    if (!response.ok) {
      throw new Error(`Failed to set active workout: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('User API Error:', error);
    throw error;
  }
}

// ✅ SET ACTIVE DIET PLAN
export async function setActiveDietPlan(dietPlanId) {
  try {
    const response = await fetch(`${API_BASE}/users/active-diet`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ diet_plan_id: dietPlanId }),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Diet plan not found or does not belong to you');
    }

    if (!response.ok) {
      throw new Error(`Failed to set active diet plan: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('User API Error:', error);
    throw error;
  }
}

// ✅ CLEAR ACTIVE WORKOUT PROGRAM
export async function clearActiveWorkoutProgram() {
  try {
    const response = await fetch(`${API_BASE}/users/active-workout`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to clear active workout: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('User API Error:', error);
    throw error;
  }
}

// ✅ CLEAR ACTIVE DIET PLAN
export async function clearActiveDietPlan() {
  try {
    const response = await fetch(`${API_BASE}/users/active-diet`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to clear active diet plan: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('User API Error:', error);
    throw error;
  }
}

// ✅ SELECT GYM
export async function selectGym(gymId) {
  try {
    const response = await fetch(`${API_BASE}/users/select-gym?gym_id=${gymId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Gym not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to select gym: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('User API Error:', error);
    throw error;
  }
}

// ✅ GET MY GYM
export async function getMyGym() {
  try {
    const response = await fetch(`${API_BASE}/users/my-gym`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('No gym selected');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch gym data: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('User API Error:', error);
    throw error;
  }
}

// ✅ GET USER PROFILE (alias for getCurrentUser)
export async function getUserProfile() {
  return getCurrentUser();
}