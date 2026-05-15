export interface ApiError {
  detail: string | { msg: string; type: string }[];
}

export interface User {
  id: string;
  email: string;
  username: string;
}