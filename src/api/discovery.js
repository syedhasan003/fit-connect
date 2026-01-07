export async function fetchGyms() {
  return Promise.resolve([
    {
      id: "1",
      name: "Iron Works Gym",
      address: "Anna Nagar · Strength Training",
    },
    {
      id: "2",
      name: "Alpha Fitness",
      address: "T Nagar · Premium Gym",
    },
  ]);
}
