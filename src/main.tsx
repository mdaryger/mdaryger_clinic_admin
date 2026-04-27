import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { router } from './routes/AppRouter';
import './app/styles.css';
import { ToastViewport } from './components/ui/ToastViewport';
import { LanguageProvider } from './i18n/LanguageProvider';
import { useAuthStore } from './store/authStore';

useAuthStore.getState().initAuthListener();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <RouterProvider router={router} />
      <ToastViewport />
    </LanguageProvider>
  </React.StrictMode>,
);
