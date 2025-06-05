import { User } from "@shared/schema";

export const getStoredAuth = (): User | null => {
  try {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setStoredAuth = (user: User | null) => {
  if (user) {
    localStorage.setItem("auth", JSON.stringify(user));
  } else {
    localStorage.removeItem("auth");
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem("auth");
  localStorage.removeItem("tempPhone");
};
