/**
 * Services et Hooks React pour l'intégration du flux QR Code Constats
 * À utiliser dans claimsphere-frontside/src/services et hooks
 */

// ============================================
// service/constatService.ts
// ============================================

import { AxiosInstance } from 'axios';

export interface ConstatData {
  id: string;
  qr_token: string;
  status: 'en_attente' | 'complet' | 'valide' | 'rejete';
  user_a_data?: any;
  user_b_data?: any;
  vehicle_a_data?: any;
  vehicle_b_data?: any;
  insurance_a_data?: any;
  insurance_b_data?: any;
  accident_details: any;
  created_at: string;
  updated_at: string;
  qr_expires_at: string;
  pdf_url?: string;
}

export interface CreateConstatPayload {
  user_a_data: {
    full_name: string;
    phone: string;
    email: string;
    driving_license?: string;
  };
  vehicle_a_data: {
    plate: string;
    brand: string;
    model: string;
    year?: number;
    vin?: string;
    registration_date?: string;
  };
  insurance_a_data: {
    company: string;
    policy_number: string;
    agent_name?: string;
    agent_phone?: string;
  };
  accident_details: {
    date: string;
    time: string;
    location: string;
    description: string;
    witnesses?: string[];
    police_report?: string;
  };
  photos_a?: string[];
  signature_a: string;
}

export interface CompleteConstatPayload {
  user_b_data: {
    full_name: string;
    phone: string;
    email: string;
    driving_license?: string;
  };
  vehicle_b_data: {
    plate: string;
    brand: string;
    model: string;
    year?: number;
    vin?: string;
    registration_date?: string;
  };
  insurance_b_data: {
    company: string;
    policy_number: string;
    agent_name?: string;
    agent_phone?: string;
  };
  photos_b?: string[];
  signature_b: string;
}

export class ConstatService {
  constructor(private api: AxiosInstance) {}

  /**
   * Créer un nouveau constat (User A)
   */
  async createConstat(payload: CreateConstatPayload): Promise<{
    constat: ConstatData;
    qr_code: string;
  }> {
    const response = await this.api.post('/constats', payload);
    return response.data;
  }

  /**
   * Scanner le QR Code (User B - Public)
   */
  async scanQrCode(qrToken: string): Promise<{
    constat: ConstatData;
    qr_code: string;
    ready_to_complete: boolean;
  }> {
    const response = await this.api.get(`/constats/scan/${qrToken}`, {
      // Pas d'en-tête d'authorization pour les requêtes publiques
      headers: {
        'X-Skip-Auth': 'true',
      },
    });
    return response.data;
  }

  /**
   * Compléter le constat (User B)
   */
  async completeConstat(
    qrToken: string,
    payload: CompleteConstatPayload
  ): Promise<ConstatData> {
    const response = await this.api.post(
      `/constats/complete/${qrToken}`,
      payload
    );
    return response.data;
  }

  /**
   * Récupérer un constat par ID
   */
  async getConstat(constatId: string): Promise<ConstatData> {
    const response = await this.api.get(`/constats/${constatId}`);
    return response.data;
  }

  /**
   * Lister tous les constats de l'utilisateur
   */
  async listConstats(): Promise<ConstatData[]> {
    const response = await this.api.get(`/constats`);
    return response.data;
  }

  /**
   * Renvoyer le QR Code
   */
  async resendQrCode(constatId: string): Promise<{
    qr_token: string;
    qr_code: string;
    expires_at: string;
  }> {
    const response = await this.api.post(
      `/constats/${constatId}/resend-qr`
    );
    return response.data;
  }

  /**
   * Télécharger le PDF du constat
   */
  async downloadPdf(pdfUrl: string): Promise<Blob> {
    const response = await this.api.get(pdfUrl, {
      responseType: 'blob',
    });
    return response.data;
  }
}

// ============================================
// hooks/useConstat.ts
// ============================================

import { useState, useCallback } from 'react';
import { useAxios } from '@/hooks/useAxios';
import { ConstatService, CreateConstatPayload, CompleteConstatPayload, ConstatData } from '@/services/constatService';

interface UseConstatState {
  constat: ConstatData | null;
  constats: ConstatData[];
  qrCode: string | null;
  loading: boolean;
  error: string | null;
}

export const useConstat = () => {
  const api = useAxios();
  const constatService = new ConstatService(api);

  const [state, setState] = useState<UseConstatState>({
    constat: null,
    constats: [],
    qrCode: null,
    loading: false,
    error: null,
  });

  // Créer un constat
  const createConstat = useCallback(
    async (payload: CreateConstatPayload) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { constat, qr_code } = await constatService.createConstat(
          payload
        );
        setState((prev) => ({
          ...prev,
          constat,
          qrCode: qr_code,
          loading: false,
        }));
        return { constat, qr_code };
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    [constatService]
  );

  // Scanner QR Code
  const scanQrCode = useCallback(
    async (qrToken: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await constatService.scanQrCode(qrToken);
        setState((prev) => ({
          ...prev,
          constat: data.constat,
          qrCode: data.qr_code,
          loading: false,
        }));
        return data;
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    [constatService]
  );

  // Compléter le constat
  const completeConstat = useCallback(
    async (qrToken: string, payload: CompleteConstatPayload) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const constat = await constatService.completeConstat(qrToken, payload);
        setState((prev) => ({
          ...prev,
          constat,
          loading: false,
        }));
        return constat;
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    [constatService]
  );

  // Récupérer un constat
  const getConstat = useCallback(
    async (constatId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const constat = await constatService.getConstat(constatId);
        setState((prev) => ({
          ...prev,
          constat,
          loading: false,
        }));
        return constat;
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    [constatService]
  );

  // Lister les constats
  const listConstats = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const constats = await constatService.listConstats();
      setState((prev) => ({
        ...prev,
        constats,
        loading: false,
      }));
      return constats;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
      throw error;
    }
  }, [constatService]);

  // Renvoyer QR Code
  const resendQrCode = useCallback(
    async (constatId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await constatService.resendQrCode(constatId);
        setState((prev) => ({
          ...prev,
          qrCode: result.qr_code,
          loading: false,
        }));
        return result;
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message;
        setState((prev) => ({ ...prev, error: errorMsg, loading: false }));
        throw error;
      }
    },
    [constatService]
  );

  return {
    ...state,
    createConstat,
    scanQrCode,
    completeConstat,
    getConstat,
    listConstats,
    resendQrCode,
  };
};

// ============================================
// hooks/useQrCodeScanner.ts
// ============================================

import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';

interface UseQrCodeScannerState {
  isScanning: boolean;
  qrCode: string | null;
  error: string | null;
}

export const useQrCodeScanner = (videoElementId: string) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<UseQrCodeScannerState>({
    isScanning: false,
    qrCode: null,
    error: null,
  });

  const startScanning = async () => {
    try {
      setState((prev) => ({ ...prev, isScanning: true, error: null }));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      const videoElement = document.getElementById(
        videoElementId
      ) as HTMLVideoElement;
      if (!videoElement) {
        throw new Error('Élément vidéo non trouvé');
      }

      videoElement.srcObject = stream;
      videoRef.current = videoElement;

      // Scanner la vidéo
      scanVideo(videoElement);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Erreur d\'accès à la caméra',
        isScanning: false,
      }));
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setState((prev) => ({ ...prev, isScanning: false }));
    }
  };

  const scanVideo = (videoElement: HTMLVideoElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scan = () => {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        ctx?.drawImage(videoElement, 0, 0);

        const imageData = ctx?.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            // QR Code trouvé - extraire le token
            const match = code.data.match(/\/([a-f0-9\-]{36})$/);
            if (match) {
              setState((prev) => ({
                ...prev,
                qrCode: match[1],
              }));
              return; // Arrêter le scan
            }
          }
        }
      }

      if (state.isScanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  return {
    ...state,
    startScanning,
    stopScanning,
    videoRef,
  };
};

// ============================================
// lib/signatureCanvas.ts
// ============================================

export class SignatureCanvas {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private isDrawing = false;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement;
    this.context = canvasElement.getContext('2d')!;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) =>
      this.startDrawing(e)
    );
    this.canvas.addEventListener('mousemove', (e) =>
      this.draw(e)
    );
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
  }

  private startDrawing(e: MouseEvent) {
    this.isDrawing = true;
    const { x, y } = this.getCoordinates(e);
    this.context.beginPath();
    this.context.moveTo(x, y);
  }

  private draw(e: MouseEvent) {
    if (!this.isDrawing) return;

    const { x, y } = this.getCoordinates(e);
    this.context.lineTo(x, y);
    this.context.strokeStyle = '#000';
    this.context.lineWidth = 2;
    this.context.stroke();
  }

  private stopDrawing() {
    this.isDrawing = false;
  }

  private getCoordinates(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  public getSignatureDataUrl(): string {
    return this.canvas.toDataURL('image/png');
  }

  public clear() {
    this.context.clearRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  public isEmpty(): boolean {
    const imageData = this.context.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    return imageData.data.every((pixel) => pixel === 0);
  }
}

// ============================================
// Components Examples
// ============================================

/**
 * Exemple d'utilisation dans un composant React
 */

import React, { useState } from 'react';

export const CreateConstatForm: React.FC = () => {
  const { createConstat, loading, error, qrCode } = useConstat();
  const [formData, setFormData] = useState<CreateConstatPayload>({
    user_a_data: { full_name: '', phone: '', email: '' },
    vehicle_a_data: { plate: '', brand: '', model: '' },
    insurance_a_data: { company: '', policy_number: '' },
    accident_details: {
      date: '',
      time: '',
      location: '',
      description: '',
    },
    signature_a: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createConstat(formData);
      console.log('Constat créé:', result.constat.id);
      // Afficher le QR Code
      alert('Constat créé avec succès! QR Code généré.');
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire User A */}
      <fieldset>
        <legend>Vos informations</legend>
        <input
          type="text"
          placeholder="Nom complet"
          value={formData.user_a_data.full_name}
          onChange={(e) =>
            setFormData({
              ...formData,
              user_a_data: {
                ...formData.user_a_data,
                full_name: e.target.value,
              },
            })
          }
          required
        />
        {/* Autres champs... */}
      </fieldset>

      <button type="submit" disabled={loading}>
        {loading ? 'Création en cours...' : 'Créer le constat'}
      </button>

      {error && <div className="error">{error}</div>}

      {qrCode && (
        <div>
          <p>Votre QR Code de constat:</p>
          <img src={qrCode} alt="QR Code" />
        </div>
      )}
    </form>
  );
};

export const ScanConstatForm: React.FC = () => {
  const { scanQrCode, completeConstat, loading, error, constat } =
    useConstat();
  const { startScanning, stopScanning, isScanning, qrCode } =
    useQrCodeScanner('video');

  const [step, setStep] = useState<'scan' | 'complete'>('scan');
  const [completeData, setCompleteData] = useState<CompleteConstatPayload>({
    user_b_data: { full_name: '', phone: '', email: '' },
    vehicle_b_data: { plate: '', brand: '', model: '' },
    insurance_b_data: { company: '', policy_number: '' },
    signature_b: '',
  });

  const handleQrScanned = async () => {
    if (qrCode) {
      try {
        await scanQrCode(qrCode);
        setStep('complete');
        stopScanning();
      } catch (err) {
        console.error('Erreur:', err);
      }
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qrCode) {
      try {
        await completeConstat(qrCode, completeData);
        alert('Constat complété! PDF envoyé par email.');
      } catch (err) {
        console.error('Erreur:', err);
      }
    }
  };

  return (
    <div>
      {step === 'scan' ? (
        <div>
          <video id="video" width="300" height="300" />
          <button onClick={startScanning}>Démarrer le scan</button>
          <button onClick={stopScanning} disabled={!isScanning}>
            Arrêter le scan
          </button>
          <button onClick={handleQrScanned} disabled={!qrCode}>
            QR Scané: {qrCode}
          </button>
        </div>
      ) : (
        <form onSubmit={handleComplete}>
          <h2>Vos informations (User B)</h2>
          {/* Formulaire User B */}
          <button type="submit" disabled={loading}>
            {loading ? 'Complétant...' : 'Compléter le constat'}
          </button>
        </form>
      )}

      {constat && (
        <div>
          <h3>Informations User A:</h3>
          <p>Nom: {constat.user_a_data?.full_name}</p>
          <p>Véhicule: {constat.vehicle_a_data?.brand}</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};
