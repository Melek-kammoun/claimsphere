import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCreateContrat } from "@/hooks/use-contrats";
import { useVehicleEstimate } from "@/hooks/use-vehicle-estimate";
import { apiRequest } from "@/lib/api-client";

const OFFER_OPTIONS = [
  { label: "Serenite", value: "Serenite" },
  { label: "Securite+", value: "Securite+" },
  { label: "Super Securite", value: "Super Securite" },
  { label: "Securite", value: "Securite" },
] as const;

export default function ContractRequestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const estimateMutation = useVehicleEstimate();
  const createContratMutation = useCreateContrat();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    type: "Serenite",
    dateDebut: "",
    dureeType: "An",
    montantDeclare: "",
    vehiculeMarque: "",
    vehiculeModele: "",
    ageVehicule: "",
    kilometrage: "",
    immatriculationChiffres: "",
    immatriculationLettres: "",
  });
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);
  const [backendPrime, setBackendPrime] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ✅ GET CURRENT USER ID ON MOUNT
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiRequest<{ success: boolean; user: { id: string } }>("/users/me");
        const userId = response.user?.id;
        console.log("Current user ID:", userId);
        setCurrentUserId(userId || null);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos informations.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const estimateVehicleValue = async () => {
    if (
      !form.vehiculeMarque ||
      !form.vehiculeModele ||
      !form.ageVehicule ||
      !form.kilometrage ||
      !form.immatriculationChiffres ||
      !form.immatriculationLettres
    ) {
      setEstimateError("Veuillez renseigner la marque, le modele, la serie, l'age et le kilometrage.");
      return;
    }

    setEstimateError(null);

    try {
      const data = await estimateMutation.mutateAsync({
        marque: form.vehiculeMarque,
        modele: form.vehiculeModele,
        serie: `${form.immatriculationChiffres}${form.immatriculationLettres}`.trim(),
        age: Number(form.ageVehicule),
        kilometrage: Number(form.kilometrage),
        montantDeclare: form.montantDeclare ? Number(form.montantDeclare) : undefined,
        offer: form.type,
      });

      setEstimatedValue(data.estimatedValue);
      setBackendPrime(data.prime);
      setWarning(data.warning ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'estimer la valeur du vehicule.";
      setEstimateError(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!currentUserId) {
      setSubmitError("Erreur: Impossible de charger vos informations.");
      return;
    }

    try {
      await createContratMutation.mutateAsync({
        client_id: currentUserId, // ✅ USE CURRENT USER ID
        type: form.type,
        start_date: form.dateDebut || undefined,
        status: "non_traite",
        montant_declare: form.montantDeclare
          ? Number(form.montantDeclare)
          : undefined,
        marque: form.vehiculeMarque || undefined,
        modele: form.vehiculeModele || undefined,
        age: form.ageVehicule ? Number(form.ageVehicule) : undefined,
        kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
        serie: form.immatriculationChiffres
          ? Number(form.immatriculationChiffres)
          : undefined,
        num_voiture: form.immatriculationLettres
          ? Number(form.immatriculationLettres.replace(/\D/g, ""))
          : undefined,
        prime: backendPrime ?? undefined,
        valeur_estimee: estimatedValue ?? undefined,
      });

      toast({
        title: "Contrat cree",
        description: "La demande de contrat a ete envoyee.",
      });
      navigate("/dashboard/contracts");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de creer le contrat.";

      setSubmitError(message);
      toast({
        title: "Echec de creation",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Nouvelle souscription</h1>
        <p className="text-muted-foreground">Remplissez les champs ci-dessous pour simuler votre contrat.</p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6">
          {[
            { label: "Type de contrat", name: "type", type: "select" },
            { label: "Date debut", name: "dateDebut", type: "date" },
            { label: "Duree", name: "dureeType", type: "select" },
            { label: "Montant declare", name: "montantDeclare", type: "number" },
            { label: "Marque vehicule", name: "vehiculeMarque", type: "text" },
            { label: "Modele vehicule", name: "vehiculeModele", type: "text" },
            { label: "Age du vehicule (ans)", name: "ageVehicule", type: "number" },
            { label: "Kilometrage", name: "kilometrage", type: "number" },
            { label: "Immatriculation (4 chiffres)", name: "immatriculationChiffres", type: "text" },
            { label: "Immatriculation (3 lettres)", name: "immatriculationLettres", type: "text" },
          ].map((field) => (
            <div key={field.name} className="grid gap-1">
              <label className="text-sm font-medium text-foreground">{field.label}</label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={(form as Record<string, string>)[field.name]}
                  onChange={handleChange}
                  className="input w-full"
                >
                  {field.name === "type" ? (
                    OFFER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="An">An</option>
                      <option value="Mois">Mois</option>
                    </>
                  )}
                </select>
              ) : (
                <Input
                  value={(form as Record<string, string>)[field.name]}
                  onChange={handleChange}
                  name={field.name}
                  type={field.type as React.HTMLInputTypeAttribute}
                  className="w-full"
                />
              )}
            </div>
          ))}

          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-sm text-muted-foreground">Estimation retournee par le backend :</p>
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={estimateVehicleValue}
                disabled={estimateMutation.isPending}
              >
                {estimateMutation.isPending ? "Estimation..." : "Estimer depuis le backend"}
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Valeur estimee : {estimatedValue !== null ? `${estimatedValue.toFixed(2)} DH` : "Non estimee"}
            </p>
            <p className="text-sm text-muted-foreground">
              Prime backend : {backendPrime !== null ? `${backendPrime.toFixed(2)} DH` : "Non calculee"}
            </p>
            {warning ? <p className="mt-2 text-sm text-amber-700">{warning}</p> : null}
            {estimateError ? <p className="mt-2 text-sm text-red-600">{estimateError}</p> : null}
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <div className="flex gap-3">
            <Button type="submit" className="bg-primary text-primary-foreground">
              {createContratMutation.isPending
                ? "Envoi en cours..."
                : "Envoyer la demande"}
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate("/dashboard/contracts")}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}