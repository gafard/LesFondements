'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  approveMember,
  computeGate,
  ensureProfile,
  getCachedGroup,
  getCachedMembers,
  getCachedProfile,
  getCachedSession,
  getCurrentSession,
  getGroup,
  getMembership,
  getMembers,
  getPublicGroup,
  hasRemoteBackend,
  saveProfile,
  subscribe,
  type ParcoursGate,
} from './parcoursStore';
import type { GroupMember, GroupSession, ParcoursGroup, UserProfile } from './types';
import { chargerPreferencesLocales, synchroniserNotifications } from './notifications';

interface ParcoursContextValue {
  profile: UserProfile | null;
  group: ParcoursGroup | null;
  members: GroupMember[];
  membership: GroupMember | null;
  session: GroupSession | null;
  gate: ParcoursGate;
  loading: boolean;
  /** true si l'utilisateur anime le groupe. */
  isLeader: boolean;
  /** Fiche ouverte pour tout le groupe, 0 si le parcours est fermé. */
  unlockedStep: number;
  /**
   * Jusqu'où l'on peut lire seul : la fiche du groupe, plus la suivante,
   * qu'on prépare en avance. Le partage, lui, reste sur `unlockedStep`.
   */
  preparationStep: number;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  /** Mode local sans backend : les groupes d'annuaire sont des exemples. */
  isLocalMode: boolean;
}

const ParcoursContext = createContext<ParcoursContextValue | undefined>(undefined);

export function ParcoursProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  // Initialisation optimiste immédiate (0ms) depuis le cache local
  const [profile, setProfile] = useState<UserProfile | null>(() => (user ? getCachedProfile(user.uid) : null));
  const [group, setGroup] = useState<ParcoursGroup | null>(() => {
    const cachedProf = user ? getCachedProfile(user.uid) : null;
    return cachedProf?.groupId ? getCachedGroup(cachedProf.groupId) : null;
  });
  const [members, setMembers] = useState<GroupMember[]>(() => {
    const cachedProf = user ? getCachedProfile(user.uid) : null;
    return cachedProf?.groupId ? getCachedMembers(cachedProf.groupId) : [];
  });
  const [session, setSession] = useState<GroupSession | null>(() => {
    const cachedProf = user ? getCachedProfile(user.uid) : null;
    return cachedProf?.groupId ? getCachedSession(cachedProf.groupId) : null;
  });
  /** Identité dont le parcours a fini de charger : pilote l'état `loading`. */
  const [loadedUid, setLoadedUid] = useState<string | null>(() => (user && profile ? user.uid : null));

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setGroup(null);
      setMembers([]);
      setSession(null);
      setLoadedUid(null);
      return;
    }

    const nextProfile = await ensureProfile(user);
    setProfile(nextProfile);

    if (!nextProfile.groupId) {
      setGroup(null);
      setMembers([]);
      setSession(null);
      setLoadedUid(user.uid);
      return;
    }

    const maPlace = await getMembership(nextProfile.groupId, user.uid);
    const nextGroup =
      maPlace?.status === 'actif'
        ? await getGroup(nextProfile.groupId)
        : await getPublicGroup(nextProfile.groupId);
    if (!nextGroup) {
      // Le groupe a disparu (supprimé, ou stockage local réinitialisé).
      await saveProfile({ ...nextProfile, groupId: null, membershipStatus: null, role: null });
      setProfile({ ...nextProfile, groupId: null, membershipStatus: null, role: null });
      setGroup(null);
      setMembers([]);
      setSession(null);
      setLoadedUid(user.uid);
      return;
    }

    const [nextMembers, nextSession] = await Promise.all([
      maPlace?.status === 'actif' ? getMembers(nextGroup.id) : Promise.resolve(maPlace ? [maPlace] : []),
      maPlace?.status === 'actif' ? getCurrentSession(nextGroup.id) : Promise.resolve(null),
    ]);

    // L'animateur modifie le document d'adhésion, jamais le profil privé d'un
    // autre utilisateur. À sa prochaine ouverture, chacun réconcilie donc son
    // propre profil avec son adhésion — opération autorisée et explicite.
    const placeReconcile = nextMembers.find((member) => member.uid === user.uid);
    let profileReconcile = nextProfile;
    if (
      placeReconcile &&
      (nextProfile.membershipStatus !== placeReconcile.status || nextProfile.role !== placeReconcile.role)
    ) {
      profileReconcile = {
        ...nextProfile,
        membershipStatus: placeReconcile.status,
        role: placeReconcile.role,
      };
      await saveProfile(profileReconcile);
      setProfile(profileReconcile);
    }

    setGroup(nextGroup);
    setMembers(nextMembers);
    setSession(nextSession);
    setLoadedUid(user.uid);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    // Différé : `load` met à jour l'état, on ne veut pas le faire de façon
    // synchrone dans le corps de l'effet.
    void Promise.resolve().then(() => load());
  }, [authLoading, load]);

  // Rechargement en direct quand le groupe bouge (autre onglet, autre membre).
  useEffect(() => {
    if (!user) return;
    const unsubs = [subscribe(`profile:${user.uid}`, () => void load())];
    if (profile?.groupId) {
      unsubs.push(
        subscribe(`group:${profile.groupId}`, () => void load()),
        subscribe(`members:${profile.groupId}`, () => void load()),
        subscribe(`sessions:${profile.groupId}`, () => void load())
      );
    }
    return () => unsubs.forEach((off) => off());
  }, [user, profile?.groupId, load]);

  const membership = useMemo(
    () => (user ? members.find((m) => m.uid === user.uid) ?? null : null),
    [members, user]
  );

  // Le calendrier push suit le vrai groupe, même si la personne ne rouvre
  // jamais le panneau de réglages après un changement de créneau ou d'étape.
  useEffect(() => {
    if (!user || loadedUid !== user.uid) return;
    const groupId = group && membership?.status === 'actif' ? group.id : undefined;
    void synchroniserNotifications(chargerPreferencesLocales(), { groupId });
  }, [user, loadedUid, group, membership?.status]);

  /**
   * Groupes d'exemple (mode local, sans backend) : leur animateur n'existe
   * pas. On simule sa réponse après quelques secondes, sinon la demande
   * resterait éternellement en attente et le parcours ne s'ouvrirait jamais.
   */
  useEffect(() => {
    if (!group?.demo || !user) return;
    if (membership?.status !== 'en_attente') return;
    const timer = window.setTimeout(() => {
      void approveMember(group.id, user.uid).catch(() => undefined);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [group?.demo, group?.id, membership?.status, user]);

  const loading = authLoading || (!!user && loadedUid !== user.uid);

  const gate = useMemo<ParcoursGate>(() => {
    if (loading) return { state: 'chargement' };
    return computeGate(profile, group, membership);
  }, [loading, profile, group, membership]);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!profile) return;
      const next = { ...profile, ...patch };
      setProfile(next);
      await saveProfile(next);
    },
    [profile]
  );

  const value: ParcoursContextValue = {
    profile,
    group,
    members,
    membership,
    session,
    gate,
    loading,
    isLeader:
      !!group &&
      !!user &&
      (group.leaderId === user.uid ||
        membership?.role === 'animateur' ||
        membership?.role === 'co_animateur'),
    unlockedStep: gate.state === 'ouvert' ? gate.unlockedStep : gate.state === 'termine' ? 20 : 0,
    preparationStep:
      gate.state === 'ouvert' ? gate.preparationStep : gate.state === 'termine' ? 20 : 0,
    refresh: load,
    updateProfile,
    isLocalMode: !hasRemoteBackend(),
  };

  return <ParcoursContext.Provider value={value}>{children}</ParcoursContext.Provider>;
}

export function useParcours(): ParcoursContextValue {
  const context = useContext(ParcoursContext);
  if (!context) throw new Error('useParcours doit être utilisé dans <ParcoursProvider>');
  return context;
}

/** Variante sûre hors provider (utilisée par la page d'accueil publique). */
export function useOptionalParcours(): ParcoursContextValue | null {
  return useContext(ParcoursContext) ?? null;
}
