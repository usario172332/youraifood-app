'use client';

import { AuthProvider } from '../lib/AuthContext';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  return (
    <AuthProvider>
      <div className="md:flex">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </AuthProvider>
  );
}
