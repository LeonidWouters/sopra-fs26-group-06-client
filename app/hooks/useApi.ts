import apiService from "@/api/apiService";
import { useMemo } from "react"; // think of usememo like a singleton, it ensures only one instance exists

export const useApi = () => {
  return useMemo(() => apiService, []);
};
