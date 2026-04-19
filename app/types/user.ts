export interface User {
  id: string | null;
  password: string | null;
  username: string | null;
  name: string | null;
  token: string | null;
  status: string | null;
  bio: string | null;
  creationDate: string | null;
  disabilityStatus: "HEARING" | "DEAF" | null;
  friendCount: number | null;
  friends?: number[];
}
