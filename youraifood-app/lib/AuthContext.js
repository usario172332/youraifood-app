'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setIsPremium(false);
      return;
    }
    supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setIsPremium(!!data?.is_premium));
  }, [user]);

  useEffect(() => {
    if (!user || !session) {
      setFavorites(new Set());
      return;
    }
    fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => (res.ok ? res.json() : { recipeIds: [] }))
      .then((data) => setFavorites(new Set(data.recipeIds || [])))
      .catch(() => setFavorites(new Set()));
  }, [user, session]);

  async function toggleFavorite(recipeId) {
    if (!user || !session) return;
    const isFav = favorites.has(recipeId);

    // Optimistic update so the heart flips instantly.
    setFavorites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(recipeId) : next.add(recipeId);
      return next;
    });

    try {
      if (isFav) {
        await fetch(`/api/favorites?recipeId=${encodeURIComponent(recipeId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ recipeId }),
        });
      }
    } catch (err) {
      // Roll back on failure.
      setFavorites((prev) => {
        const next = new Set(prev);
        isFav ? next.add(recipeId) : next.delete(recipeId);
        return next;
      });
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  function handleAuthChange(newUser, newSession) {
    setUser(newUser);
    if (newSession) setSession(newSession);
  }

  return (
    <AuthContext.Provider
      value={{ user, session, isPremium, favorites, toggleFavorite, signOut, handleAuthChange, authReady }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
