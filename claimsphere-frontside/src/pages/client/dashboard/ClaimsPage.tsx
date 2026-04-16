import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Plus, Upload, Camera, FileText, MapPin,
  CheckCircle, Clock, XCircle, ChevronRight, QrCode, Eye,
  Loader2, X, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-client";

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  "En traitement": { color: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  "Remboursé": { color: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  "Refusé": { color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

const documentTypeConfig = {
  pv_police: {
    label: "PV Police",
    description: "Procès-Verbal de Police (Accident Report)",
    color: "bg-blue-500",
  },
  rapport_expert: {
    label: "Rapport Expert",
    description: "Expert Vehicle Inspection Report",
    color: "bg-orange-500",
  },
  devis: {
    label: "Devis",
    description: "Repair Quote (Garagiste)",
    color: "bg-green-500",
  },
};

type DocumentType = "pv_police" | "rapport_expert" | "devis";

interface Claim {
  id: string;
  reference: string;
  date: string;
  type: string;
  status: "En traitement" | "Remboursé" | "Refusé";
  vehicle: string;
  amount: string;
  aiSuggestion?: string;
  user_id?: string;
}

interface Contract {
  id: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  montant_declare: number;
  marque: string;
  modele: string;
}

interface UploadedDocument {
  type: DocumentType;
  file: File;
  data?: any;
  id: string;
}

export default function ClaimsPage() {
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [step, setStep] = useState<"info" | "documents">("info");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [form, setForm] = useState({
    contract: "",
    type: "accident",
    date: "",
    location: "",
    description: "",
  });

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [currentDocType, setCurrentDocType] = useState<DocumentType>("pv_police");
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<DocumentType | null>(null);
  const [showDocDropdown, setShowDocDropdown] = useState(false);

  useEffect(() => {
    const fetchUserAndContracts = async () => {
      try {
        setLoading(true);

        const userResponse = await apiRequest<{ success: boolean; user: { id: string } }>("/users/me");
        const userId = userResponse.user?.id;
        setCurrentUserId(userId || null);

        if (userId) {
          try {
            const contractsData = await apiRequest<Contract[]>(`/api/contrats/client/${userId}`);
            console.log('📋 Raw contracts data:', contractsData);
            const contractsArray = Array.isArray(contractsData) ? contractsData : [];
            console.log('📋 Processed contracts:', contractsArray);
            setContracts(contractsArray);
          } catch (error) {
            console.error("Error fetching contracts:", error);
            setContracts([]);
          }
        }

        try {
          await fetchUserClaims();
        } catch (error) {
          console.error("Error fetching claims:", error);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos données",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndContracts();
  }, []);

  const fetchUserClaims = async () => {
    try {
      const claimsData = await apiRequest<Claim[]>("/api/claims");
      setClaims(Array.isArray(claimsData) ? claimsData : []);
    } catch (error) {
      console.error("Error fetching claims:", error);
      setClaims([]);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDrag = (e: React.DragEvent, docType: DocumentType) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(docType);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent, docType: DocumentType) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        handleDocumentUpload(droppedFile, docType);
      } else {
        toast({ title: "Erreur", description: "Veuillez déposer un fichier PDF", variant: "destructive" });
      }
    }
  };

  const handleDocumentUpload = async (file: File, docType: DocumentType) => {
    if (uploadedDocs.some(doc => doc.type === docType)) {
      toast({
        title: "Erreur",
        description: `Un ${documentTypeConfig[docType].label} est déjà chargé. Veuillez le supprimer avant d'en ajouter un autre.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(docType);
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = {
      pv_police: "/api/ocr/upload-pv-police",
      rapport_expert: "/api/ocr/upload-rapport-expert",
      devis: "/api/ocr/upload-devis",
    }[docType];

    try {
      const rawToken = localStorage.getItem("sb-raizxiwxrkgnhnlccvcx-auth-token");
      let accessToken = "";
      if (rawToken) {
        try {
          const parsed = JSON.parse(rawToken);
          accessToken = parsed.access_token || "";
        } catch (e) {
          console.error("Failed to parse token:", e);
        }
      }

      const response = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUploadedDocs((prev) => [
          ...prev,
          {
            type: docType,
            file,
            data: data.extractedData,
            id: `${docType}-${Date.now()}`
          },
        ]);
        toast({ title: "Succès", description: `${documentTypeConfig[docType].label} téléchargé!` });
      } else {
        toast({ title: "Erreur", description: "Erreur lors du traitement du document", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur d'upload:", error);
      toast({
        title: "Erreur",
        description: "Erreur d'upload. Assurez-vous que le serveur fonctionne.",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.contract || !form.date || uploadedDocs.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs et ajouter au moins un document",
        variant: "destructive",
      });
      return;
    }

    try {
      const newClaim = await apiRequest("/api/claims", {
        method: "POST",
        body: {
          contract_id: form.contract,
          type: form.type,
          date: form.date,
          location: form.location,
          description: form.description,
          documents: uploadedDocs.map(doc => ({
            type: doc.type,
            extracted_data: doc.data,
          })),
        },
      });

      toast({ title: "Sinistre déclaré", description: "Votre déclaration a été enregistrée. Vous recevrez une notification de suivi." });

      fetchUserClaims();

      setForm({ contract: "", type: "accident", date: "", location: "", description: "" });
      setUploadedDocs([]);
      setStep("info");
      setShowNewClaim(false);
    } catch (error) {
      console.error("Error creating claim:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du sinistre",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setForm({ contract: "", type: "accident", date: "", location: "", description: "" });
    setUploadedDocs([]);
    setStep("info");
    setShowNewClaim(false);
  };

  const removeDocument = (docId: string) => {
    setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const hasDocumentType = (docType: DocumentType) => {
    return uploadedDocs.some(doc => doc.type === docType);
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                Déclaration de sinistre
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  {step === "info" ? "Étape 1: Informations" : "Étape 2: Documents"}
                </span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitClaim} className="space-y-4 mt-4">
              {step === "info" ? (
                <>
                  <div>
                    <Label>Contrat concerné</Label>
                    <Select value={form.contract} onValueChange={(value) => setForm({ ...form, contract: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un contrat" />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Aucun contrat disponible
                          </div>
                        ) : (
                          contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.id} - {contract.marque} {contract.modele}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Type de sinistre</Label>
                    <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
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

                  <div>
                    <Label>Date du sinistre</Label>
                    <Input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <Label>Lieu du sinistre</Label>
                    <div className="relative">
                      <Input
                        placeholder="Adresse ou localisation"
                        name="location"
                        value={form.location}
                        onChange={handleFormChange}
                      />
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Décrivez les circonstances du sinistre..."
                      rows={3}
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Téléchargez les documents relatifs à votre sinistre. Vous pouvez ajouter un PV Police, un Rapport Expert et/ou un Devis.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(Object.entries(documentTypeConfig) as Array<[DocumentType, typeof documentTypeConfig.pv_police]>).map(
                      ([docType, config]) => (
                        <div
                          key={docType}
                          onDragEnter={(e) => handleDrag(e, docType)}
                          onDragLeave={(e) => handleDrag(e, docType)}
                          onDragOver={(e) => handleDrag(e, docType)}
                          onDrop={(e) => handleDrop(e, docType)}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition relative ${dragActive === docType
                            ? "border-primary bg-primary/5"
                            : hasDocumentType(docType)
                              ? "border-success bg-success/5"
                              : "border-muted-foreground/20 hover:border-primary/50"
                            }`}
                        >
                          {hasDocumentType(docType) ? (
                            <div className="space-y-2">
                              <CheckCircle className="w-8 h-8 text-success mx-auto" />
                              <p className="text-sm font-semibold text-success">{config.label}</p>
                              <p className="text-xs text-muted-foreground">Document chargé</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <label className="cursor-pointer block">
                                <span className="text-primary hover:text-primary/80 font-semibold text-sm">
                                  Cliquez
                                </span>
                                {" "}ou glissez-déposez
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleDocumentUpload(file, docType);
                                    }
                                  }}
                                  className="hidden"
                                  disabled={uploading !== null}
                                />
                              </label>
                              <p className="text-xs text-muted-foreground mt-2">
                                {config.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {config.description}
                              </p>
                            </>
                          )}

                          {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {uploadedDocs.length > 0 && (
                    <div className="space-y-2 mt-6 pt-4 border-t">
                      <p className="text-sm font-semibold text-foreground">
                        Documents téléchargés ({uploadedDocs.length}/3)
                      </p>
                      <div className="space-y-2">
                        {uploadedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {documentTypeConfig[doc.type].label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.file.name}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocument(doc.id)}
                              className="p-1 hover:bg-destructive/10 rounded transition"
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={resetModal}>
                  Annuler
                </Button>

                {step === "info" ? (
                  <Button
                    type="button"
                    className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={() => setStep("documents")}
                  >
                    Continuer
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("info")}
                    >
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      disabled={uploading !== null}
                      className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={16} />
                          Traitement...
                        </>
                      ) : (
                        "Déclarer le sinistre"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <QrCode className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-display font-semibold text-foreground text-sm">Constat amiable numérique</h4>
          <p className="text-xs text-muted-foreground">Partagez un QR code avec le second conducteur pour remplir le constat ensemble.</p>
        </div>
        <Button variant="outline" size="sm">Générer un QR Code</Button>
      </motion.div>

      <div className="space-y-4">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Chargement de vos sinistres...</p>
          </motion.div>
        ) : claims.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertTriangle className="mx-auto mb-4 w-12 h-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucun sinistre déclaré pour le moment.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowNewClaim(true)}
            >
              Déclarer un sinistre
            </Button>
          </motion.div>
        ) : (
          claims.map((claim, i) => {
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
                        <span className="font-display font-semibold text-foreground">{claim.reference}</span>
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
          })
        )}
      </div>
    </div>
  );
}