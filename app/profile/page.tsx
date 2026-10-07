'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MainBottomNav from '@/components/MainBottomNav';
import { AvatarSpec, avatarToDataUri, defaultAvatarSpec } from '@/lib/avatarSystem';
import { DISPLAY_NAME_MAX_LENGTH, readLocalProfile, UserProfile, writeLocalProfile } from '@/lib/userProfile';
import { useAccountSync } from '@/lib/accountSync';
import { useSettingsModal } from '@/components/SettingsModalProvider';
import { Pencil, Settings } from 'lucide-react';
import AvatarEditor from '@/components/AvatarEditor';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({ name: '', avatar: defaultAvatarSpec(0) });
  const [statusMessage, setStatusMessage] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const {
    appStateNonce,
    firebaseEnabled,
    login,
    loginPending,
    logout,
    ready,
    syncError,
    syncStatus,
    user,
  } = useAccountSync();
  const { openSettings } = useSettingsModal();
  const googleUser = user && !user.isAnonymous ? user : null;
  const googleAccountLabel = googleUser
    ? (googleUser.email ?? googleUser.providerData.find(provider => provider.email)?.email ?? googleUser.displayName ?? 'Google account')
    : null;

  const updateProfile = (updater: (prev: UserProfile) => UserProfile) => {
    setProfile(prev => {
      const next = updater(prev);
      writeLocalProfile(next);
      return next;
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(readLocalProfile());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [appStateNonce]);

  const handleSignIn = async () => {
    await login();
    setStatusMessage('Opening Google login...');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleSignOut = async () => {
    await logout();
    setStatusMessage('Signed out.');
  };

  return (
    <main className="app-screen primary-nav-screen">
      {showEditor && (
        <AvatarEditor
          avatar={profile.avatar}
          onSave={avatar => updateProfile(prev => ({ ...prev, avatar }))}
          onClose={() => setShowEditor(false)}
        />
      )}
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">

          <section className="surface-card p-5 relative">
            <button
              onClick={openSettings}
              className="btn-outline profile-settings-icon"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={19} />
            </button>
            <div className="flex flex-col items-center gap-3 mb-4">
              <Image
                src={avatarToDataUri(profile.avatar)}
                alt="Your avatar"
                width={96}
                height={96}
                unoptimized
                className="w-24 h-auto rounded-2xl border-2 border-[var(--line)]"
              />
              <button
                onClick={() => setShowEditor(true)}
                className="btn-outline px-4 py-2 text-sm inline-flex items-center gap-1.5"
              >
                <Pencil size={14} /> Edit Avatar
              </button>
            </div>
            <label className="block text-sm font-semibold mb-1">Display Name</label>
            <input
              value={profile.name}
              onChange={e => updateProfile(prev => ({ ...prev, name: e.target.value.slice(0, DISPLAY_NAME_MAX_LENGTH) }))}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              className="settings-input !w-full mb-3"
              placeholder="Your name"
            />
            <p className="content-muted text-xs mb-4">
              {!firebaseEnabled
                ? 'Google sync is disabled until Firebase env vars are configured.'
                : !ready
                  ? 'Initializing account sync...'
                  : googleAccountLabel
                    ? `Signed in as ${googleAccountLabel}`
                    : 'Not logged in'}
            </p>

            {firebaseEnabled && Boolean(syncError) && (
              <p className="content-muted text-xs mb-4">{syncError}</p>
            )}

            <div className="profile-account-actions">
              {firebaseEnabled && !googleAccountLabel && (
                <button
                  onClick={() => void handleSignIn()}
                  className="btn-outline px-4 py-2"
                  disabled={syncStatus === 'syncing' || loginPending}
                >
                  {loginPending ? 'Opening Google...' : 'Log in with Google'}
                </button>
              )}
              {googleAccountLabel && (
                <button
                  onClick={() => void handleSignOut()}
                  className="btn-outline px-4 py-2"
                  disabled={syncStatus === 'syncing'}
                >
                  Log out
                </button>
              )}
              <Link href="/profile/statistics" className="btn-outline px-4 py-2 text-center">
                Statistics
              </Link>
            </div>
            {statusMessage && <p className="text-sm content-muted mt-3">{statusMessage}</p>}

          </section>

        </div>
      </div>
      <MainBottomNav />
    </main>
  );
}
