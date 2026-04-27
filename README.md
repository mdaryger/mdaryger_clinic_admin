# Medicall Clinics Admin

Веб-панель для управления клиниками, филиалами, врачами, заявками и администраторами на базе Firebase.

## Stack

- React 18
- TypeScript
- Vite
- React Router
- React Hook Form
- Zod
- Zustand
- Tailwind CSS
- Firebase Auth
- Firebase Firestore
- Firebase Storage

## Folder Structure

```text
src/
  app/              # bootstrap, router export, global styles
  components/       # shared UI components
  constants/        # routes and navigation config
  features/         # domain UI blocks and forms
  firebase/         # Firebase app/env/config exports
  hooks/            # data-loading hooks
  layouts/          # public/admin layouts
  lib/              # validation schemas and role helpers
  pages/            # route pages
  routes/           # router and guards
  services/         # Firebase reads/writes and domain services
  store/            # Zustand stores
  types/            # shared types
  utils/            # formatting, csv export, search helpers
docs/
  firestore-indexes.md
```

## Env Variables

Смотри [.env.example](/Users/mac/IT/flutter/work/mdaryger/mdaryger_admin/.env.example).

Обязательные переменные:

- `VITE_APP_ENV`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

`VITE_APP_ENV=dev` ожидает проект `medicall-dev-f7395`.

`VITE_APP_ENV=prod` ожидает проект `medicall-prod-35394`.

## How To Run Dev

```bash
npm install
npm run dev
```

## How To Build Production

```bash
npm run build
```

## Firebase Collections

- `super_admin`
- `clinic_admin`
- `clinic_branch_admin`
- `clinics`
- `clinic_branches`
- `doctors`
- `home_visit_requests`
- `clinic_visit_requests`
- `home_visit_requests_plan`
- `countries`
- `cities`
- `departments`
- `appointments`
- `counters`

## Roles

- `super_admin` — управление всеми клиниками
- `clinic_admin` — управление своей клиникой, филиалами, врачами, заявками, admin users и настройками
- `clinic_branch_admin` — управление своим филиалом, врачами и branch requests
- `admin` — fallback-роль, если профиль найден неполно; для production на нее лучше не полагаться

## Firestore Indexes

Список обязательных индексов описан в [docs/firestore-indexes.md](/Users/mac/IT/flutter/work/mdaryger/mdaryger_admin/docs/firestore-indexes.md).

Если Firebase покажет `index error`, нужно открыть ссылку из console error и создать индекс по этой ссылке.

## Known TODO

- Cloud Function для `createAdminUser`
- Cloud Function для `deleteDoctorAuthUser`
- Возможно Cloud Function для secure doctor creation
- Firebase security rules review
