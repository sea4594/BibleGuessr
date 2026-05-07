'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';
import {
  AvatarSpec, avatarToDataUri, AVATAR_ATTRIBUTES,
  SKIN_OPTIONS, HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS,
  SHOE_COLORS, EYE_COLORS,
} from '@/lib/avatarSystem';
import { getFirebaseAuth, getGoogleProvider, isFirebaseConfigured } from '@/lib/firebaseClient';
import {
  loadRemoteProfile, readLocalProfile, saveRemoteProfile,
  UserProfile, writeLocalProfile,
} from '@/lib/userProfile';
import { Pencil, X } from 'lucide-react';

function AvatarEditor({
  avatar,
  onChange,
  onClose,
}: { avatar: AvatarSpec; onChange: (spec: AvatarSpec) => void; onClose: () => void }) {
  const [local, setLocal] = useState<AvatarSpec>(avatar);

  const update = (key: keyof AvatarSpec, value: string) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const colorOptions: Record<string, string[]> = {
    skinColor: SKIN_OPTIONS,
    hairColor: HAIR_COLORS,
    eyeColor: EYE_COLORS,
    shirtColor: SHIRT_COLORS,
    pantsColor: PANTS_COLORS,
    shoeColor: SHOE_COLORS,
  };

  return (
    <div className="avatar-editor-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="avatar-editor-modal surface-card w-full max-h-[90dvh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
          <h2 className="text-lg font-bold">Edit Avatar</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={20} /></button>
        </div>
        <div className="avatar-editor-preview p-3 border-b border-[var(--line)]">
          <div className="flex justify-center">
            <img src={avatarToDataUri(local)} alt="Preview" className="w-24 h-auto rounded-xl border border-[var(--line)]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-w-0">
          {AVATAR_ATTRIBUTES.map(attr => (
            <div key={attr.key} className="min-w-0">
              <p className="eyebrow mb-1.5">{attr.label}</p>
              {attr.type === 'color' ? (
                <div className="avatar-option-row">
                  {(colorOptions[attr.key] ?? []).map(opt => (
                    <button
                      key={opt}
                      onClick={() => update(attr.key, opt)}
                      className="avatar-choice-color-btn"
                      style={{
                        background: opt,
                        borderColor: local[attr.key] === opt ? 'var(--text-main)' : 'var(--line-strong)',
                        boxShadow: local[attr.key] === opt ? '0 0 0 2px color-mix(in oklab, var(--accent) 35%, transparent)' : undefined,
                      }}
                      title={opt}
                    />
                  ))}
                </div>
              ) : (
                <div className="avatar-option-row">
                  {attr.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => update(attr.key, opt)}
                      className={local[attr.key] === opt ? 'btn-primary avatar-choice-pill-btn capitalize' : 'btn-outline avatar-choice-pill-btn capitalize'}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--line)] flex gap-2">
          <button onClick={() => { onChange(local); onClose(); }} className="btn-primary flex-1 py-2.5">
            Apply
          </button>
          <button onClick={onClose} className="btn-outline px-4 py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(() => readLocalProfile());
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => { writeLocalProfile(profile); }, [profile]);

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

  const handleSave = async () => {
    writeLocalProfile(profile);
    if (accountUser) {
      await saveRemoteProfile(accountUser, profile);
      setStatusMessage('Saved to your account.');
    } else {
      setStatusMessage('Saved on this device as guest profile.');
    }
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleSignIn = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const provider = getGoogleProvider();
    await signInWithPopup(auth, provider!);
    setStatusMessage('Signed in successfully.');
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setStatusMessage('Signed out.');
  };

  return (
    <main className="app-screen">
      {showEditor && (
        <AvatarEditor
          avatar={profile.avatar}
          onChange={avatar => setProfile(prev => ({ ...prev, avatar }))}
          onClose={() => setShowEditor(false)}
        />
      )}
      <AppTopBar title="Profile" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">

          {/* Identity */}
          <section className="surface-card p-5">
            <p className="eyebrow mb-2">Identity</p>
            <div className="flex flex-col items-center gap-3 mb-4">
              <img
                src={avatarToDataUri(profile.avatar)}
                alt="Your avatar"
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
              onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="settings-input !w-full mb-3"
              placeholder="Your name"
            />
            <p className="content-muted text-xs mb-4">
              {accountUser ? `Signed in as ${accountUser.email ?? 'account user'}` : 'Using guest profile (device only)'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void handleSave()} className="btn-primary px-4 py-2">Save Profile</button>
              {isFirebaseConfigured() && !accountUser && (
                <button onClick={() => void handleSignIn()} className="btn-outline px-4 py-2">Log in with Google</button>
              )}
              {accountUser && (
                <button onClick={() => void handleSignOut()} className="btn-outline px-4 py-2">Log out</button>
              )}
            </div>
            {statusMessage && <p className="text-sm content-muted mt-3">{statusMessage}</p>}
          </section>

        </div>
      </div>
      <MainBottomNav />
    </main>
  );
}
