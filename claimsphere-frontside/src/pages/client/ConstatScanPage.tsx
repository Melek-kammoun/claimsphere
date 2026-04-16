import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock3, QrCode, Eye, EyeOff, Loader } from "lucide-react";
import { API_BASE_URL, apiRequest } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ConstatScanResponse = {
  constat: {
    id: string;
    reference: string | null;
    statut: string;
    date_accident: string | null;
    lieu_accident: string | null;
    description_accident: string | null;
  };
  parties?: Array<{
    id: string;
    role: string;
    nom: string | null;
    prenom: string | null;
    telephone: string | null;
    immatriculation: string | null;
    marque: string | null;
    modele: string | null;
    annee: number | null;
    compagnie_assurance: string | null;
    num_assurance: string | null;
  }>;
  ready_to_complete: boolean;
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
}

export default function ConstatScanPage() {
  const { token } = useParams();
  const [data, setData] = useState<ConstatScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
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
  });

  const handleFormChange = (field: keyof ConstatFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!token) {
      setError("Token QR manquant.");
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/constats/scan/${token}`);
        const payload = await response.json();

        if (!response.ok) {
          const message =
            typeof payload?.message === "string"
              ? payload.message
              : "Impossible de récupérer le constat.";
          throw new Error(message);
        }

        setData(payload as ConstatScanResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [token]);

  const handleSubmitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);

    try {
      // Récupérer ou générer l'ID utilisateur
      const storageKey = "claimsphere_demo_user_id";
      let userId = localStorage.getItem(storageKey);
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem(storageKey, userId);
      }

      // Soumettre la complétion du constat
      await apiRequest(`/constats/complete/${token}`, {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
        body: {
          user_b_data: {
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
          },
          vehicle_b_data: {
            plate: formData.plate,
            brand: formData.brand,
            model: formData.model,
            year: parseInt(formData.year) || new Date().getFullYear(),
          },
          insurance_b_data: {
            company: formData.insuranceCompany,
            policy_number: formData.policyNumber,
          },
          photos_b: [],
          signature_b: "",
        },
      });

      toast({
        title: "Constat complété",
        description: "Le constat a été enregistré avec vos informations. Merci !",
      });

      // Recharger après 2 secondes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const accidentDateLabel = useMemo(() => {
    if (!data?.constat.date_accident) return "Non précisée";
    const d = new Date(data.constat.date_accident);
    if (Number.isNaN(d.getTime())) return data.constat.date_accident;
    return d.toLocaleString("fr-FR");
  }, [data]);

  const partyA = useMemo(
    () => data?.parties?.find((p) => p.role === "A"),
    [data]
  );

  return (
    <div className="min-h-screen bg-background p-6 sm:p-10">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Constat amiable numérique</h1>
              <p className="text-sm text-muted-foreground">Complétion du constat par le second conducteur</p>
            </div>
          </div>

          {loading && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock3 className="w-4 h-4" /> Chargement du constat...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {data && !error && (
          <div className="space-y-6">
            {/* Infos du constat et du conducteur 1 */}
            <div className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Informations du constat</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" /> Masquer
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" /> Afficher
                    </>
                  )}
                </Button>
              </div>

              {showDetails && (
                <div className="space-y-3 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Référence</p>
                      <p className="font-medium">{data.constat.reference || data.constat.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Statut</p>
                      <p className="font-medium">{data.constat.statut}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date/heure</p>
                      <p className="font-medium">{accidentDateLabel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lieu</p>
                      <p className="font-medium">{data.constat.lieu_accident || "Non précisé"}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-muted-foreground text-sm mb-2">Description</p>
                    <p className="text-sm">{data.constat.description_accident || "Non précisée"}</p>
                  </div>

                  {partyA && (
                    <div className="border-t pt-4 bg-primary/5 rounded p-4">
                      <h4 className="font-semibold text-sm mb-3">Conducteur 1 - Infos fournie</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Nom</p>
                          <p className="font-medium">
                            {partyA.prenom} {partyA.nom}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{partyA.telephone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Véhicule</p>
                          <p className="font-medium">
                            {partyA.marque} {partyA.modele} ({partyA.annee})
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Plaque</p>
                          <p className="font-medium">{partyA.immatriculation || "—"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Assurance</p>
                          <p className="font-medium">{partyA.compagnie_assurance}</p>
                          <p className="text-xs text-muted-foreground">{partyA.num_assurance}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Formulaire du conducteur 2 */}
            <div className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-semibold mb-4">Vos informations (Conducteur 2)</h2>

              <form onSubmit={handleSubmitComplete} className="space-y-4">
                {/* Informations personnelles */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-sm mb-3">Informations personnelles</h4>
                  <div className="space-y-2">
                    <div>
                      <Label>Nom complet</Label>
                      <Input
                        placeholder="Jean Martin"
                        value={formData.fullName}
                        onChange={(e) => handleFormChange("fullName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        placeholder="+212 6 XX XX XX XX"
                        value={formData.phone}
                        onChange={(e) => handleFormChange("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="jean@example.com"
                        value={formData.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Informations du véhicule */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-sm mb-3">Véhicule</h4>
                  <div className="space-y-2">
                    <div>
                      <Label>Immatriculation</Label>
                      <Input
                        placeholder="AA-456-CC"
                        value={formData.plate}
                        onChange={(e) => handleFormChange("plate", e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Marque</Label>
                        <Input
                          placeholder="Renault"
                          value={formData.brand}
                          onChange={(e) => handleFormChange("brand", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Modèle</Label>
                        <Input
                          placeholder="Clio"
                          value={formData.model}
                          onChange={(e) => handleFormChange("model", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Année</Label>
                      <Input
                        type="number"
                        placeholder={new Date().getFullYear().toString()}
                        value={formData.year}
                        onChange={(e) => handleFormChange("year", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Informations d'assurance */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">Assurance</h4>
                  <div className="space-y-2">
                    <div>
                      <Label>Compagnie d'assurance</Label>
                      <Input
                        placeholder="AXA, Allianz, etc."
                        value={formData.insuranceCompany}
                        onChange={(e) => handleFormChange("insuranceCompany", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Numéro de police</Label>
                      <Input
                        placeholder="POL-2026-XXXX"
                        value={formData.policyNumber}
                        onChange={(e) => handleFormChange("policyNumber", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.history.back()}
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" /> Envoi...
                      </>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Valider et enregistrer
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
