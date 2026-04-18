import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Plus,
  QrCode,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, ApiError, apiRequest } from "@/lib/api-client";

type ClaimStatus = "pending" | "in_review" | "documents_requested" | "approved" | "rejected";

interface Claim {
  id: string;
  reference: string;
  date: string;
  type: string;
  status: ClaimStatus;
  vehicle: string | null;
  amount: number | null;
  location?: string | null;
}

interface Contract {
  id: string | number;
  type: string;
  status: string;
  marque?: string;
  modele?: string;
  serie?: string;
  contract_number?: string;
}

interface ClaimsResponse {
  success: boolean;
  data: Claim[];
  total: number;
}

interface WorkflowStartResponse {
  success: boolean;
  data: {
    qr_token: string;
    qr_code: string;
    scan_url: string;
    constat: {
      id: string;
      qr_token: string;
      reference: string;
    };
  };
}

interface WorkflowCompleteResponse {
  success: boolean;
  data: {
    claim: Claim;
    orchestration: {
      decision_support: {
        decision: "approve" | "reject" | "review";
        risk_level: "low" | "medium" | "high";
        recommended_payout: number;
        reasoning: string;
      };
      consolidated_claim_data: {
        constat: {
          status: string | null;
          second_party: unknown | null;
        };
      };
    };
  };
}

type WorkflowStep = "claim" | "qr" | "uploads" | "done";
type FinalizationCheckpoint = "claim" | "documents" | "ocr" | "damage" | "merge";

interface SupportingDocsState {
  claimId: string;
  open: boolean;
}

const statusConfig: Record<ClaimStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: "En attente", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  in_review: { label: "En traitement", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  documents_requested: { label: "Documents requis", color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertTriangle },
  approved: { label: "Approuvé", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Refusé", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
};

const getToken = (): string => {
  const raw = localStorage.getItem("sb-raizxiwxrkgnhnlccvcx-auth-token");
  if (!raw) return "";
  try {
    return (JSON.parse(raw) as { access_token?: string }).access_token ?? "";
  } catch {
    return "";
  }
};

export default function ClaimsPage() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<WorkflowStep>("claim");
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [workflowStart, setWorkflowStart] = useState<WorkflowStartResponse["data"] | null>(null);
  const [workflowComplete, setWorkflowComplete] = useState<WorkflowCompleteResponse["data"] | null>(null);
  const [pvPoliceFile, setPvPoliceFile] = useState<File | null>(null);
  const [accidentImages, setAccidentImages] = useState<File[]>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<FinalizationCheckpoint | null>(null);
  const [supportingDocsDialog, setSupportingDocsDialog] = useState<SupportingDocsState>({ claimId: "", open: false });
  const [rapportExpertFile, setRapportExpertFile] = useState<File | null>(null);
  const [devisFile, setDevisFile] = useState<File | null>(null);
  const [uploadingSupportingDocs, setUploadingSupportingDocs] = useState(false);

  const [form, setForm] = useState({
    contract_id: "",
    type: "accident",
    date: "",
    time: "",
    location: "",
    description: "",
    vehicle: "",
    fullName: "",
    phone: "",
    email: "",
    drivingLicense: "",
    insuranceCompany: "",
    policyNumber: "",
    agentName: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
  });

  useEffect(() => {
    setLoading(true);
    void Promise.all([loadClaims(), loadContracts()]).finally(() => setLoading(false));
  }, []);

  const secondPartyStatus = useMemo(() => {
    if (!workflowComplete?.orchestration.consolidated_claim_data.constat.second_party) {
      return "En attente du second conducteur";
    }
    return "Constat du second conducteur reçu";
  }, [workflowComplete]);

  const loadClaims = async () => {
    try {
      const response = await apiRequest<ClaimsResponse>("/api/claims");
      setClaims(Array.isArray(response.data) ? response.data : []);
    } catch {
      setClaims([]);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await apiRequest<Contract[]>("/api/contrats/client/me");
      setContracts(Array.isArray(response) ? response : []);
    } catch {
      setContracts([]);
    }
  };

  const resetWorkflow = () => {
    setShowModal(false);
    setStep("claim");
    setStarting(false);
    setFinishing(false);
    setWorkflowStart(null);
    setWorkflowComplete(null);
    setPvPoliceFile(null);
    setAccidentImages([]);
    setActiveCheckpoint(null);
    setRapportExpertFile(null);
    setDevisFile(null);
    setForm({
      contract_id: "",
      type: "accident",
      date: "",
      time: "",
      location: "",
      description: "",
      vehicle: "",
      fullName: "",
      phone: "",
      email: "",
      drivingLicense: "",
      insuranceCompany: "",
      policyNumber: "",
      agentName: "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: "",
    });
  };

  const handleContractChange = (contractId: string) => {
    const selected = contracts.find((contract) => String(contract.id) === contractId);
    setForm((prev) => ({
      ...prev,
      contract_id: contractId,
      vehicle: selected ? [selected.marque, selected.modele, selected.serie].filter(Boolean).join(" ") : prev.vehicle,
      vehicleBrand: selected?.marque ?? prev.vehicleBrand,
      vehicleModel: selected?.modele ?? prev.vehicleModel,
    }));
  };

  const validateStartStep = () => {
    if (!form.date || !form.location || !form.description || !form.vehicle) {
      toast({
        title: "Informations incomplètes",
        description: "Renseignez la date, le lieu, la description et le véhicule.",
        variant: "destructive",
      });
      return false;
    }

    if (!form.fullName || !form.phone || !form.email || !form.insuranceCompany || !form.policyNumber) {
      toast({
        title: "Constat incomplet",
        description: "Les informations du conducteur et de l’assurance sont obligatoires.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const startWorkflow = async () => {
    if (!validateStartStep()) return;

    setStarting(true);
    try {
      const payload = {
        contract_id: form.contract_id || null,
        type: form.type,
        date: form.date,
        location: form.location,
        description: form.description,
        vehicle: form.vehicle,
        constat: {
          user_a_data: {
            full_name: form.fullName,
            phone: form.phone,
            email: form.email,
            driving_license: form.drivingLicense || undefined,
          },
          vehicle_a_data: {
            plate: form.vehicle,
            brand: form.vehicleBrand,
            model: form.vehicleModel,
            year: form.vehicleYear ? Number(form.vehicleYear) : undefined,
          },
          insurance_a_data: {
            company: form.insuranceCompany,
            policy_number: form.policyNumber,
            agent_name: form.agentName || undefined,
          },
          accident_details: {
            date: form.date,
            time: form.time || "00:00",
            location: form.location,
            description: form.description,
          },
          signature_a: form.fullName,
          photos_a: [],
        },
      };

      const response = await apiRequest<WorkflowStartResponse>("/api/claims/workflow/start", {
        method: "POST",
        body: payload,
      });

      setWorkflowStart(response.data);
      setStep("qr");
      toast({
        title: "Constat initialisé",
        description: "Le QR code a été généré. Vous pouvez maintenant partager le lien puis ajouter les pièces.",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Impossible de démarrer la déclaration.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  const finishWorkflow = async () => {
    if (!workflowStart?.qr_token) {
      toast({
        title: "QR manquant",
        description: "Le workflow doit être initialisé avant la finalisation.",
        variant: "destructive",
      });
      return;
    }

    if (!pvPoliceFile) {
      toast({
        title: "PV requis",
        description: "Ajoutez le procès-verbal de police pour finaliser le dossier.",
        variant: "destructive",
      });
      return;
    }

    if (accidentImages.length === 0) {
      toast({
        title: "Images requises",
        description: "Ajoutez au moins une image de l’accident.",
        variant: "destructive",
      });
      return;
    }

    setFinishing(true);
    setActiveCheckpoint("claim");
    try {
      const formData = new FormData();
      formData.append(
        "payload",
        JSON.stringify({
          qr_token: workflowStart.qr_token,
          contract_id: form.contract_id || null,
          type: form.type,
          date: form.date,
          location: form.location,
          description: form.description,
          vehicle: form.vehicle,
        }),
      );
      formData.append("pv_police", pvPoliceFile);
      accidentImages.forEach((file) => formData.append("accident_images", file));
      setActiveCheckpoint("documents");

      const response = await fetch(`${API_BASE_URL}/api/claims/workflow/complete`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const payload = (await response.json()) as WorkflowCompleteResponse | { message?: string };
      if (!response.ok) {
        const message = typeof payload.message === "string" ? payload.message : "Impossible de finaliser le dossier.";
        throw new Error(message);
      }

      setActiveCheckpoint("ocr");
      setActiveCheckpoint("damage");
      setActiveCheckpoint("merge");
      setWorkflowComplete((payload as WorkflowCompleteResponse).data);
      setStep("done");
      await loadClaims();
      toast({
        title: "Sinistre enregistré",
        description: "Le dossier a été consolidé et les analyses IA sont prêtes pour décision.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur de finalisation.",
        variant: "destructive",
      });
    } finally {
      setFinishing(false);
      setActiveCheckpoint(null);
    }
  };

  const checkpoints: Array<{ key: FinalizationCheckpoint; label: string; description: string }> = [
    { key: "claim", label: "CrÃ©ation du dossier", description: "Le sinistre est crÃ©Ã© et liÃ© au constat." },
    { key: "documents", label: "Enregistrement des piÃ¨ces", description: "PV police et images sont rattachÃ©s au dossier." },
    { key: "ocr", label: "Analyse OCR", description: "Le PV police est lu et structurÃ©." },
    { key: "damage", label: "Analyse des dommages", description: "Les images d'accident sont analysÃ©es." },
    { key: "merge", label: "Consolidation", description: "Les donnÃ©es sont fusionnÃ©es pour la dÃ©cision." },
  ];

  const getCheckpointState = (checkpoint: FinalizationCheckpoint) => {
    if (!activeCheckpoint) return "idle";
    const currentIndex = checkpoints.findIndex((item) => item.key === activeCheckpoint);
    const checkpointIndex = checkpoints.findIndex((item) => item.key === checkpoint);
    if (checkpointIndex < currentIndex) return "done";
    if (checkpointIndex === currentIndex) return "active";
    return "pending";
  };

  const uploadSupportingDocuments = async () => {
    if (!supportingDocsDialog.claimId) return;
    if (!rapportExpertFile && !devisFile) {
      toast({
        title: "Pièces manquantes",
        description: "Ajoutez au moins un rapport expert ou un devis.",
        variant: "destructive",
      });
      return;
    }

    setUploadingSupportingDocs(true);
    try {
      const uploadSingle = async (file: File, endpoint: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("claim_id", supportingDocsDialog.claimId);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(typeof payload?.message === "string" ? payload.message : "Upload impossible.");
        }
      };

      if (rapportExpertFile) {
        await uploadSingle(rapportExpertFile, "/api/ocr/upload-rapport-expert");
      }

      if (devisFile) {
        await uploadSingle(devisFile, "/api/ocr/upload-devis");
      }

      await apiRequest(`/api/orchestrator/analyze/${supportingDocsDialog.claimId}`, {
        method: "POST",
      });

      await loadClaims();
      setSupportingDocsDialog({ claimId: "", open: false });
      setRapportExpertFile(null);
      setDevisFile(null);
      toast({
        title: "Pièces ajoutées",
        description: "Les nouvelles pièces ont été analysées et le dossier a été régénéré.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ajouter les pièces.",
        variant: "destructive",
      });
    } finally {
      setUploadingSupportingDocs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Gestion des sinistres</h2>
          <p className="text-sm text-muted-foreground">
            Vos sinistres personnels, sans suggestions IA affichées côté client.
          </p>
        </div>

        <Dialog open={showModal} onOpenChange={(open) => (open ? setShowModal(true) : resetWorkflow())}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Déclarer sinistre
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                Déclaration de sinistre
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {step === "claim" && "Étape 1 / 3 - Déclaration + constat"}
                  {step === "qr" && "Étape 2 / 3 - QR du second conducteur"}
                  {step === "uploads" && "Étape 3 / 3 - PV et images"}
                  {step === "done" && "Workflow finalisé"}
                </span>
              </DialogTitle>
            </DialogHeader>

            {step === "claim" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Contrat concerné</Label>
                    <Select value={form.contract_id} onValueChange={handleContractChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un contrat" />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">Aucun contrat disponible</div>
                        ) : (
                          contracts.map((contract) => (
                            <SelectItem key={String(contract.id)} value={String(contract.id)}>
                              {contract.contract_number ?? contract.id} - {contract.marque} {contract.modele}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de sinistre</Label>
                    <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accident">Accident</SelectItem>
                        <SelectItem value="vol">Vol</SelectItem>
                        <SelectItem value="bris">Bris de glace</SelectItem>
                        <SelectItem value="incendie">Incendie</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Véhicule / immatriculation</Label>
                    <Input value={form.vehicle} onChange={(event) => setForm((prev) => ({ ...prev, vehicle: event.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label>Heure</Label>
                    <Input type="time" value={form.time} onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))} />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Lieu</Label>
                    <div className="relative">
                      <Input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
                      <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea rows={4} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <h3 className="mb-4 font-semibold">Constat - votre partie</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nom complet</Label>
                      <Input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Permis</Label>
                      <Input value={form.drivingLicense} onChange={(event) => setForm((prev) => ({ ...prev, drivingLicense: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Compagnie d’assurance</Label>
                      <Input value={form.insuranceCompany} onChange={(event) => setForm((prev) => ({ ...prev, insuranceCompany: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Numéro de police</Label>
                      <Input value={form.policyNumber} onChange={(event) => setForm((prev) => ({ ...prev, policyNumber: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Agent / agence</Label>
                      <Input value={form.agentName} onChange={(event) => setForm((prev) => ({ ...prev, agentName: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Année véhicule</Label>
                      <Input value={form.vehicleYear} onChange={(event) => setForm((prev) => ({ ...prev, vehicleYear: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Marque</Label>
                      <Input value={form.vehicleBrand} onChange={(event) => setForm((prev) => ({ ...prev, vehicleBrand: event.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Modèle</Label>
                      <Input value={form.vehicleModel} onChange={(event) => setForm((prev) => ({ ...prev, vehicleModel: event.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={resetWorkflow}>
                    Annuler
                  </Button>
                  <Button type="button" className="flex-1 bg-gradient-primary text-primary-foreground" onClick={startWorkflow} disabled={starting}>
                    {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Générer le QR
                  </Button>
                </div>
              </div>
            )}

            {step === "qr" && workflowStart && (
              <div className="space-y-5">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="font-semibold text-green-800">Constat créé</p>
                  <p className="text-sm text-green-700">
                    Partagez ce lien ou ce QR code avec le second conducteur pour qu’il complète sa partie.
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <QrCode className="h-4 w-4" />
                    QR token: {workflowStart.qr_token}
                  </div>
                  <div className="mb-4 flex justify-center rounded-lg border bg-white p-4">
                    <img src={workflowStart.qr_code} alt="QR constat" className="h-48 w-48" />
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-xs break-all">
                    {workflowStart.scan_url}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("claim")}>
                    Retour
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => setStep("uploads")}>
                    Continuer vers les pièces
                  </Button>
                </div>
              </div>
            )}

            {step === "uploads" && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4" />
                      Procès-verbal (PDF)
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(event) => setPvPoliceFile(event.target.files?.[0] ?? null)}
                    />
                    {pvPoliceFile ? <p className="mt-2 text-xs text-muted-foreground">{pvPoliceFile.name}</p> : null}
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="mb-3 flex items-center gap-2 font-medium">
                      <Camera className="h-4 w-4" />
                      Images de l’accident
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => setAccidentImages(Array.from(event.target.files ?? []))}
                    />
                    {accidentImages.length > 0 ? (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {accidentImages.map((file) => (
                          <div key={`${file.name}-${file.lastModified}`}>{file.name}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  La finalisation crée l’entrée du sinistre, rattache le constat, envoie le PV au module OCR et lance
                  l’analyse des images pour produire un résultat consolidé prêt pour décision.
                </div>

                <div className="rounded-xl border p-4">
                  <p className="mb-3 text-sm font-semibold">Checkpoints de traitement</p>
                  <div className="space-y-3">
                    {checkpoints.map((checkpoint) => {
                      const checkpointState = getCheckpointState(checkpoint.key);
                      return (
                        <div key={checkpoint.key} className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                              checkpointState === "done"
                                ? "border-green-500 bg-green-500 text-white"
                                : checkpointState === "active"
                                  ? "border-blue-500 bg-blue-50 text-blue-600"
                                  : "border-muted-foreground/30 bg-background text-muted-foreground"
                            }`}
                          >
                            {checkpointState === "done" ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : checkpointState === "active" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{checkpoint.label}</p>
                            <p className="text-xs text-muted-foreground">{checkpoint.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("qr")}>
                    Retour
                  </Button>
                  <Button type="button" className="flex-1 bg-gradient-primary text-primary-foreground" onClick={finishWorkflow} disabled={finishing}>
                    {finishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Finaliser le dossier
                  </Button>
                </div>
              </div>
            )}

            {step === "done" && workflowComplete && (
              <div className="space-y-5">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Sinistre créé</p>
                      <p className="text-sm text-green-700">
                        Référence: <strong>{workflowComplete.claim.reference}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <p className="mb-2 text-sm font-semibold">Décision support</p>
                    <Badge variant="outline" className="mb-2 capitalize">
                      {workflowComplete.orchestration.decision_support.decision}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Risque: {workflowComplete.orchestration.decision_support.risk_level}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Montant recommandé: {workflowComplete.orchestration.decision_support.recommended_payout}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="mb-2 text-sm font-semibold">Statut du constat</p>
                    <p className="text-sm text-muted-foreground">
                      {workflowComplete.orchestration.consolidated_claim_data.constat.status ?? "En attente"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{secondPartyStatus}</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4 text-sm">
                  {workflowComplete.orchestration.decision_support.reasoning}
                </div>

                <Button className="w-full" onClick={resetWorkflow}>
                  Fermer
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h4 className="text-sm font-semibold">Workflow client</h4>
            <p className="text-sm text-muted-foreground">
              Le client voit uniquement ses propres sinistres. La création suit désormais le flux complet: constat
              initial, QR pour le second conducteur, puis finalisation avec PV et images.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : claims.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucun sinistre déclaré pour le moment.</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowModal(true)}>
              Déclarer sinistre
            </Button>
          </div>
        ) : (
          claims.map((claim) => {
            const config = statusConfig[claim.status] ?? statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div key={claim.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>

                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold text-foreground">{claim.reference}</span>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {[claim.vehicle, claim.type, claim.date].filter(Boolean).join(" · ")}
                      </p>

                      {claim.location ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Lieu: {claim.location}
                        </p>
                      ) : null}

                      {claim.amount != null ? (
                        <p className="mt-2 text-sm font-medium text-foreground">
                          Montant: {claim.amount.toLocaleString()} TND
                        </p>
                      ) : null}

                      {claim.status === "documents_requested" ? (
                        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                          L'agent a demandé des pièces complémentaires. Vous pouvez ajouter un rapport expert ou un devis.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 self-start">
                    {claim.status === "documents_requested" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSupportingDocsDialog({ claimId: claim.id, open: true })}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Ajouter pièces
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" className="self-start">
                      <Eye className="mr-1 h-4 w-4" />
                      Détails
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog
        open={supportingDocsDialog.open}
        onOpenChange={(open) => {
          setSupportingDocsDialog((prev) => ({ ...prev, open }));
          if (!open) {
            setRapportExpertFile(null);
            setDevisFile(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">Ajouter des pièces complémentaires</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              Ajoutez les pièces demandées par l’agent. Le dossier sera réanalysé automatiquement après l’upload.
            </div>

            <div className="space-y-2">
              <Label>Rapport expert (PDF)</Label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setRapportExpertFile(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label>Devis garage (PDF)</Label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setDevisFile(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSupportingDocsDialog({ claimId: "", open: false })}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={uploadingSupportingDocs}
                onClick={() => void uploadSupportingDocuments()}
              >
                {uploadingSupportingDocs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Envoyer et régénérer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
