'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Envoie un enregistrement audio à l'API Whisper côté serveur pour transcription française rapide.
 */
export async function transcrireAudioViaApi(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, 'dictation.webm');

  const response = await fetch('/api/transcription', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors de la transcription');
  }

  const data = (await response.json()) as { text?: string };
  return (data.text || '').trim();
}

/**
 * Hook React pour enregistrer la voix et la transcrire automatiquement via Whisper.
 */
export function useEnregistreurVocal(onTranscriptionReussie?: (texte: string) => void) {
  const [estEnregistrement, setEstEnregistrement] = useState(false);
  const [estEnTranscription, setEstEnTranscription] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const arreterFlux = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const annuler = useCallback(() => {
    if (mediaRecorderRef.current && estEnregistrement) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    arreterFlux();
    setEstEnregistrement(false);
    setEstEnTranscription(false);
    setSecondes(0);
    setErreur(null);
  }, [estEnregistrement, arreterFlux]);

  const demarrer = useCallback(async () => {
    setErreur(null);
    setSecondes(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        } else {
          mimeType = '';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start(250);
      setEstEnregistrement(true);

      timerRef.current = window.setInterval(() => {
        setSecondes((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error('Erreur accès microphone:', err);
      const nom = err instanceof Error ? err.name : '';
      setErreur(
        nom === 'NotAllowedError' || nom === 'PermissionDeniedError'
          ? 'Microphone non autorisé. Merci de donner l’accès au micro dans votre navigateur.'
          : 'Impossible d’accéder au microphone.'
      );
    }
  }, []);

  const arreterEtTranscrire = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !estEnregistrement) return null;

    setEstEnregistrement(false);
    setEstEnTranscription(true);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        setEstEnTranscription(false);
        resolve(null);
        return;
      }

      recorder.onstop = async () => {
        arreterFlux();
        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        if (audioBlob.size === 0) {
          setEstEnTranscription(false);
          resolve(null);
          return;
        }

        try {
          const texte = await transcrireAudioViaApi(audioBlob);
          if (texte) {
            onTranscriptionReussie?.(texte);
          }
          setEstEnTranscription(false);
          resolve(texte);
        } catch (err: unknown) {
          console.warn('Échec transcription Whisper, tentative repli WebSpeech...', err);
          setErreur('Transcription non disponible, veuillez saisir votre réponse au clavier.');
          setEstEnTranscription(false);
          resolve(null);
        }
      };

      recorder.stop();
    });
  }, [estEnregistrement, arreterFlux, onTranscriptionReussie]);

  useEffect(() => {
    return () => {
      arreterFlux();
    };
  }, [arreterFlux]);

  return {
    estEnregistrement,
    estEnTranscription,
    secondes,
    erreur,
    demarrer,
    arreterEtTranscrire,
    annuler,
  };
}
