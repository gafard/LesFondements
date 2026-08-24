'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import { GeolocationRefused, locateMe, searchPlaces } from '@/lib/geo';
import type { PlaceRef } from '@/lib/types';

interface PlacePickerProps {
  value?: PlaceRef;
  onChange: (place: PlaceRef) => void;
  /** Palette : sur fond nuit ou sur fond parchemin. */
  tone?: 'nuit' | 'clair';
  autoFocus?: boolean;
  label?: string;
}

/**
 * Choix d'un point de repère géographique : soit le GPS du navigateur, soit
 * une ville de l'annuaire embarqué. Aucune requête réseau : la recherche et
 * le rapprochement à la ville la plus proche se font en local.
 */
export default function PlacePicker({
  value,
  onChange,
  tone = 'nuit',
  autoFocus = false,
  label = 'Où vivez-vous ?',
}: PlacePickerProps) {
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchPlaces(query, 7), [query]);
  const nuit = tone === 'nuit';

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleLocate = async () => {
    setLocating(true);
    setError(null);
    try {
      const place = await locateMe();
      onChange(place);
      setQuery('');
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof GeolocationRefused
          ? err.message
          : "Localisation impossible. Choisissez votre ville dans la liste."
      );
    } finally {
      setLocating(false);
    }
  };

  const pick = (place: PlaceRef) => {
    onChange(place);
    setQuery('');
    setOpen(false);
    setError(null);
  };

  return (
    <div className="w-full">
      <label
        className={`block text-2xs font-bold uppercase tracking-[0.18em] mb-2.5 ${
          nuit ? 'text-or-300/80' : 'text-encre-500'
        }`}
      >
        {label}
      </label>

      {value ? (
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${
            nuit
              ? 'verre text-parchemin-100'
              : 'bg-white border border-parchemin-400 text-encre-900'
          }`}
        >
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              nuit ? 'bg-or-400/15 text-or-300' : 'bg-or-100 text-or-700'
            }`}
          >
            <MapPin className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-sm font-bold">{value.label}</p>
            <p className={`text-2xs ${nuit ? 'text-parchemin-100/55' : 'text-encre-400'}`}>
              {value.precise
                ? 'Position approchée depuis votre appareil'
                : `${value.region ? `${value.region} · ` : ''}${value.country}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 30);
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-2xs font-bold transition-colors ${
              nuit
                ? 'bg-white/10 text-parchemin-100 hover:bg-white/20'
                : 'bg-parchemin-100 text-encre-700 hover:bg-parchemin-200'
            }`}
          >
            Modifier
          </button>
        </div>
      ) : null}

      {(!value || open) && (
        <div className={value ? 'mt-3' : ''}>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold transition-all disabled:opacity-60 ${
                nuit
                  ? 'verre text-or-200 hover:bg-white/12'
                  : 'border border-or-300 bg-or-50 text-or-700 hover:bg-or-100'
              }`}
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" strokeWidth={2} />
              )}
              {locating ? 'Localisation…' : 'Me localiser'}
            </button>

            <div className="relative flex-1">
              <Search
                className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
                  nuit ? 'text-parchemin-100/40' : 'text-encre-300'
                }`}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ou tapez votre ville — Lyon, Abidjan, Montréal…"
                className={`w-full rounded-2xl py-3.5 pl-10 pr-9 text-sm outline-none transition-all ${
                  nuit
                    ? 'verre text-parchemin-100 placeholder:text-parchemin-100/35 focus:border-or-400/50'
                    : 'border border-parchemin-400 bg-white text-encre-900 placeholder:text-encre-300 focus:border-or-400'
                }`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 ${
                    nuit ? 'text-parchemin-100/50 hover:text-parchemin-100' : 'text-encre-300 hover:text-encre-600'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {results.length > 0 && (
            <ul
              className={`mt-2.5 overflow-hidden rounded-2xl ${
                nuit ? 'verre' : 'border border-parchemin-400 bg-white'
              }`}
            >
              {results.map((place) => {
                const selected =
                  value?.city === place.city && value?.countryCode === place.countryCode;
                return (
                  <li key={`${place.city}-${place.countryCode}-${place.lat}`}>
                    <button
                      type="button"
                      onClick={() => pick(place)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        nuit ? 'hover:bg-white/10' : 'hover:bg-parchemin-100'
                      }`}
                    >
                      <MapPin
                        className={`h-3.5 w-3.5 shrink-0 ${nuit ? 'text-or-300/70' : 'text-or-600'}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-semibold ${
                            nuit ? 'text-parchemin-100' : 'text-encre-900'
                          }`}
                        >
                          {place.city}
                        </span>
                        <span
                          className={`block truncate text-2xs ${
                            nuit ? 'text-parchemin-100/50' : 'text-encre-400'
                          }`}
                        >
                          {place.region ? `${place.region} · ` : ''}
                          {place.country}
                        </span>
                      </span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-or-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {query.length >= 2 && results.length === 0 && (
            <p className={`mt-2.5 text-2xs ${nuit ? 'text-parchemin-100/50' : 'text-encre-400'}`}>
              Aucune ville trouvée. Essayez la grande ville la plus proche — c&apos;est suffisant
              pour trouver les groupes autour de vous.
            </p>
          )}

          {error && (
            <p
              className={`mt-2.5 rounded-xl px-3 py-2 text-2xs leading-relaxed ${
                nuit ? 'bg-rose-500/12 text-rose-200' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
