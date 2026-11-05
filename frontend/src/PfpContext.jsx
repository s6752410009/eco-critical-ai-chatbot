import React, { createContext, useState, useEffect } from "react";
import useUser from "./hooks/useUser";
import System from "./models/system";

export const PfpContext = createContext();

export function PfpProvider({ children, publicDemo = false }) {
  const [pfp, setPfp] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    async function fetchPfp() {
      if (!user?.id || publicDemo) return;
      try {
        const pfpUrl = await System.fetchPfp(user.id);
        setPfp(pfpUrl);
      } catch (err) {
        setPfp(null);
        console.error("Failed to fetch pfp:", err);
      }
    }
    fetchPfp();
  }, [user?.id, publicDemo]);

  return (
    <PfpContext.Provider value={{ pfp, setPfp }}>
      {children}
    </PfpContext.Provider>
  );
}
