'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';
import { avatarToDataUri, getAvatarOptions } from '@/lib/avatarOptions';
import { getFirebaseAuth, getGoogleProvider, isFirebaseConfigured } from '@/lib/firebaseClient';
import { loadRemoteProfile, readLocalProfile, saveRemoteProfile, UserProfile, writeLocalProfile } from '@/lib/userProfile';
import { themeOptions, useUiSettings } from '@/lib/uiSettingsContext';

export default function ProfilePage() {
  const { settings, setTheme, setMode, setPreferredRounds } = useUiSettings();
  const avatarOptions = useMemo(() => getAvatarOptions(96), []);
  const [profile, setProfile] = useState<UserProfile>(() => readLocalProfile());
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    writeLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, user => {
      setAccountUser(user);
      if (!user) return;

      void (async () => {
        const remote = await loadRemoteProfile(user);
        if (remote) setProfile(remote);
      })();
    });

    return () => unsubscribe();
  }, []);

  const selectedAvatar = avatarOptions.find(item => item.id === profile.avatarId) ?? avatarOptions[0];

  const handleSave = async () => {
    writeLocalProfile(profile);

    if (accountUser) {
      await saveRemoteProfile(accountUser, profile);
      setStatusMessage('Saved to your account.');
    } else {
      setStatusMessage('Saved on this device as guest profile.');
    }
  };

  const handleSignIn = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const provider = getGoogleProvider();
    await signInWithPopup(auth, provider);
    setStatusMessage('Signed in successfully.');
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setStatusMessage('Signed out. Guest profile remains on this device.');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Profile" backHref="/" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-4xl">
          <section className="surface-card p-5">
            <p className="eyebrow mb-2">Identity</p>
            <h1 className="headline-serif text-3xl mb-2">Player Profile</h1>
            <p className="content-muted mb-5">
              Guests get a random identity by default. You can edit your name and avatar anytime.
            </p>

            <div className="surface-card-soft p-4 mb-4 flex items-center gap-4">
              <img src={avatarToDataUri(selectedAvatar)} alt="Selected avatar" className="w-20 h-20 border border-[var(--line)]" />
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Display Name</label>
                <input
                  value={profile.name}
                  onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="settings-input !w-full"
                />
                <p className="content-muted text-xs mt-2">
                  {accountUser ? `Signed in as ${accountUser.email ?? 'account user'}` : 'Using guest profile'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => void handleSave()} className="btn-primary px-4 py-2">Save Profile</button>

              {isFirebaseConfigured() && !accountUser && (
                <button onClick={() => void handleSignIn()} className="btn-outline px-4 py-2">Log in with Google</button>
              )}

              {accountUser && (
                <button onClick={() => void handleSignOut()} className="btn-outline px-4 py-2">Log out</button>
              )}
            </div>

            {statusMessage && <p className="text-sm content-muted mb-4">{statusMessage}</p>}

            <h2 className="text-2xl font-semibold mb-3">Avatar Gallery</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-8">
              {avatarOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setProfile(prev => ({ ...prev, avatarId: option.id }))}
                  className={profile.avatarId === option.id ? 'theme-option active p-1' : 'theme-option p-1'}
                  aria-label={`Select ${option.id}`}
                >
                  <img src={avatarToDataUri(option)} alt={option.id} className="w-full h-auto" />
                </button>
              ))}
            </div>

            <p className="eyebrow mb-2">Preferences</p>
            <h2 className="text-2xl font-semibold mb-3">Color Mode</h2>
            <div className="grid gap-2 mb-6">
              {(['dark', 'light'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setMode(mode)}
                  className={settings.mode === mode ? 'btn-primary w-full px-4 py-2.5 text-left' : 'btn-outline w-full px-4 py-2.5 text-left'}
                >
                  {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-semibold mb-3">Theme</h2>
            <div className="theme-grid mb-6">
              {themeOptions.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`theme-option ${settings.theme === theme.id ? 'active' : ''}`}
                >
                  <span className="theme-name">{theme.name}</span>
                  <span className="theme-description">{theme.description}</span>
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-semibold mb-3">Default Rounds</h2>
            <div className="grid gap-2 mb-2">
              {([5, 10] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setPreferredRounds(n)}
                  className={settings.preferredRounds === n ? 'btn-primary w-full px-4 py-2.5 text-left' : 'btn-outline w-full px-4 py-2.5 text-left'}
                >
                  {n} rounds
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <MainBottomNav />
    </main>
  );
}
