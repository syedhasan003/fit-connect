export const dietStore = {
  /* Active diet plan */
  activePlan: {
    name: "Default",
    calories: 2400,
    protein: 160,
    carbs: 260,
    fat: 70
  },

  /* Saved diet plans (user-created) */
  plans: [
    {
      name: "Default",
      calories: 2400,
      protein: 160,
      carbs: 260,
      fat: 70
    }
  ],

  /* Daily logs */
  logs: {}
};
