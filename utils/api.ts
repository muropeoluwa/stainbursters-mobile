// utils/api.ts
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useApi = () => {
  const { token, logout } = useContext(AuthContext);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...(options.headers || {}),
      };

      const response = await fetch(url, { ...options, headers });

      // 🚪 If backend rejects token → logout
      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please log in again.");
      }

      const data = await response.json();

      // 🚪 Catch backend message (in case 401 isn’t used)
      if (
        data?.message &&
        data.message.toLowerCase().includes("invalid session")
      ) {
        logout();
        throw new Error("Session expired. Please log in again.");
      }

      return data;
    } catch (error) {
      console.error("API Fetch Error:", error);
      throw error;
    }
  };

  return { apiFetch };
};
