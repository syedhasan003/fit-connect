import { useEffect, useState } from "react";
import { getVaultItems } from "../api/vault";

export default function useVaultStore() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVaultItems()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return {
    items,
    loading,
    pinned: items.filter(i => i.pinned),
    recent: items.slice(0, 5),
    folders: {
      workout: items.filter(i => i.category === "manual_workout"),
      diet: items.filter(i => i.category === "manual_diet"),
      medical: items.filter(i => i.category === "medical_document"),
    }
  };
}
