"""
Deterministic rule engine for Central Reasoning.

Consumes output from build_summary_from_events().
NO DB ACCESS.
NO LLM.
"""

from typing import Dict, List


def detect_workout_regression(summary: Dict) -> List[str]:
    reasons = []

    completed = summary.get("workouts_completed", 0)
    missed = summary.get("workouts_missed", 0)

    if completed + missed == 0:
        return reasons

    miss_ratio = missed / max(1, completed + missed)

    if miss_ratio >= 0.3:
        reasons.append(
            "Workout adherence dropped significantly during this period."
        )

    return reasons


def detect_reminder_issues(summary: Dict) -> List[str]:
    reasons = []

    reminder_stats = summary.get("reminders", {})
    missed = reminder_stats.get("missed", 0)
    acknowledged = reminder_stats.get("acknowledged", 0)

    if missed > acknowledged:
        reasons.append(
            "More reminders were missed than acknowledged."
        )

    return reasons


def derive_decisions(reasons: List[str]) -> List[Dict]:
    decisions = []

    for reason in reasons:
        if "Workout adherence dropped" in reason:
            decisions.append(
                {
                    "action": "suggest_lighter_workout",
                    "reason": "Lower adherence suggests current intensity may be too high."
                }
            )

        if "reminders were missed" in reason:
            decisions.append(
                {
                    "action": "adjust_reminder_time",
                    "reason": "High reminder miss rate detected."
                }
            )

    if not decisions:
        decisions.append(
            {
                "action": "no_action",
                "reason": "No significant issues detected."
            }
        )

    return decisions
