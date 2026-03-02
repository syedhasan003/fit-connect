import { API_BASE } from "./config.js";

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

// ── Medication schedules ───────────────────────────────────────────────────

export async function fetchMedicationSchedules() {
  const r = await fetch(`${API_BASE}/medication/schedules`, { headers: getAuthHeaders() });
  if (!r.ok) throw new Error("Failed to fetch medication schedules");
  return r.json();
}

export async function createMedicationSchedule(data) {
  const r = await fetch(`${API_BASE}/medication/schedules`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Failed to create medication schedule");
  return r.json();
}

export async function updateMedicationSchedule(id, data) {
  const r = await fetch(`${API_BASE}/medication/schedules/${id}`, {
    method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Failed to update medication schedule");
  return r.json();
}

export async function deleteMedicationSchedule(id) {
  const r = await fetch(`${API_BASE}/medication/schedules/${id}`, {
    method: "DELETE", headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to delete medication schedule");
  return r.json();
}

export async function fetchTodaysMedicationLogs() {
  const r = await fetch(`${API_BASE}/medication/logs/today`, { headers: getAuthHeaders() });
  if (!r.ok) throw new Error("Failed to fetch today's medication logs");
  return r.json();
}

export async function markTabletTaken(logId, tabletStatuses) {
  const r = await fetch(`${API_BASE}/medication/logs/${logId}/take`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(tabletStatuses),
  });
  if (!r.ok) throw new Error("Failed to update tablet status");
  return r.json();
}

/**
 * Fetch the last N days of medication logs.
 * Returns array of log dicts: { id, schedule_id, log_date, tablets_status, fully_acknowledged }
 */
export async function fetchMedicationHistory(days = 30) {
  const r = await fetch(`${API_BASE}/medication/logs/history?days=${days}`, {
    headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to fetch medication history");
  return r.json();
}

// ── Health records ────────────────────────────────────────────────────────

export async function fetchHealthRecords(recordType = null, archived = false) {
  const params = new URLSearchParams({ archived });
  if (recordType) params.set("record_type", recordType);
  const r = await fetch(`${API_BASE}/health-records/?${params}`, { headers: getAuthHeaders() });
  if (!r.ok) throw new Error("Failed to fetch health records");
  return r.json();
}

export async function createHealthRecord(formData) {
  // formData is a FormData object (supports file uploads)
  const token = localStorage.getItem("token");
  const r = await fetch(`${API_BASE}/health-records/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },  // no Content-Type — let browser set multipart boundary
    body: formData,
  });
  if (!r.ok) throw new Error("Failed to create health record");
  return r.json();
}

export async function deleteHealthRecord(id) {
  const r = await fetch(`${API_BASE}/health-records/${id}`, {
    method: "DELETE", headers: getAuthHeaders(),
  });
  if (!r.ok) throw new Error("Failed to delete health record");
  return r.json();
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