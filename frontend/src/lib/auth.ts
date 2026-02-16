import { useEffect, useState } from "react";
import type { User } from "@shared/types";

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || "/api/auth";
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function setStoredUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed.";
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<AuthResponse>(response);
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<AuthResponse>(response);
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  if (!email.trim()) {
    throw new Error("Email is required.");
  }
  const response = await fetch(`${AUTH_BASE_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseResponse<{ message: string }>(response);
}

export async function logout() {
  removeToken();
  await fetch(`${AUTH_BASE_URL}/logout`, { method: "POST" });
}

export function useSession() {
  const [data, setData] = useState<{ user: User } | null>(() => {
    const user = getStoredUser();
    return user ? { user } : null;
  });
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setData(null);
      setIsPending(false);
      return;
    }

    fetch(`${AUTH_BASE_URL}/profile`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unauthorized");
        const payload = (await response.json()) as { user: User };
        setStoredUser(payload.user);
        setData(payload);
      })
      .catch(() => {
        removeToken();
        setData(null);
      })
      .finally(() => setIsPending(false));
  }, []);

  return { data, isPending };
}
