import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Plus, Upload, Camera, FileText, MapPin,
  CheckCircle, Clock, XCircle, ChevronRight, QrCode, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ApiError, API_BASE_URL, apiRequest } from "@/lib/api-client";

const claims = [
  { id: "SN-2026-034", date: "12/02/2026", type: "Accident", status: "En traitement", vehicle: "Dacia Logan 2023", amount: "15 000 DH", aiSuggestion: "Remboursement partiel recommandé" },
  { id: "SN-2025-189", date: "28/11/2025", type: "Bris de glace", status: "Remboursé", vehicle: "Renault Clio 2021", amount: "2 500 DH", aiSuggestion: null },
  { id: "SN-2025-102", date: "05/08/2025", type: "Vol", status: "Refusé", vehicle: "Dacia Logan 2023", amount: "45 000 DH", aiSuggestion: "Anomalie détectée par l'IA" },
];

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  "En traitement": { color: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  "Remboursé": { color: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  "Refusé": { color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

interface ConstatFormData {
  fullName: string;
  phone: string;
  email: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  insuranceCompany: string;
  policyNumber: string;
  accidentDate: string;
  accidentTime: string;
  accidentLocation: string;
  accidentDescription: string;
}

export default function ClaimsPage() {
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<{ qrCode: string; scanUrl: string } | null>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ConstatFormData>({
    fullName: "",
    phone: "",
    email: "",
    plate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear().toString(),
    insuranceCompany: "",
    policyNumber: "",
    accidentDate: new Date().toISOString().slice(0, 10),
    accidentTime: new Date().toTimeString().slice(0, 5),
    accidentLocation: "",
    accidentDescription: "",
  });

  const handleFormChange = (field: keyof ConstatFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClaim(true);

    try {
      // Récupérer ou générer l'ID utilisateur
      const storageKey = "claimsphere_demo_user_id";
      let userId = localStorage.getItem(storageKey);
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem(storageKey, userId);
      }

      // Soumettre le constat avec les vraies données du formulaire
      const response = await apiRequest<{ constat: { qr_token: string }; qr_code: string; scan_url?: string }>("/constats", {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
        body: {
          user_a_data: {
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
          },
          vehicle_a_data: {
            plate: formData.plate,
            brand: formData.brand,
            model: formData.model,
            year: parseInt(formData.year) || new Date().getFullYear(),
          },
          insurance_a_data: {
            company: formData.insuranceCompany,
            policy_number: formData.policyNumber,
          },
          accident_details: {
            date: formData.accidentDate,
            time: formData.accidentTime,
            location: formData.accidentLocation,
            description: formData.accidentDescription,
          },
          photos_a: [],
          signature_a: "",
        },
      });

      // Utiliser uniquement l'URL publique renvoyée par le backend
      const scanUrl = response.scan_url;

      if (!scanUrl) {
        throw new Error("URL de scan manquante dans la réponse du backend.");
      }
      
      setGeneratedQr({ qrCode: response.qr_code, scanUrl });
      setShowNewClaim(false);

      toast({
        title: "Constat créé avec succès",
        description: "Un QR code a été généré. Partagez-le avec l'autre conducteur.",
      });
    } catch (error) {
      let description = "Impossible de créer le constat.";

      if (error instanceof ApiError && error.details && typeof error.details === "object") {
        const maybeMessage = (error.details as { message?: string }).message;
        if (maybeMessage) {
          description = maybeMessage;
        }
      }

      toast({
        title: "Erreur",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Gestion des sinistres</h2>
          <p className="text-muted-foreground text-sm">Déclarez et suivez vos sinistres en temps réel.</p>
        </div>
        <Dialog open={showNewClaim} onOpenChange={setShowNewClaim}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Déclarer un sinistre
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Déclaration de sinistre (Conducteur 1)</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">Remplissez vos informations. Un QR code sera généré après soumission.</p>
            </DialogHeader>
            <form onSubmit={handleSubmitClaim} className="space-y-4 mt-4">
              {/* Informations personnelles */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-sm mb-3">Vos informations</h4>
                <div>
                  <Label>Nom complet</Label>
                  <Input 
                    placeholder="Jean Dupont" 
                    value={formData.fullName}
                    onChange={(e) => handleFormChange("fullName", e.target.value)}
                    required
                  />
                </div>
                <div className="mt-2">
                  <Label>Téléphone</Label>
                  <Input 
                    placeholder="+212 6 XX XX XX XX" 
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                  />
                </div>
                <div className="mt-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    placeholder="jean@example.com" 
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                  />
                </div>
              </div>

              {/* Informations du véhicule */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-sm mb-3">Véhicule</h4>
                <div>
                  <Label>Immatriculation</Label>
                  <Input 
                    placeholder="AA-123-BB" 
                    value={formData.plate}
                    onChange={(e) => handleFormChange("plate", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label>Marque</Label>
                    <Input 
                      placeholder="Dacia" 
                      value={formData.brand}
                      onChange={(e) => handleFormChange("brand", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Modèle</Label>
                    <Input 
                      placeholder="Logan" 
                      value={formData.model}
                      onChange={(e) => handleFormChange("model", e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label>Année</Label>
                  <Input 
                    type="number"
                    placeholder={new Date().getFullYear().toString()}
                    value={formData.year}
                    onChange={(e) => handleFormChange("year", e.target.value)}
                  />
                </div>
              </div>

              {/* Informations d'assurance */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-sm mb-3">Assurance</h4>
                <div>
                  <Label>Compagnie d'assurance</Label>
                  <Input 
                    placeholder="ClaimSphere Assurance" 
                    value={formData.insuranceCompany}
                    onChange={(e) => handleFormChange("insuranceCompany", e.target.value)}
                  />
                </div>
                <div className="mt-2">
                  <Label>Numéro de police</Label>
                  <Input 
                    placeholder="POL-2026-0001" 
                    value={formData.policyNumber}
                    onChange={(e) => handleFormChange("policyNumber", e.target.value)}
                  />
                </div>
              </div>

              {/* Détails de l'accident */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-sm mb-3">Accident</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      value={formData.accidentDate}
                      onChange={(e) => handleFormChange("accidentDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Heure</Label>
                    <Input 
                      type="time"
                      value={formData.accidentTime}
                      onChange={(e) => handleFormChange("accidentTime", e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label>Lieu</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Casablanca" 
                      value={formData.accidentLocation}
                      onChange={(e) => handleFormChange("accidentLocation", e.target.value)}
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Décrivez les circonstances de l'accident..." 
                    rows={3}
                    value={formData.accidentDescription}
                    onChange={(e) => handleFormChange("accidentDescription", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowNewClaim(false)}>Annuler</Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
                  disabled={isSubmittingClaim}
                >
                  {isSubmittingClaim ? "Création en cours..." : "Créer le constat"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Code Section - Affichage après génération réussie */}
      {generatedQr && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-300 rounded-xl p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-display font-semibold text-emerald-900 text-sm">Constat créé avec succès</h4>
              <p className="text-xs text-emerald-700 mt-1">Un code QR a été généré. Partagez-le avec le conducteur 2 pour compléter le constat.</p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 p-4 flex items-center justify-center bg-white mb-4">
            <img src={generatedQr.qrCode} alt="QR code du constat" className="w-48 h-48" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-900">Lien direct (partager avec le conducteur 2):</p>
            <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded p-2 text-xs break-all">
              <code className="flex-1 text-emerald-700">{generatedQr.scanUrl}</code>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(generatedQr.scanUrl);
                  toast({ title: "Lien copié", description: "L'URL a été copiée dans le presse-papiers." });
                }}
              >
                📋
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* QR Code Info Banner - Avant génération */}
      {!generatedQr && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <QrCode className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-semibold text-foreground text-sm">Constat amiable numérique</h4>
            <p className="text-xs text-muted-foreground">Créez un nouveau constat pour générer un QR code à partager avec le conducteur 2.</p>
          </div>
        </motion.div>
      )}

      {/* Claims list */}
      <div className="space-y-4">
        {claims.map((claim, i) => {
          const config = statusConfig[claim.status];
          const StatusIcon = config.icon;
          return (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl border shadow-card p-5"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-semibold text-foreground">{claim.id}</span>
                      <Badge variant="outline" className={config.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {claim.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{claim.vehicle} · {claim.type} · {claim.date}</p>
                    <p className="text-sm font-medium text-foreground mt-1">Montant estimé: {claim.amount}</p>
                    {claim.aiSuggestion && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-md">
                        🤖 IA: {claim.aiSuggestion}
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="self-start">
                  <Eye className="w-4 h-4 mr-1" /> Détails
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
