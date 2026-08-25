'use client';

import { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  Users,
  Video,
} from 'lucide-react';
import PlacePicker from '@/components/PlacePicker';
import {
  GROUP_DEFAULT_CAPACITY,
  GROUP_MAX_CAPACITY,
  GROUP_MIN_CAPACITY,
  type GroupMeetingMode,
  type GroupRhythm,
  type GroupVisibility,
  type PlaceRef,
} from '@/lib/types';
import type { CreateGroupInput } from '@/lib/parcoursStore';

const WEEKDAYS = [
  { value: 1, short: 'Lun' },
  { value: 2, short: 'Mar' },
  { value: 3, short: 'Mer' },
  { value: 4, short: 'Jeu' },
  { value: 5, short: 'Ven' },
  { value: 6, short: 'Sam' },
  { value: 0, short: 'Dim' },
];

const MODES: { value: GroupMeetingMode; label: string; hint: string; icon: typeof Users }[] = [
  {
    value: 'presentiel',
    label: 'Présentiel',
    hint: 'On se retrouve physiquement',
    icon: MapPin,
  },
  {
    value: 'hybride',
    label: 'Hybride',
    hint: 'Sur place, et en visio pour les absents',
    icon: Monitor,
  },
  { value: 'ligne', label: 'En ligne', hint: 'Tout le monde en visio', icon: Video },
];

const VISIBILITIES: { value: GroupVisibility; label: string; hint: string }[] = [
  {
    value: 'sur_demande',
    label: 'Sur demande',
    hint: 'Visible dans l’annuaire, vous validez chaque demande',
  },
  {
    value: 'ouvert',
    label: 'Ouvert',
    hint: 'Visible, et l’adhésion est immédiate',
  },
  {
    value: 'prive',
    label: 'Privé',
    hint: 'Invisible : on entre uniquement par code ou invitation',
  },
];

interface GroupCreateFormProps {
  defaultPlace?: PlaceRef;
  leader: { uid: string; displayName: string; email: string | null; photoURL?: string | null };
  onCreate: (input: CreateGroupInput) => Promise<void>;
  onBack?: () => void;
}

export default function GroupCreateForm({
  defaultPlace,
  leader,
  onCreate,
  onBack,
}: GroupCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState<PlaceRef | undefined>(defaultPlace);
  const [mode, setMode] = useState<GroupMeetingMode>('hybride');
  const [rhythm, setRhythm] = useState<GroupRhythm>('hebdomadaire');
  const [weekday, setWeekday] = useState(4);
  const [time, setTime] = useState('20:00');
  const [venue, setVenue] = useState('');
  const [callLink, setCallLink] = useState('');
  const [capacity, setCapacity] = useState(GROUP_DEFAULT_CAPACITY);
  const [visibility, setVisibility] = useState<GroupVisibility>('sur_demande');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsVenue = mode !== 'ligne';
  const needsLink = mode !== 'presentiel';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError('Donnez un nom à votre groupe (au moins 3 caractères).');
      return;
    }
    if (!place) {
      setError('Indiquez où votre groupe se situe : c’est ce qui permet aux personnes proches de vous trouver.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        name,
        description:
          description.trim() ||
          `Un petit groupe qui parcourt Les Fondements ensemble à ${place.city}.`,
        place,
        capacity,
        visibility,
        leader,
        meeting: {
          mode,
          rhythm,
          weekday,
          time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
          venue: needsVenue ? venue.trim() || undefined : undefined,
          callLink: needsLink ? callLink.trim() || undefined : undefined,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La création a échoué. Réessayez.');
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-2xl verre px-4 py-3.5 text-sm text-parchemin-100 placeholder:text-parchemin-100/50 outline-none transition-colors focus:border-or-400/50';
  const legendClass =
    'block text-2xs font-bold uppercase tracking-[0.18em] text-or-300/80 mb-2.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div>
        <label className={legendClass}>Nom du groupe</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Cellule Emmaüs, Les Enracinés, Groupe du jeudi…"
          className={fieldClass}
          maxLength={48}
        />
      </div>

      <div>
        <label className={legendClass}>En deux phrases, à qui s’adresse ce groupe ?</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Ce que vous voulez que les gens sachent avant de frapper à la porte : l’ambiance, le profil, les enfants bienvenus ou non…"
          className={`${fieldClass} resize-none leading-relaxed`}
          maxLength={280}
        />
      </div>

      <PlacePicker
        value={place}
        onChange={setPlace}
        label="Où votre groupe se retrouve-t-il ?"
      />

      <div>
        <label className={legendClass}>Comment vous rencontrez-vous ?</label>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {MODES.map((option) => {
            const Icon = option.icon;
            const active = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={`rounded-2xl border p-3.5 text-left transition-all ${
                  active
                    ? 'border-or-400/70 bg-or-400/12'
                    : 'border-white/12 bg-white/[0.05] hover:border-white/25'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? 'text-or-300' : 'text-parchemin-100/50'}`}
                  strokeWidth={2}
                />
                <p
                  className={`mt-2 text-xs font-bold ${
                    active ? 'text-or-200' : 'text-parchemin-100/85'
                  }`}
                >
                  {option.label}
                </p>
                <p className="mt-0.5 text-2xs leading-snug text-parchemin-100/50">{option.hint}</p>
              </button>
            );
          })}
        </div>
        {mode === 'hybride' && (
          <p className="mt-2.5 rounded-xl bg-emerald-400/10 px-3 py-2 text-2xs leading-relaxed text-emerald-200/85">
            C’est le format le plus souple : ceux qui peuvent viennent sur place, les autres
            rejoignent la même rencontre en visio.
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={legendClass}>
            <CalendarDays className="mr-1 inline h-3 w-3" /> Jour de la rencontre
          </label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setWeekday(day.value)}
                className={`h-10 w-11 rounded-xl text-2xs font-bold transition-all ${
                  weekday === day.value
                    ? 'bg-or-400 text-encre-950'
                    : 'verre text-parchemin-100/70 hover:bg-white/12'
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={legendClass}>
            <Clock className="mr-1 inline h-3 w-3" /> Heure
          </label>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className={fieldClass}
          />
          <div className="mt-2.5 flex gap-2">
            {(['hebdomadaire', 'bimensuel'] as GroupRhythm[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRhythm(option)}
                className={`flex-1 rounded-xl py-2 text-2xs font-bold transition-all ${
                  rhythm === option
                    ? 'bg-or-400/20 text-or-200 ring-1 ring-or-400/50'
                    : 'verre text-parchemin-100/60 hover:bg-white/12'
                }`}
              >
                {option === 'hebdomadaire' ? 'Chaque semaine' : 'Une semaine sur deux'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rhythm === 'hebdomadaire' ? (
        <p className="rounded-xl border border-or-300/20 bg-or-400/8 px-3.5 py-2.5 text-2xs leading-relaxed text-or-100/80">
          Au rythme hebdomadaire, les 20 fiches représentent environ 5 mois — c’est la durée
          recommandée par le livret (p. 3).
        </p>
      ) : (
        <p className="rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2.5 text-2xs leading-relaxed text-parchemin-100/65">
          Une semaine sur deux, comptez environ 10 mois pour les 20 fiches. Le livret conseille le
          rythme hebdomadaire, mais l’assiduité compte plus que la vitesse.
        </p>
      )}

      {needsVenue && (
        <div>
          <label className={legendClass}>Lieu de rencontre</label>
          <input
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="Chez Sarah, 12 rue des Lilas — ou : salle du fond, à l’église"
            className={fieldClass}
          />
          <p className="mt-1.5 text-2xs text-parchemin-100/45">
            Visible uniquement des membres acceptés dans le groupe.
          </p>
        </div>
      )}

      {needsLink && (
        <div>
          <label className={legendClass}>Lien de visio</label>
          <input
            value={callLink}
            onChange={(event) => setCallLink(event.target.value)}
            placeholder="https://meet.google.com/… (vous pourrez l’ajouter plus tard)"
            className={fieldClass}
          />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={legendClass}>
            <Users className="mr-1 inline h-3 w-3" /> Taille maximale
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(
              { length: GROUP_MAX_CAPACITY - GROUP_MIN_CAPACITY + 1 },
              (_, i) => GROUP_MIN_CAPACITY + i
            ).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setCapacity(size)}
                className={`h-10 w-10 rounded-xl text-xs font-bold transition-all ${
                  capacity === size
                    ? 'bg-or-400 text-encre-950'
                    : 'verre text-parchemin-100/70 hover:bg-white/12'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <p className="mt-2 text-2xs leading-relaxed text-parchemin-100/45">
            Le livret recommande 5 à 6 personnes : assez pour la richesse des échanges, assez peu
            pour que chacun parle vraiment.
          </p>
        </div>

        <div>
          <label className={legendClass}>
            <Lock className="mr-1 inline h-3 w-3" /> Qui peut rejoindre ?
          </label>
          <div className="space-y-1.5">
            {VISIBILITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisibility(option.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                  visibility === option.value
                    ? 'border-or-400/60 bg-or-400/12'
                    : 'border-white/12 bg-white/[0.05] hover:border-white/25'
                }`}
              >
                <p
                  className={`text-xs font-bold ${
                    visibility === option.value ? 'text-or-200' : 'text-parchemin-100/85'
                  }`}
                >
                  {option.label}
                </p>
                <p className="text-2xs leading-snug text-parchemin-100/50">{option.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-500/12 px-3.5 py-2.5 text-2xs leading-relaxed text-rose-200">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-2xs font-bold text-parchemin-100/55 transition-colors hover:text-parchemin-100"
          >
            ← Revenir au choix
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bouton-or inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold disabled:opacity-70"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Création…' : 'Créer le groupe et ouvrir le parcours'}
        </button>
      </div>
    </form>
  );
}
