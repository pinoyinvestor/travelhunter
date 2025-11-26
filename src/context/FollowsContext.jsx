// src/context/FollowsContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const FollowsContext = createContext();

const STORAGE_KEY = "travelhunter_followedIslands";

function loadInitialFollows() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse local follows", e);
    return [];
  }
}

export function FollowsProvider({ children }) {
  const [followedIslands, setFollowedIslands] = useState(loadInitialFollows);

  // spara automatiskt till localStorage när något ändras
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(followedIslands));
    } catch (e) {
      console.error("Failed to save follows", e);
    }
  }, [followedIslands]);

  function toggleFollow(id) {
    setFollowedIslands((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function isFollowed(id) {
    return followedIslands.includes(id);
  }

  const value = {
    followedIslands,
    toggleFollow,
    isFollowed,
  };

  return (
    <FollowsContext.Provider value={value}>
      {children}
    </FollowsContext.Provider>
  );
}

export function useFollows() {
  const ctx = useContext(FollowsContext);
  if (!ctx) {
    throw new Error("useFollows must be used inside <FollowsProvider>");
  }
  return ctx;
}
