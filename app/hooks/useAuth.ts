import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";
import apiService from "@/api/apiService";

export const useAuth = () => {
  const { value: token, set: setToken } = useLocalStorage<string>("token", "");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);

    const handleBeforeUnload = () => {
      if (token) {
        const url = `${apiService.getBaseURL()}/users/logout?token=${token}`;
        navigator.sendBeacon(url);
      }

      globalThis.localStorage.removeItem("token");
      globalThis.localStorage.removeItem("id");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [token]);

  const logout = () => {
    if (token) {
      apiService.post("/users/logout", null, token).then(() => {
        setToken("");
        globalThis.localStorage.removeItem("id");
      });
    }
  };

  return { token, isReady, logout };
};
