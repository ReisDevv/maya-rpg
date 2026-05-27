const PROD_API_URL = "https://maya-rpg-api-1t7v.onrender.com/api";

const apiUrlFromEnv = import.meta.env.VITE_API_URL as string | undefined;

export const env = {
  apiUrl: apiUrlFromEnv ?? (import.meta.env.PROD ? PROD_API_URL : "http://localhost:3000/api"),
  production: import.meta.env.PROD,
};
