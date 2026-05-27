const API_URL_DEV = "http://localhost:3000/api";
const API_URL_PROD = "https://maya-rpg-api-1t7v.onrender.com/api";

export const env = {
  apiUrl: import.meta.env.PROD ? API_URL_PROD : API_URL_DEV,
  production: import.meta.env.PROD,
};
