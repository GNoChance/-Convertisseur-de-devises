// ─────────────────────────────────────────────────────────────────────────────
// authService.ts
//
// Authentification locale avec persistance (localStorage sur web, mémoire
// sur natif). Règle principale : chaque identifiant ne peut être utilisé
// qu'UNE SEULE FOIS pour se connecter.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignUpPayload {
  username: string;
  email:    string;
  password: string;
}

export interface AuthUser {
  id:       string;
  username: string;
  email:    string;
}

export interface AuthError {
  message: string;
  field?:  "username" | "email" | "password";
}

interface StoredUser {
  id:       string;
  username: string;
  email:    string;
  password: string;
  used:     boolean; // true = compte déjà utilisé, connexion impossible
}

// ─── Persistance ──────────────────────────────────────────────────────────────

// Fallback en mémoire pour les plateformes natives (pas de localStorage)
let _memUsers: Record<string, StoredUser> = {};

function loadUsers(): Record<string, StoredUser> {
  if (Platform.OS !== "web") return _memUsers;
  try {
    const raw = localStorage.getItem("dx_users");
    return raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, StoredUser>): void {
  if (Platform.OS !== "web") { _memUsers = { ...users }; return; }
  try { localStorage.setItem("dx_users", JSON.stringify(users)); } catch {}
}

// ─── Compte démo pré-chargé ───────────────────────────────────────────────────

(function seedDemo() {
  if (Platform.OS !== "web") {
    _memUsers["demo@example.com"] = {
      id: "demo_id", username: "Demo",
      email: "demo@example.com", password: "password123", used: false,
    };
    return;
  }
  try {
    const raw = localStorage.getItem("dx_users");
    if (!raw) {
      const initial: Record<string, StoredUser> = {
        "demo@example.com": {
          id: "demo_id", username: "Demo",
          email: "demo@example.com", password: "password123", used: false,
        },
      };
      localStorage.setItem("dx_users", JSON.stringify(initial));
    }
  } catch {}
})();

// ─── Inscription ──────────────────────────────────────────────────────────────

export async function signUp(payload: SignUpPayload): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 1000));

  const users = loadUsers();
  const key   = payload.email.trim().toLowerCase();

  if (users[key]) {
    throw { message: "Cet email est déjà utilisé.", field: "email" } as AuthError;
  }

  const newUser: StoredUser = {
    id:       Math.random().toString(36).slice(2),
    username: payload.username.trim(),
    email:    key,
    password: payload.password,
    used:     false,
  };

  users[key] = newUser;
  saveUsers(users);

  return { id: newUser.id, username: newUser.username, email: newUser.email };
}

// ─── Connexion (usage unique) ─────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 900));

  const users = loadUsers();
  const key   = email.trim().toLowerCase();
  const user  = users[key];

  // Identifiants incorrects
  if (!user || user.password !== password) {
    throw { message: "Email ou mot de passe incorrect." } as AuthError;
  }

  // Compte déjà consommé
  if (user.used) {
    throw {
      message: "Ce compte a déjà été utilisé.\nChaque identifiant n'est valable qu'une seule fois.",
    } as AuthError;
  }

  // ← Marquer comme utilisé — impossible de se reconnecter
  user.used = true;
  saveUsers(users);

  return { id: user.id, username: user.username, email: user.email };
}

// ─── Vérifier si un compte est disponible (non encore utilisé) ───────────────

export function isAccountAvailable(email: string): boolean {
  const users = loadUsers();
  const user  = users[email.trim().toLowerCase()];
  return !!user && !user.used;
}
