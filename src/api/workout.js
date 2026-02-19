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

// ✅ START WORKOUT SESSION
export async function startWorkoutSession(programId, dayNumber) {
  try {
    const response = await fetch(`${API_BASE}/api/workouts/sessions/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        program_id: programId,
        day_number: dayNumber,
      }),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to start workout session: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Workout API Error:', error);
    throw error;
  }
}

// ✅ GET ACTIVE SESSION
export async function getActiveSession() {
  try {
    const response = await fetch(`${API_BASE}/api/workouts/sessions/active`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      return null; // No active session
    }

    if (!response.ok) {
      throw new Error(`Failed to get active session: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Workout API Error:', error);
    throw error;
  }
}

// ✅ LOG EXERCISE SET
export async function logExerciseSet(sessionId, exerciseData) {
  try {
    const response = await fetch(`${API_BASE}/api/workouts/sessions/${sessionId}/log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(exerciseData),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to log exercise: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Workout API Error:', error);
    throw error;
  }
}

// ✅ COMPLETE WORKOUT SESSION
export async function completeWorkoutSession(sessionId) {
  try {
    const response = await fetch(`${API_BASE}/api/workouts/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to complete session: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Workout API Error:', error);
    throw error;
  }
}

// ✅ GET WORKOUT PROGRAM DETAILS
export async function getWorkoutProgram(programId) {
  try {
    const response = await fetch(`${API_BASE}/api/workouts/programs/${programId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Workout program not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to get workout program: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Workout API Error:', error);
    throw error;
  }
}

// ✅ GET NEXT WORKOUT DAY
export async function getNextWorkoutDay() {
  try {
    const response = await fetch(`${API_BASE}/api/workouts/next-day`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to get next workout day: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Workout API Error:', error);
    throw error;
  }
}