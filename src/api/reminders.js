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

// ✅ GET ALL REMINDERS
export async function fetchReminders() {
  try {
    const response = await fetch(`${API_BASE}/reminders/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch reminders: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Reminders API Error:', error);
    throw error;
  }
}

// ✅ CREATE REMINDER
export async function createReminder(reminderData) {
  try {
    const response = await fetch(`${API_BASE}/reminders/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to create reminder: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Reminders API Error:', error);
    throw error;
  }
}

// ✅ UPDATE REMINDER (NEW)
export async function updateReminder(reminderId, reminderData) {
  try {
    const response = await fetch(`${API_BASE}/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Reminder not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to update reminder: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Reminders API Error:', error);
    throw error;
  }
}

// ✅ DELETE REMINDER (NEW)
export async function deleteReminder(reminderId) {
  try {
    const response = await fetch(`${API_BASE}/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Reminder not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to delete reminder: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Reminders API Error:', error);
    throw error;
  }
}

// ✅ ACKNOWLEDGE REMINDER (User did it!)
export async function acknowledgeReminder(reminderId) {
  try {
    const response = await fetch(`${API_BASE}/reminders/${reminderId}/acknowledge`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Reminder not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to acknowledge reminder: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Reminders API Error:', error);
    throw error;
  }
}

// ✅ MARK REMINDER AS MISSED
export async function markReminderMissed(reminderId, reason = null) {
  try {
    const response = await fetch(`${API_BASE}/reminders/${reminderId}/missed?reason=${encodeURIComponent(reason || '')}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (response.status === 404) {
      throw new Error('Reminder not found');
    }

    if (!response.ok) {
      throw new Error(`Failed to mark reminder as missed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Reminders API Error:', error);
    throw error;
  }
}

// ✅ COMPLETE REMINDER (Late completion with reason)
export async function completeReminder(reminderId, reason = null) {
  try {
    const response = await fetch(`${API_BASE}/reminders/${reminderId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: reason || 'No reason provided' }),
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to complete reminder: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Reminders API Error:', error);
    throw error;
  }
}