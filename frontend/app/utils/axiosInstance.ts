import axios from "axios"

export const API = axios.create({
  baseURL: "https://nutriscan-backend-wdym.onrender.com/api",
});