import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const { value: token } = useLocalStorage<string>("token", "");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, [token]);

  return { token, isReady };
};
