import React, { createContext, useContext, useState } from 'react';

const RouteContext = createContext(null);

export function RouteProvider({ children, initialRoute }) {
  const [route, setRoute] = useState(initialRoute || { name: "overview" });

  return (
    <RouteContext.Provider value={{ route, setRoute }}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRoute must be used inside <RouteProvider>");
  return ctx;
}
