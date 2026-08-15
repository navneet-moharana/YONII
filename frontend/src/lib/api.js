import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const http = axios.create({ baseURL: API, timeout: 90000 });

export function setAdminToken(token) {
  if (token) {
    localStorage.setItem("yonii_admin_token", token);
    http.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("yonii_admin_token");
    delete http.defaults.headers.common["Authorization"];
  }
}

const existing = localStorage.getItem("yonii_admin_token");
if (existing) http.defaults.headers.common["Authorization"] = `Bearer ${existing}`;
