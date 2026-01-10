import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './i18n'
import './index.css'

registerSW({ immediate: true })

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (error.message === 'Session expired') {
        useAuthStore.getState().clearAuth();
        window.location.replace('/login');
      }
    }
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      if (error.message === 'Session expired') {
        useAuthStore.getState().clearAuth();
        window.location.replace('/login');
      }
    }
  }),
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
