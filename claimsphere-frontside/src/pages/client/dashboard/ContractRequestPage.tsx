import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVehicleEstimate } from "@/hooks/use-vehicle-estimate";
import { apiRequest } from "@/lib/api-client";

const OFFER_OPTIONS = [
  { label: "Serenite", value: "Serenite" },
  { label: "Securite+", value: "Securite+" },
  { label: "Super Securite", value: "Super Securite" },
  { label: "Securite", value: "Securite" },
] as const;

const calculateEndDate = (startDate: string, dureeType: string): string => {
  const date = new Date(startDate);
  if (dureeType === "An") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date.toISOString().split("T")[0];
};

export default function ContractRequestPage() {
  const navigate = useNavigate();
  const estimateMutation = useVehicleEstimate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setSubmitting(true);
    try {
      await apiRequest("/contracts", {
        method: "POST",
        body: {
          type: form.type,
          start_date: form.dateDebut,
          end_date: calculateEndDate(form.dateDebut, form.dureeType),
          status: "En attente",
          montant_declare: Number(form.montantDeclare),
          marque: `${form.vehiculeMarque} ${form.vehiculeModele}`.trim(),
        },
      });
      navigate("/dashboard/contracts");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erreur lors de la création du contrat.");
    } finally {
      setSubmitting(false);
    }
  };

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
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
              {submitting ? "Envoi en cours..." : "Envoyer la demande"}
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