import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startWorkoutSession,
  getActiveSession,
  logExerciseSet,
  completeWorkoutSession,
  getNextWorkoutDay,
} from '../../api/workout';

export default function WorkoutTracking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState({});
  const [restTimer, setRestTimer] = useState(null);
  const [restSeconds, setRestSeconds] = useState(0);
  const [dayInfo, setDayInfo] = useState(null);

  useEffect(() => {
    loadWorkoutSession();
  }, []);

  useEffect(() => {
    let interval;
    if (restTimer && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            setRestTimer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer, restSeconds]);

  const loadWorkoutSession = async () => {
    try {
      setLoading(true);

      // Check for active session first
      let activeSession = await getActiveSession();

      if (!activeSession) {
        // Get next workout day
        const nextDay = await getNextWorkoutDay();
        if (!nextDay) {
          alert('No active workout program found. Please set an active workout first.');
          navigate('/');
          return;
        }

        setDayInfo(nextDay);

        // Start new session
        activeSession = await startWorkoutSession(
          nextDay.program_id,
          nextDay.day_number
        );
      }

      setSession(activeSession);
      setExercises(activeSession.exercises || []);

      // Initialize sets tracking
      const initialSets = {};
      activeSession.exercises?.forEach((exercise) => {
        initialSets[exercise.id] = exercise.logged_sets || [];
      });
      setSets(initialSets);
    } catch (error) {
      console.error('Failed to load workout session:', error);
      alert(error.message || 'Failed to load workout session');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogSet = async (exerciseId, setData) => {
    try {
      const result = await logExerciseSet(session.id, {
        exercise_id: exerciseId,
        set_number: (sets[exerciseId]?.length || 0) + 1,
        weight: parseFloat(setData.weight),
        reps: parseInt(setData.reps),
        notes: setData.notes || '',
      });

      // Update local state
      setSets((prev) => ({
        ...prev,
        [exerciseId]: [...(prev[exerciseId] || []), result],
      }));

      // Start rest timer (default 90 seconds)
      setRestTimer(exerciseId);
      setRestSeconds(90);
    } catch (error) {
      console.error('Failed to log set:', error);
      alert(error.message || 'Failed to log set');
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      if (!window.confirm('Are you sure you want to complete this workout?')) {
        return;
      }

      await completeWorkoutSession(session.id);
      alert('🎉 Workout completed! Great job!');
      navigate('/');
    } catch (error) {
      console.error('Failed to complete workout:', error);
      alert(error.message || 'Failed to complete workout');
    }
  };

  const skipRestTimer = () => {
    setRestTimer(null);
    setRestSeconds(0);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!session || exercises.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h2>No exercises found</h2>
          <p>This workout doesn't have any exercises yet.</p>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const currentSets = sets[currentExercise.id] || [];
  const totalExercises = exercises.length;
  const completedExercises = Object.values(sets).filter((s) => s.length > 0).length;
  const progress = (completedExercises / totalExercises) * 100;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          ← Back
        </button>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{session.program_name || 'Workout'}</h1>
          <p style={styles.subtitle}>
            Day {session.day_number} • {session.day_name || `Workout ${session.day_number}`}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
        </div>
        <p style={styles.progressText}>
          {completedExercises} / {totalExercises} exercises started
        </p>
      </div>

      {/* Rest Timer */}
      {restTimer && (
        <div style={styles.restTimerCard}>
          <div style={styles.timerIcon}>⏱️</div>
          <div style={styles.timerContent}>
            <h3 style={styles.timerTitle}>Rest Timer</h3>
            <p style={styles.timerCountdown}>{restSeconds}s</p>
          </div>
          <button onClick={skipRestTimer} style={styles.skipButton}>
            Skip
          </button>
        </div>
      )}

      {/* Current Exercise */}
      <div style={styles.exerciseCard}>
        <div style={styles.exerciseHeader}>
          <h2 style={styles.exerciseName}>{currentExercise.name}</h2>
          <div style={styles.exerciseNav}>
            <button
              onClick={() =>
                setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))
              }
              disabled={currentExerciseIndex === 0}
              style={{
                ...styles.navButton,
                ...(currentExerciseIndex === 0 ? styles.navButtonDisabled : {}),
              }}
            >
              ←
            </button>
            <span style={styles.exerciseCounter}>
              {currentExerciseIndex + 1} / {totalExercises}
            </span>
            <button
              onClick={() =>
                setCurrentExerciseIndex(
                  Math.min(totalExercises - 1, currentExerciseIndex + 1)
                )
              }
              disabled={currentExerciseIndex === totalExercises - 1}
              style={{
                ...styles.navButton,
                ...(currentExerciseIndex === totalExercises - 1
                  ? styles.navButtonDisabled
                  : {}),
              }}
            >
              →
            </button>
          </div>
        </div>

        <div style={styles.targetInfo}>
          <div style={styles.targetItem}>
            <span style={styles.targetLabel}>Target:</span>
            <span style={styles.targetValue}>
              {currentExercise.sets} sets × {currentExercise.reps} reps
            </span>
          </div>
          {currentExercise.rest_seconds && (
            <div style={styles.targetItem}>
              <span style={styles.targetLabel}>Rest:</span>
              <span style={styles.targetValue}>{currentExercise.rest_seconds}s</span>
            </div>
          )}
        </div>

        {/* Logged Sets */}
        {currentSets.length > 0 && (
          <div style={styles.setsContainer}>
            <h3 style={styles.setsTitle}>Completed Sets</h3>
            {currentSets.map((set, index) => (
              <div key={index} style={styles.setRow}>
                <span style={styles.setNumber}>Set {set.set_number}</span>
                <span style={styles.setDetails}>
                  {set.weight} kg × {set.reps} reps
                </span>
                <span style={styles.setCheck}>✓</span>
              </div>
            ))}
          </div>
        )}

        {/* Log New Set */}
        <ExerciseLogger
          exerciseId={currentExercise.id}
          setNumber={currentSets.length + 1}
          targetReps={currentExercise.reps}
          onLogSet={handleLogSet}
        />
      </div>

      {/* Complete Workout Button */}
      {completedExercises > 0 && (
        <button onClick={handleCompleteWorkout} style={styles.completeButton}>
          ✅ Complete Workout
        </button>
      )}
    </div>
  );
}

function ExerciseLogger({ exerciseId, setNumber, targetReps, onLogSet }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState(targetReps?.toString() || '');
  const [notes, setNotes] = useState('');
  const [logging, setLogging] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!weight || !reps) {
      alert('Please enter both weight and reps');
      return;
    }

    try {
      setLogging(true);
      await onLogSet(exerciseId, { weight, reps, notes });

      // Reset form
      setWeight('');
      setReps(targetReps?.toString() || '');
      setNotes('');
    } catch (error) {
      console.error('Failed to log set:', error);
    } finally {
      setLogging(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.loggerForm}>
      <h3 style={styles.loggerTitle}>Log Set {setNumber}</h3>
      <div style={styles.inputRow}>
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>Weight (kg)</label>
          <input
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={styles.input}
            placeholder="0"
            disabled={logging}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            style={styles.input}
            placeholder="0"
            disabled={logging}
          />
        </div>
      </div>
      <button type="submit" disabled={logging} style={styles.logButton}>
        {logging ? 'Logging...' : '+ Log Set'}
      </button>
    </form>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderTop: '4px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: '#888',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
  },
  backButton: {
    marginTop: '20px',
    padding: '12px 24px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  header: {
    marginBottom: '24px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#00d4ff',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '12px',
    padding: '8px 0',
  },
  headerContent: {
    marginTop: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    margin: 0,
  },
  progressContainer: {
    marginBottom: '24px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '14px',
    color: '#888',
    margin: 0,
  },
  restTimerCard: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    border: '2px solid rgba(255, 165, 0, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  timerIcon: {
    fontSize: '32px',
  },
  timerContent: {
    flex: 1,
  },
  timerTitle: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffa500',
  },
  timerCountdown: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffa500',
  },
  skipButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    color: '#ffa500',
    border: '1px solid rgba(255, 165, 0, 0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  exerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
  },
  exerciseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  exerciseName: {
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
  },
  exerciseNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#2a2a2a',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  exerciseCounter: {
    fontSize: '14px',
    color: '#888',
  },
  targetInfo: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #2a2a2a',
  },
  targetItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  targetLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  targetValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#00d4ff',
  },
  setsContainer: {
    marginBottom: '24px',
  },
  setsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#888',
  },
  setRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  setNumber: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#888',
  },
  setDetails: {
    fontSize: '14px',
    fontWeight: '600',
  },
  setCheck: {
    fontSize: '18px',
    color: '#00ff88',
  },
  loggerForm: {
    backgroundColor: '#0a0a0a',
    borderRadius: '12px',
    padding: '20px',
    border: '2px solid #2a2a2a',
  },
  loggerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#00d4ff',
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
  },
  logButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#00d4ff',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  completeButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#00ff88',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    position: 'sticky',
    bottom: '20px',
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);