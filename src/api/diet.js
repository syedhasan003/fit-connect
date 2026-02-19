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

// ✅ SEARCH FOODS
export async function searchFoods(query, limit = 20) {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await fetch(`${API_BASE}/api/diet/foods/search?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to search foods: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Diet API Error:', error);
    throw error;
  }
}

// ✅ CREATE DIET PLAN
export async function createDietPlan(planData) {
  try {
    const response = await fetch(`${API_BASE}/api/diet/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to create diet plan: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Diet API Error:', error);
    throw error;
  }
}

// ✅ UPDATE DIET PLAN
export async function updateDietPlan(planId, updates) {
  try {
    const response = await fetch(`${API_BASE}/api/diet/plans/${planId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Diet plan not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to update diet plan: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Diet API Error:', error);
    throw error;
  }
}

// ✅ GET MY DIET PLANS
export async function getMyDietPlans() {
  try {
    const response = await fetch(`${API_BASE}/api/diet/plans`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch diet plans: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Diet API Error:', error);
    throw error;
  }
}

// ✅ GET DIET PLAN BY ID
export async function getDietPlanById(planId) {
  try {
    const response = await fetch(`${API_BASE}/api/diet/plans/${planId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Diet plan not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch diet plan: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Diet API Error:', error);
    throw error;
  }
}

// ✅ DELETE DIET PLAN
export async function deleteDietPlan(planId) {
  try {
    const response = await fetch(`${API_BASE}/api/diet/plans/${planId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Diet plan not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to delete diet plan: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Diet API Error:', error);
    throw error;
  }
}

// ✅ LOG MEAL
export async function logMeal(mealData) {
  try {
    const response = await fetch(`${API_BASE}/api/diet/logs/meal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(mealData),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to log meal: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Diet API Error:', error);
    throw error;
  }
}

// ✅ GET TODAY'S MEALS
export async function getTodaysMeals() {
  try {
    const response = await fetch(`${API_BASE}/api/diet/logs/today`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch today's meals: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Diet API Error:', error);
    throw error;
  }
}