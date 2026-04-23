import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";
import { getApiDomain } from "@/utils/domain";

export const useAuth = () => {
  const { value: token } = useLocalStorage<string>("token", "");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);

    if (token) {
      const handleUnload = () => {
        // Use keepalive: true to ensure the PUT request completes after the window is closed
        fetch(`${getApiDomain()}/users/logout?token=${token}`, {
          method: "PUT",
          keepalive: true
        });
        
        // Also clear local data so that if the user somehow navigates back, they aren't using an invalidated token
        globalThis.localStorage.removeItem("token");
        globalThis.localStorage.removeItem("id");
      };

      window.addEventListener("beforeunload", handleUnload);
      return () => window.removeEventListener("beforeunload", handleUnload);
    }
  }, [token]);

  return { token, isReady };
};
