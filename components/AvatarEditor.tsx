'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Check, Shuffle, X } from 'lucide-react';
import {
  AvatarGender,
  AvatarGroup,
  AvatarSpec,
  avatarOptionLabel,
  avatarToDataUri,
  constrainAvatarSpec,
  getAvatarAttributes,
  randomAvatarSpec,
} from '@/lib/avatarSystem';

interface AvatarEditorProps {
  avatar: AvatarSpec;
  onSave: (avatar: AvatarSpec) => void | Promise<void>;
  onClose: () => void;
  onDraftChange?: (avatar: AvatarSpec) => void;
}

export default function AvatarEditor({ avatar, onSave, onClose, onDraftChange }: AvatarEditorProps) {
  const [local, setLocal] = useState<AvatarSpec>(() => constrainAvatarSpec(avatar));
  const [activeGroup, setActiveGroup] = useState<AvatarGroup>('face');
  const groups: { key: AvatarGroup; label: string }[] = [
    { key: 'face', label: 'Face' },
    { key: 'hair', label: 'Hair' },
    { key: 'outfit', label: 'Outfit' },
    { key: 'extras', label: 'Extras' },
  ];
  const attributes = getAvatarAttributes(local.gender, local.mouthType);

  const setDraft = (next: AvatarSpec) => {
    setLocal(next);
    onDraftChange?.(next);
  };
  const update = (key: keyof AvatarSpec, value: string) => {
    setDraft(constrainAvatarSpec({ ...local, [key]: value } as Partial<AvatarSpec>));
  };
  const updateGender = (gender: AvatarGender) => {
    setDraft(constrainAvatarSpec({ ...local, gender } as Partial<AvatarSpec>));
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
          <div className="avatar-gender-toggle" role="tablist" aria-label="Avatar gender">
            {(['male', 'female'] as AvatarGender[]).map(gender => (
              <button
                key={gender}
                type="button"
                role="tab"
                aria-selected={local.gender === gender}
                onClick={() => updateGender(gender)}
                className={local.gender === gender ? 'avatar-gender-choice is-active' : 'avatar-gender-choice'}
              >
                {avatarOptionLabel(gender)}
              </button>
            ))}
          </div>
          <button onClick={() => setDraft(randomAvatarSpec(local.gender))} className="btn-outline avatar-randomize-btn">
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
          {attributes.filter(attr => attr.group === activeGroup).map(attr => (
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
                    const preview = constrainAvatarSpec({ ...local, [attr.key]: value } as Partial<AvatarSpec>);
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
          <button onClick={() => { void Promise.resolve(onSave(local)).then(onClose); }} className="btn-primary avatar-apply-btn">Save Avatar</button>
        </div>
      </div>
    </div>
  );
}
