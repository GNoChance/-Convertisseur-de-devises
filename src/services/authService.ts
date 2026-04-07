// ─────────────────────────────────────────────────────────────────────────────
// authService.ts
//
// Mock implementation — remplace les fonctions ci-dessous par de vraies
// requêtes pour brancher Firebase, Supabase ou ton API Node.js.
//
// Firebase  → import { createUserWithEmailAndPassword } from "firebase/auth"
// Supabase  → import { supabase } from "./supabaseClient"
// API Node  → fetch("https://ton-api.com/auth/register", { method: "POST", ... })
// ─────────────────────────────────────────────────────────────────────────────

export interface SignUpPayload {
  username: string;
  email:    string;
  password: string;
}

export interface AuthUser {
  id:       string;
  username: string;
  email:    string;
  token:    string;
}

export interface AuthError {
  message: string;
  field?:  "username" | "email" | "password";
}

// Simulated existing users (mock DB)
const MOCK_USERS: Pick<AuthUser, "email">[] = [
  { email: "demo@example.com" },
];

export async function signUp(payload: SignUpPayload): Promise<AuthUser> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate duplicate email error
  if (MOCK_USERS.some((u) => u.email === payload.email)) {
    throw { message: "Email already in use", field: "email" } as AuthError;
  }

  // Simulate success → return fake user
  return {
    id:       Math.random().toString(36).slice(2),
    username: payload.username,
    email:    payload.email,
    token:    "mock_jwt_" + Math.random().toString(36).slice(2),
  };
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock: accept any credentials that match demo account
  if (email === "demo@example.com" && password === "password123") {
    return { id: "demo_id", username: "Demo", email, token: "mock_jwt_demo" };
  }

  throw { message: "Invalid email or password" } as AuthError;
}
