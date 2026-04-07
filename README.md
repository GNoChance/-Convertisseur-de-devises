# 💱 Convertisseur de Devises

Application mobile de conversion de devises en temps réel, développée avec **React Native** et **Expo**.

---

## 📱 Aperçu

| Sign Up | Convertisseur | Graphique |
|---|---|---|
| Création de compte avec validation | Conversion en temps réel | Historique des taux par période |

---

## ✨ Fonctionnalités

- 🔄 **Conversion en temps réel** via [Frankfurter API](https://frankfurter.dev/)
- 📊 **Graphique historique** des taux (1W / 1M / 3M / 6M / 1Y / Max)
- 🌍 **24 devises** supportées (EUR, USD, GBP, JPY, MAD…)
- 🔐 **Authentification** : Sign Up & Sign In avec validation complète
- 🌐 **Bilingue** : Français / Anglais
- 🌙 **Thème sombre** intégré
- 🔔 **Alertes** de taux de change
- ⇅ **Swap** instantané entre les deux devises

---

## 🛠 Stack technique

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) ~54
- [React Navigation](https://reactnavigation.org/) (Native Stack)
- [react-native-svg](https://github.com/software-mansion/react-native-svg) — graphiques
- [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)
- [Frankfurter API](https://frankfurter.dev/) — taux de change gratuits, sans clé API

---

## 📁 Structure du projet

```
src/
├── components/
│   ├── CustomButton.tsx     # Bouton réutilisable avec état de chargement
│   └── CustomInput.tsx      # Champ de saisie avec gestion d'erreur
├── context/
│   └── AppContext.tsx        # Contexte global (langue, thème, utilisateur)
├── i18n/
│   └── translations.ts      # Traductions FR / EN
├── navigation/
│   └── AppNavigator.tsx     # Stack : SignUp → SignIn → Converter
├── screens/
│   ├── SignUpScreen.tsx      # Inscription
│   ├── SignInScreen.tsx      # Connexion
│   └── ConverterScreen.tsx  # Écran principal
└── services/
    └── authService.ts       # Service auth (mock → prêt pour Firebase/Supabase)
```

---

## 🚀 Installation

```bash
# Cloner le repo
git clone https://github.com/GNoChance/-Convertisseur-de-devises.git
cd -Convertisseur-de-devises

# Installer les dépendances
npm install

# Lancer en mode web
npx expo start --web

# Lancer sur Expo Go (mobile)
npx expo start
```

Scanne ensuite le QR code avec l'app **Expo Go** sur ton téléphone (iOS ou Android).

---

## 🔌 Brancher un vrai backend

Le fichier `src/services/authService.ts` est prêt à être connecté :

```ts
// Firebase
import { createUserWithEmailAndPassword } from "firebase/auth";

// Supabase
import { supabase } from "./supabaseClient";

// API Node.js
fetch("https://ton-api.com/auth/register", { method: "POST", body: ... });
```

---

## 📄 Licence

MIT
