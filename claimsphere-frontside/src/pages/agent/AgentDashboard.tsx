import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Clock,
  Eye,
  FileWarning,
  Loader2,
  RefreshCw,
  Shield,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) =>
    ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.5 },
    }) as const,
};

type ClaimStatus = "pending" | "in_review" | "documents_requested" | "approved" | "rejected";
type ContractStatus = "non_traite" | "approuve" | "refuse";

type ClaimApiResponse = {
  id: string;
  reference: string;
  status: ClaimStatus;
  description: string | null;
  type: string | null;
  vehicle: string | null;
  amount: number | null;
  ai_suggestion: string | null;
  documents: Record<string, any> | null;
  created_at: string;
};

type ContractApiResponse = {
  id: number;
  contract_number?: string | null;
  contract_reference?: string | null;
  client_id: string;
  type: string;
  status: ContractStatus;
  created_at: string;
  marque?: string | null;
  modele?: string | null;
};

type ClaimsWrapper = {
  success: boolean;
  data: ClaimApiResponse[];
  total: number;
};

type ContractsResponse = ContractApiResponse[] | { success?: boolean; data?: ContractApiResponse[]; total?: number };

const claimStatusColors: Record<ClaimStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_review: "bg-blue-50 text-blue-700 border-blue-200",
  documents_requested: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const claimStatusLabels: Record<ClaimStatus, string> = {
  pending: "Non traité",
  in_review: "En cours",
  documents_requested: "En cours - documents demandés",
  approved: "Traité - accepté",
  rejected: "Traité - refusé",
};

const contractStatusColors: Record<ContractStatus, string> = {
  non_traite: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approuve: "bg-green-50 text-green-700 border-green-200",
  refuse: "bg-red-50 text-red-700 border-red-200",
};

const contractStatusLabels: Record<ContractStatus, string> = {
  non_traite: "Non traité",
  approuve: "Approuvé",
  refuse: "Refusé",
};

type ClaimDetail = ClaimApiResponse & {
  consolidated_result?: {
    ai_insights?: {
      coherence_checks?: Array<{
        code: string;
        severity: "low" | "medium" | "high";
        message: string;
      }>;
      offer_coverage?: {
        offer_title: string;
        covered: boolean;
        eligible_for_reimbursement: boolean;
        coverage_reason: string;
        missing_requirements: string[];
        matched_guarantees: string[];
      };
    };
    decision_support?: {
      decision: "approve" | "reject" | "review";
      risk_level: "low" | "medium" | "high";
      fraud_score: number;
      coherence_score: number;
      recommended_payout: number;
      reasoning: string;
      agent_recommendation?: {
        action: string;
        reason: string;
        documents_to_request: string[];
      };
    };
    consolidated_claim_data?: {
      ocr?: {
        pv_police?: Record<string, unknown> | null;
        rapport_expert?: Record<string, unknown> | null;
        devis?: Record<string, unknown> | null;
      };
      damage?: {
        aggregated?: Record<string, unknown> | null;
        agent_decision?: Record<string, unknown> | null;
      };
      constat?: {
        status?: string | null;
      };
    };
  };
};

export default function AgentDashboard() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<ClaimApiResponse[]>([]);
  const [contracts, setContracts] = useState<ContractApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [claimsResponse, contractsResponse] = await Promise.all([
        apiRequest<ClaimsWrapper>("/api/claims/all"),
        apiRequest<ContractsResponse>("/api/contrats"),
      ]);

      setClaims(Array.isArray(claimsResponse.data) ? claimsResponse.data : []);

      const rawContracts = Array.isArray(contractsResponse)
        ? contractsResponse
        : Array.isArray(contractsResponse.data)
          ? contractsResponse.data
          : [];
      setContracts(rawContracts);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de charger le tableau de bord agent.",
        variant: "destructive",
      });
      setClaims([]);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const groupedClaims = useMemo(
    () => ({
      pending: claims.filter((claim) => claim.status === "pending"),
      in_progress: claims.filter(
        (claim) => claim.status === "in_review" || claim.status === "documents_requested",
      ),
      processed: claims.filter((claim) => claim.status === "approved" || claim.status === "rejected"),
    }),
    [claims],
  );

  const groupedContracts = useMemo(
    () => ({
      non_traite: contracts.filter((contract) => contract.status === "non_traite"),
      approuve: contracts.filter((contract) => contract.status === "approuve"),
    }),
    [contracts],
  );

  const openDetails = async (claimId: string) => {
    try {
      const response = await apiRequest<{ success: boolean; data: ClaimApiResponse }>(`/api/claims/${claimId}`);
      const claim = response.data;
      const consolidatedResult = claim.documents?.consolidated_result ?? null;
      setSelectedClaim({
        ...claim,
        consolidated_result: consolidatedResult ?? undefined,
      });
      setDetailOpen(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de charger le détail du sinistre.",
        variant: "destructive",
      });
    }
  };

  const runClaimAction = async (
    claimId: string,
    action: "approve" | "reject" | "request-devis" | "request-rapport" | "reanalyze",
  ) => {
    setActionLoading(`${claimId}:${action}`);
    try {
      if (action === "approve") {
        const payout =
          selectedClaim?.consolidated_result?.decision_support?.recommended_payout ??
          claims.find((claim) => claim.id === claimId)?.documents?.consolidated_result?.decision_support?.recommended_payout ??
          selectedClaim?.amount ??
          0;
        await apiRequest(`/api/claims/${claimId}/approve`, {
          method: "PATCH",
          body: { amount: payout },
        });
      } else if (action === "reject") {
        await apiRequest(`/api/claims/${claimId}/reject`, {
          method: "PATCH",
          body: {
            reason:
              selectedClaim?.consolidated_result?.decision_support?.reasoning ??
              "Refus après analyse du dossier.",
          },
        });
      } else if (action === "request-devis" || action === "request-rapport") {
        await apiRequest(`/api/claims/${claimId}/request-documents`, {
          method: "PATCH",
          body: {
            documents_needed: action === "request-devis" ? "Devis garage" : "Rapport expert",
          },
        });
      } else {
        await apiRequest(`/api/orchestrator/analyze/${claimId}`, {
          method: "POST",
        });
      }

      await fetchDashboardData();
      if (detailOpen) {
        await openDetails(claimId);
      }

      const description =
        action === "request-devis"
          ? "Le client a été notifié pour ajouter un devis."
          : action === "request-rapport"
            ? "Le client a été notifié pour ajouter un rapport expert."
            : action === "reanalyze"
              ? "Le dossier a été régénéré avec les pièces disponibles."
              : "La décision a été enregistrée et le client a été notifié.";

      toast({
        title: "Action effectuée",
        description,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Action impossible.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const runContractAction = async (contractId: number, status: "approuve" | "refuse") => {
    setActionLoading(`contract:${contractId}:${status}`);
    try {
      await apiRequest(`/api/contrats/${contractId}/status`, {
        method: "PATCH",
        body: { status },
      });

      await fetchDashboardData();

      toast({
        title: "Contrat mis à jour",
        description:
          status === "approuve"
            ? "Le contrat a été approuvé."
            : "Le contrat a été refusé.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Mise à jour du contrat impossible.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const renderClaimCard = (claim: ClaimApiResponse, index: number, block: "pending" | "in_progress" | "processed") => {
    const decisionSupport = claim.documents?.consolidated_result?.decision_support;
    const offerCoverage = claim.documents?.consolidated_result?.ai_insights?.offer_coverage;
    const recommendation = decisionSupport?.agent_recommendation;
    const coherenceChecks = claim.documents?.consolidated_result?.ai_insights?.coherence_checks ?? [];

    return (
      <motion.div
        key={claim.id}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={index}
        className="rounded-xl border bg-card p-6 shadow-card"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-bold text-foreground">{claim.reference}</span>
              <Badge variant="outline" className={claimStatusColors[claim.status]}>
                {claimStatusLabels[claim.status]}
              </Badge>
              {decisionSupport ? (
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                  {decisionSupport.decision}
                </Badge>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
              {[claim.type, claim.vehicle].filter(Boolean).join(" · ")}
            </p>
            <p className="text-sm text-muted-foreground">
              {claim.description || "Aucune description fournie."}
            </p>

            {offerCoverage ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{offerCoverage.offer_title}</p>
                <p className="text-muted-foreground">{offerCoverage.coverage_reason}</p>
                {offerCoverage.missing_requirements?.length > 0 ? (
                  <p className="mt-1 text-orange-700">
                    Pièces manquantes: {offerCoverage.missing_requirements.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            {decisionSupport ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <span>Fraude: <strong>{decisionSupport.fraud_score}</strong></span>
                  <span>Cohérence: <strong>{decisionSupport.coherence_score}</strong></span>
                  <span>Remboursement suggéré: <strong>{decisionSupport.recommended_payout} TND</strong></span>
                </div>
                <p className="mt-2 text-muted-foreground">{decisionSupport.reasoning}</p>
              </div>
            ) : null}

            {recommendation ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <Bot className="h-4 w-4 text-primary" />
                  Suggestion IA
                </div>
                <p className="text-muted-foreground">{recommendation.reason}</p>
              </div>
            ) : null}

            {coherenceChecks.length > 0 ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 font-medium text-orange-800">
                  <FileWarning className="h-4 w-4" />
                  Incohérences détectées
                </div>
                <p className="text-orange-700">
                  {coherenceChecks.slice(0, 2).map((item: { message: string }) => item.message).join(" | ")}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-row flex-wrap gap-2 self-start lg:w-[240px] lg:flex-col">
            <Button variant="ghost" size="sm" onClick={() => void openDetails(claim.id)}>
              <Eye className="mr-1 h-4 w-4" />
              Détails
            </Button>

            {block === "pending" ? (
              <>
                <Button
                  size="sm"
                  className="bg-success text-success-foreground hover:bg-success/90"
                  disabled={actionLoading === `${claim.id}:approve`}
                  onClick={() => void runClaimAction(claim.id, "approve")}
                >
                  {actionLoading === `${claim.id}:approve` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      Accepter
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actionLoading === `${claim.id}:reject`}
                  onClick={() => void runClaimAction(claim.id, "reject")}
                >
                  {actionLoading === `${claim.id}:reject` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsDown className="mr-1 h-4 w-4" />
                      Refuser
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading === `${claim.id}:request-devis`}
                  onClick={() => void runClaimAction(claim.id, "request-devis")}
                >
                  {actionLoading === `${claim.id}:request-devis` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      Demander devis
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading === `${claim.id}:request-rapport`}
                  onClick={() => void runClaimAction(claim.id, "request-rapport")}
                >
                  {actionLoading === `${claim.id}:request-rapport` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileWarning className="mr-1 h-4 w-4" />
                      Rapport expert
                    </>
                  )}
                </Button>
              </>
            ) : null}

            {block === "in_progress" ? (
              <>
                <Button
                  size="sm"
                  className="bg-success text-success-foreground hover:bg-success/90"
                  disabled={actionLoading === `${claim.id}:approve`}
                  onClick={() => void runClaimAction(claim.id, "approve")}
                >
                  {actionLoading === `${claim.id}:approve` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      Accepter
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actionLoading === `${claim.id}:reject`}
                  onClick={() => void runClaimAction(claim.id, "reject")}
                >
                  {actionLoading === `${claim.id}:reject` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsDown className="mr-1 h-4 w-4" />
                      Refuser
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading === `${claim.id}:request-devis`}
                  onClick={() => void runClaimAction(claim.id, "request-devis")}
                >
                  {actionLoading === `${claim.id}:request-devis` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      Demander devis
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading === `${claim.id}:request-rapport`}
                  onClick={() => void runClaimAction(claim.id, "request-rapport")}
                >
                  {actionLoading === `${claim.id}:request-rapport` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileWarning className="mr-1 h-4 w-4" />
                      Rapport expert
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading === `${claim.id}:reanalyze`}
                  onClick={() => void runClaimAction(claim.id, "reanalyze")}
                >
                  {actionLoading === `${claim.id}:reanalyze` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Régénérer
                    </>
                  )}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderClaimsList = (items: ClaimApiResponse[], block: "pending" | "in_progress" | "processed") => {
    if (loading) {
      return (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (items.length === 0) {
      return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Aucun sinistre trouvé.</div>;
    }

    return <div className="space-y-4">{items.map((claim, index) => renderClaimCard(claim, index, block))}</div>;
  };

  const renderContractsList = (items: ContractApiResponse[], block: "non_traite" | "approuve") => {
    if (loading) {
      return (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (items.length === 0) {
      return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Aucun contrat trouvé.</div>;
    }

    return (
      <div className="space-y-4">
        {items.map((contract, index) => (
          <motion.div
            key={contract.id}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={index}
            className="rounded-xl border bg-card p-6 shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-bold text-foreground">
                {contract.contract_number || contract.contract_reference || `Contrat #${contract.id}`}
              </span>
              <Badge variant="outline" className={contractStatusColors[contract.status]}>
                {contractStatusLabels[contract.status]}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {[contract.type, contract.marque, contract.modele].filter(Boolean).join(" · ") || "Contrat auto"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Client: {contract.client_id} · Créé le {new Date(contract.created_at).toLocaleDateString("fr-FR")}
            </p>

            {block === "non_traite" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-success text-success-foreground hover:bg-success/90"
                  disabled={actionLoading === `contract:${contract.id}:approuve`}
                  onClick={() => void runContractAction(contract.id, "approuve")}
                >
                  {actionLoading === `contract:${contract.id}:approuve` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      Accepter
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actionLoading === `contract:${contract.id}:refuse`}
                  onClick={() => void runContractAction(contract.id, "refuse")}
                >
                  {actionLoading === `contract:${contract.id}:refuse` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsDown className="mr-1 h-4 w-4" />
                      Refuser
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </motion.div>
        ))}
      </div>
    );
  };

  const stats = [
    { label: "Sinistres non traités", value: groupedClaims.pending.length, icon: Clock, color: "text-warning" },
    { label: "Sinistres en cours", value: groupedClaims.in_progress.length, icon: Bot, color: "text-primary" },
    { label: "Contrats non traités", value: groupedContracts.non_traite.length, icon: AlertTriangle, color: "text-orange-600" },
    { label: "Sinistres traités", value: groupedClaims.processed.length, icon: CheckCircle, color: "text-success" },
  ];

  const selectedSupport = selectedClaim?.consolidated_result?.decision_support;
  const selectedInsights = selectedClaim?.consolidated_result?.ai_insights;
  const selectedDamage = selectedClaim?.consolidated_result?.consolidated_claim_data?.damage;
  const selectedOcr = selectedClaim?.consolidated_result?.consolidated_claim_data?.ocr;
  const suggestedDocuments = selectedSupport?.agent_recommendation?.documents_to_request ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground">ClaimSphere</span>
              <Badge className="ml-2 bg-accent text-accent-foreground text-xs">Agent</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden text-sm font-medium text-foreground sm:block">Agent Claims</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto space-y-6 px-4 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={index}
              className="rounded-xl border bg-card p-5 shadow-card"
            >
              <stat.icon className={`mb-2 h-5 w-5 ${stat.color}`} />
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="claims-pending" className="w-full space-y-6">
          <section className="space-y-4">
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <h2 className="font-display text-xl font-bold text-foreground">Contracts Section</h2>
              <p className="text-sm text-muted-foreground">
                Contrats non traités et contrats approuvés visibles dans deux sous-parties.
              </p>
              <TabsList className="mt-4 grid w-full grid-cols-2">
                <TabsTrigger value="contracts-pending">Contrats non traités</TabsTrigger>
                <TabsTrigger value="contracts-approved">Contrats approuvés</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="contracts-pending" className="space-y-6">
              {renderContractsList(groupedContracts.non_traite, "non_traite")}
            </TabsContent>

            <TabsContent value="contracts-approved" className="space-y-6">
              {renderContractsList(groupedContracts.approuve, "approuve")}
            </TabsContent>
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <h2 className="font-display text-xl font-bold text-foreground">Claims Section</h2>
              <p className="text-sm text-muted-foreground">
                Les nouveaux sinistres arrivent dans Non traité, puis basculent en cours ou traités selon l&apos;action de l&apos;agent.
              </p>
              <TabsList className="mt-4 grid w-full grid-cols-3">
                <TabsTrigger value="claims-pending">Non traité</TabsTrigger>
                <TabsTrigger value="claims-progress">En cours</TabsTrigger>
                <TabsTrigger value="claims-processed">Traité</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="claims-pending" className="space-y-6">
              {renderClaimsList(groupedClaims.pending, "pending")}
            </TabsContent>

            <TabsContent value="claims-progress" className="space-y-6">
              {renderClaimsList(groupedClaims.in_progress, "in_progress")}
            </TabsContent>

            <TabsContent value="claims-processed" className="space-y-6">
              {renderClaimsList(groupedClaims.processed, "processed")}
            </TabsContent>
          </section>
        </Tabs>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Détail sinistre {selectedClaim?.reference}</DialogTitle>
          </DialogHeader>

          {selectedClaim ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="mb-2 text-sm font-semibold">Décision orchestrateur</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSupport?.reasoning ?? selectedClaim.ai_suggestion ?? "Aucune décision consolidée."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <span>Décision: <strong>{selectedSupport?.decision ?? "n/a"}</strong></span>
                    <span>Risque: <strong>{selectedSupport?.risk_level ?? "n/a"}</strong></span>
                    <span>Fraude: <strong>{selectedSupport?.fraud_score ?? "n/a"}</strong></span>
                    <span>Cohérence: <strong>{selectedSupport?.coherence_score ?? "n/a"}</strong></span>
                    <span>Remboursement suggéré: <strong>{selectedSupport?.recommended_payout ?? 0} TND</strong></span>
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="mb-2 text-sm font-semibold">Couverture offre</p>
                  <p className="text-sm font-medium">
                    {selectedInsights?.offer_coverage?.offer_title ?? "Offre inconnue"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedInsights?.offer_coverage?.coverage_reason ?? "Aucune analyse de couverture."}
                  </p>
                  {selectedInsights?.offer_coverage?.matched_guarantees?.length ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Garanties: {selectedInsights.offer_coverage.matched_guarantees.join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="mb-3 text-sm font-semibold">Contrôles de cohérence</p>
                <div className="space-y-2">
                  {(selectedInsights?.coherence_checks ?? []).length > 0 ? (
                    selectedInsights?.coherence_checks?.map((item) => (
                      <div key={item.code} className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {item.severity}
                          </Badge>
                          <span className="font-medium">{item.code}</span>
                        </div>
                        <p className="text-muted-foreground">{item.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune incohérence majeure détectée.</p>
                  )}
                </div>
              </div>

              {suggestedDocuments.length > 0 ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="mb-2 text-sm font-semibold">Documents suggérés par l&apos;orchestrateur</p>
                  <p className="text-sm text-muted-foreground">{suggestedDocuments.join(", ")}</p>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="mb-2 text-sm font-semibold">OCR</p>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {JSON.stringify(selectedOcr, null, 2)}
                  </pre>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="mb-2 text-sm font-semibold">Damage agent</p>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {JSON.stringify(selectedDamage, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-success text-success-foreground hover:bg-success/90"
                  disabled={actionLoading === `${selectedClaim.id}:approve`}
                  onClick={() => void runClaimAction(selectedClaim.id, "approve")}
                >
                  {actionLoading === `${selectedClaim.id}:approve` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className="mr-1 h-4 w-4" />
                      Accepter
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  disabled={actionLoading === `${selectedClaim.id}:reject`}
                  onClick={() => void runClaimAction(selectedClaim.id, "reject")}
                >
                  {actionLoading === `${selectedClaim.id}:reject` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ThumbsDown className="mr-1 h-4 w-4" />
                      Refuser
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  disabled={actionLoading === `${selectedClaim.id}:request-devis`}
                  onClick={() => void runClaimAction(selectedClaim.id, "request-devis")}
                >
                  {actionLoading === `${selectedClaim.id}:request-devis` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <AlertTriangle className="mr-1 h-4 w-4" />
                      Demander devis
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  disabled={actionLoading === `${selectedClaim.id}:request-rapport`}
                  onClick={() => void runClaimAction(selectedClaim.id, "request-rapport")}
                >
                  {actionLoading === `${selectedClaim.id}:request-rapport` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <FileWarning className="mr-1 h-4 w-4" />
                      Rapport expert
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  disabled={actionLoading === `${selectedClaim.id}:reanalyze`}
                  onClick={() => void runClaimAction(selectedClaim.id, "reanalyze")}
                >
                  {actionLoading === `${selectedClaim.id}:reanalyze` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Régénérer
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
