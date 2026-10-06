'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MainBottomNav from '@/components/MainBottomNav';
import {
  AvatarSpec, AvatarGroup, avatarOptionLabel, avatarToDataUri, AVATAR_ATTRIBUTES,
  defaultAvatarSpec, randomAvatarSpec,
} from '@/lib/avatarSystem';
import { readLocalProfile, UserProfile, writeLocalProfile } from '@/lib/userProfile';
import { useAccountSync } from '@/lib/accountSync';
import { useSettingsModal } from '@/components/SettingsModalProvider';
import { Check, Pencil, Settings, Shuffle, X } from 'lucide-react';

function AvatarEditor({
  avatar,
  onChange,
  onClose,
}: { avatar: AvatarSpec; onChange: (spec: AvatarSpec) => void; onClose: () => void }) {
  const [local, setLocal] = useState<AvatarSpec>(avatar);
  const [activeGroup, setActiveGroup] = useState<AvatarGroup>('face');
  const groups: { key: AvatarGroup; label: string }[] = [
    { key: 'face', label: 'Face' },
    { key: 'hair', label: 'Hair' },
    { key: 'outfit', label: 'Outfit' },
    { key: 'extras', label: 'Extras' },
  ];

  const update = (key: keyof AvatarSpec, value: string) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="avatar-editor-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.72)' }}>
      <div className="avatar-editor-modal surface-card w-full flex flex-col overflow-hidden">
        <div className="avatar-editor-header">
          <div>
            <p className="eyebrow">Avatar</p>
            <h2 className="text-xl font-bold">Make it yours</h2>
          </div>
          <button onClick={onClose} className="btn-ghost avatar-editor-close" aria-label="Close avatar editor"><X size={21} /></button>
        </div>

        <div className="avatar-editor-preview">
          <div className="avatar-editor-preview-stage" aria-label="Avatar preview">
            <Image src={avatarToDataUri(local)} alt="Avatar preview" width={164} height={239} unoptimized priority className="avatar-editor-preview-image" />
          </div>
          <button onClick={() => setLocal(randomAvatarSpec())} className="btn-outline avatar-randomize-btn">
            <Shuffle size={15} /> Randomize
          </button>
        </div>

        <div className="avatar-editor-tabs" role="tablist" aria-label="Avatar categories">
          {groups.map(group => (
            <button
              key={group.key}
              type="button"
              role="tab"
              aria-selected={activeGroup === group.key}
              onClick={() => setActiveGroup(group.key)}
              className={activeGroup === group.key ? 'avatar-editor-tab is-active' : 'avatar-editor-tab'}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="avatar-editor-options">
          {AVATAR_ATTRIBUTES.filter(attr => attr.group === activeGroup).map(attr => (
            <section key={attr.key} className="avatar-attribute-section">
              <div className="avatar-attribute-heading">
                <h3>{attr.label}</h3>
                <span>{avatarOptionLabel(String(local[attr.key]))}</span>
              </div>
              {attr.type === 'color' ? (
                <div className="avatar-color-grid">
                  {attr.options.map(option => {
                    const value = String(option);
                    const selected = local[attr.key] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update(attr.key, value)}
                        className={selected ? 'avatar-color-choice is-selected' : 'avatar-color-choice'}
                        aria-label={`${attr.label}: ${avatarOptionLabel(value)}`}
                        aria-pressed={selected}
                      >
                        <span className="avatar-color-swatch" style={{ background: value }} />
                        {selected && <span className="avatar-color-check"><Check size={13} /></span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="avatar-style-grid">
                  {attr.options.map(option => {
                    const value = String(option);
                    const selected = local[attr.key] === value;
                    const preview = { ...local, [attr.key]: value } as AvatarSpec;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update(attr.key, value)}
                        className={selected ? 'avatar-style-choice is-selected' : 'avatar-style-choice'}
                        aria-pressed={selected}
                      >
                        <span className="avatar-style-thumb">
                          <Image src={avatarToDataUri(preview, attr.focus)} alt="" width={82} height={82} unoptimized />
                        </span>
                        <span className="avatar-style-label">{avatarOptionLabel(value)}</span>
                        {selected && <span className="avatar-style-check"><Check size={13} /></span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="avatar-editor-actions">
          <button onClick={onClose} className="btn-outline avatar-cancel-btn">Cancel</button>
          <button onClick={() => { onChange(local); onClose(); }} className="btn-primary avatar-apply-btn">Save Avatar</button>
        </div>
      </div>
    </div>
  );
}

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
          onChange={avatar => updateProfile(prev => ({ ...prev, avatar }))}
          onClose={() => setShowEditor(false)}
        />
      )}
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">

          <section className="surface-card p-5">
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
              onChange={e => updateProfile(prev => ({ ...prev, name: e.target.value }))}
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
                    : 'Using guest profile (device only)'}
            </p>

            {firebaseEnabled && (!googleAccountLabel || syncStatus === 'syncing' || Boolean(syncError)) && (
              <p className="content-muted text-xs mb-4">
                {syncStatus === 'syncing'
                  ? 'Syncing your profile and app data...'
                  : syncError
                    ? syncError
                    : googleAccountLabel
                      ? ''
                      : 'Sign in with Google to sync everything across devices.'}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Link href="/profile/statistics" className="btn-outline px-4 py-2">
                Statistics
              </Link>
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
            </div>
            {statusMessage && <p className="text-sm content-muted mt-3">{statusMessage}</p>}

            <button
              onClick={openSettings}
              className="btn-outline w-full mt-4 py-2.5 inline-flex items-center justify-center gap-2"
            >
              <Settings size={17} /> Settings
            </button>
          </section>

        </div>
      </div>
      <MainBottomNav />
    </main>
  );
}
