import { create } from "zustand";

const today = new Date().toISOString().split("T")[0];

export const useDietStore = create((set, get) => ({
  userId: "mock-user-1",

  activePlan: null,

  selectedDate: today,

  days: {},

  setPlan: (plan) =>
    set({ activePlan: plan }),

  selectDate: (date) =>
    set({ selectedDate: date }),

  getDay: (date) => {
    const { days, activePlan } = get();
    if (!days[date]) {
      return {
        date,
        meals: [],
        totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        target: activePlan?.targets || null,
      };
    }
    return days[date];
  },

  saveDay: (date, dayData) =>
    set((state) => ({
      days: {
        ...state.days,
        [date]: dayData,
      },
    })),
}));
