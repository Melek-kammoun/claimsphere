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

// FIX: Calculate end_date from start_date + duration
function calcEndDate(startDate: string, dureeType: string): string | undefined {
  if (!startDate) return undefined;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return undefined;
  if (dureeType === "An") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split("T")[0];
}

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
    // FIX: kept as strings — serie is alphanumeric (e.g. "1234TUN")
    immatriculationChiffres: "",
    immatriculationLettres: "",
  });

  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);
  const [backendPrime, setBackendPrime] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiRequest<{ success: boolean; user: { id: string } }>("/users/me");
        setCurrentUserId(response.user?.id ?? null);
      } catch {
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
    // FIX: reset estimate when vehicle fields change so stale values aren't submitted
    const vehicleFields = ["vehiculeMarque", "vehiculeModele", "ageVehicule", "kilometrage",
      "immatriculationChiffres", "immatriculationLettres", "montantDeclare", "type"];
    if (vehicleFields.includes(name)) {
      setEstimatedValue(null);
      setBackendPrime(null);
      setWarning(null);
    }
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
      // FIX: serie is a string concatenation, not a number
      const serie = `${form.immatriculationChiffres}${form.immatriculationLettres}`.trim();
      const data = await estimateMutation.mutateAsync({
        marque: form.vehiculeMarque,
        modele: form.vehiculeModele,
        serie,
        age: Number(form.ageVehicule),
        kilometrage: Number(form.kilometrage),
        montantDeclare: form.montantDeclare ? Number(form.montantDeclare) : undefined,
        offer: form.type || "Serenite",
      });

      if (!data || typeof data.estimatedValue !== "number") {
        throw new Error("Réponse d'estimation invalide");
      }
      setEstimatedValue(data.estimatedValue);
      setBackendPrime(data.prime);
      setWarning(data.warning ?? null);
    } catch (error) {
      setEstimateError(
        error instanceof Error ? error.message : "Impossible d'estimer la valeur du vehicule."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!currentUserId) {
      setSubmitError("Erreur: Impossible de charger vos informations.");
      return;
    }

    // FIX: require estimation before submit
    if (estimatedValue === null || backendPrime === null) {
      setSubmitError("Veuillez d'abord estimer la valeur du vehicule.");
      return;
    }

    // FIX: calculate end_date from start_date + duration
    const endDate = calcEndDate(form.dateDebut, form.dureeType);

    // FIX: serie stays as string; num_voiture removed (redundant / wrong cast)
    const serie = `${form.immatriculationChiffres}${form.immatriculationLettres}`.trim() || undefined;

    try {
      await createContratMutation.mutateAsync({
        client_id: currentUserId,
        type: form.type.trim() || "Serenite",
        start_date: form.dateDebut || undefined,
        end_date: endDate,           // FIX: now properly sent
        status: "non_traite",
        montant_declare: form.montantDeclare ? Number(form.montantDeclare) : undefined,
        marque: form.vehiculeMarque || undefined,
        modele: form.vehiculeModele || undefined,
        age: form.ageVehicule ? Number(form.ageVehicule) : undefined,
        kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
        serie,                       // FIX: string, not number
        prime: backendPrime,
        valeur_estimee: estimatedValue,
      });

      toast({ title: "Contrat cree", description: "La demande de contrat a ete envoyee." });
      navigate("/dashboard/contracts");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de creer le contrat.";
      setSubmitError(message);
      toast({ title: "Echec de creation", description: message, variant: "destructive" });
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
            { label: "Immatriculation (3 chiffres)", name: "immatriculationLettres", type: "text" },
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
                  {field.name === "type"
                    ? OFFER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
                    : (
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
            <p className="text-sm text-muted-foreground">Proposition :</p>
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={estimateVehicleValue}
                disabled={estimateMutation.isPending}
              >
                {estimateMutation.isPending ? "Estimation..." : "Proposition "}
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Valeur estimée : {estimatedValue !== null ? `${estimatedValue.toFixed(2)} TND` : "Non estimee"}
            </p>
            <p className="text-sm text-muted-foreground">
              Prime estimée : {backendPrime !== null ? `${backendPrime.toFixed(2)} TND` : "Non calculee"}
            </p>
            {/* FIX: show computed end date for transparency */}
            {form.dateDebut && (
              <p className="text-sm text-muted-foreground">
                Date de fin : {calcEndDate(form.dateDebut, form.dureeType) ?? "—"}
              </p>
            )}
            {warning && <p className="mt-2 text-sm text-amber-700">{warning}</p>}
            {estimateError && <p className="mt-2 text-sm text-red-600">{estimateError}</p>}
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex gap-3">
            <Button type="submit" className="bg-primary text-primary-foreground" disabled={createContratMutation.isPending}>
              {createContratMutation.isPending ? "Envoi en cours..." : "Envoyer la demande"}
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