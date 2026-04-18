import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Users, Shield,
  CheckCircle, Clock, Eye, ThumbsUp, ThumbsDown,
  UserCheck, Bot, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } } as const),
};

type ContractApiResponse = {
  id: string | number;
  status: string;
  type: string;
  montant_declare: number;
  client_id: string;
};

type Contract = {
  id: string | number;
  status: string;
  type: string;
  montant_declare: number;
  client_id: string;
};

type Claim = {
  id: number;
  status: string;
  description: string;
  contractType: string;
  montantDeclare: string;
  fraudRisk: number;
};

const statusColors: Record<string, string> = {
  non_traite: "bg-warning/10 text-warning border-warning/30",
  approuve: "bg-success/10 text-success border-success/30",
  refuse: "bg-destructive/10 text-destructive border-destructive/30",
};

function mapContract(item: ContractApiResponse): Contract {
  return {
    id: item.id,
    status: item.status,
    type: item.type,
    montant_declare: item.montant_declare || 0,
    client_id: item.client_id,
  };
}

export default function AgentDashboard() {
  const { toast } = useToast();
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [pendingContracts, setPendingContracts] = useState<Contract[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // FIX: useCallback so fetchData is stable and can be called after mutations
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: use consistent query-param pattern for both endpoints
      const [activeData, pendingData] = await Promise.all([
        apiRequest<ContractApiResponse[]>('/api/contrats?status=approuve'),
        apiRequest<ContractApiResponse[]>('/api/contrats?status=non_traite'),
      ]);
      setActiveContracts(Array.isArray(activeData) ? activeData.map(mapContract) : []);
      setPendingContracts(Array.isArray(pendingData) ? pendingData.map(mapContract) : []);
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setActiveContracts([]);
      setPendingContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();

    // Mock data for claims (back-end not ready)
    setClaims([
      { id: 1, status: "non_traite", description: "Accident de voiture - collision arrière", contractType: "tous_risques", montantDeclare: "5000 TND", fraudRisk: 15 },
      { id: 2, status: "en_cours", description: "Vol de véhicule", contractType: "vol", montantDeclare: "15000 TND", fraudRisk: 30 },
      { id: 3, status: "traite", description: "Bris de glace - pare-brise", contractType: "bris_de_glace", montantDeclare: "800 TND", fraudRisk: 5 },
      { id: 4, status: "non_traite", description: "Incendie partiel", contractType: "incendie", montantDeclare: "12000 TND", fraudRisk: 45 },
    ]);
  }, [fetchData]);

  const handleApprove = async (id: string | number) => {
    const key = String(id);
    setApprovingId(key);
    try {
      await apiRequest(`/api/contrats/${key}/status`, {
        method: 'PATCH',
        body: { status: 'approuve' },
      });
      toast({ title: "Contrat approuvé", description: `Le contrat #${key} a été approuvé.` });
      // FIX: single source of truth — just re-fetch instead of optimistic + re-fetch
      await fetchData();
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message ?? "Impossible d'approuver.", variant: "destructive" });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string | number) => {
    const key = String(id);
    setRejectingId(key);
    try {
      await apiRequest(`/api/contrats/${key}/status`, {
        method: 'PATCH',
        body: { status: 'refuse' },
      });
      toast({ title: "Contrat refusé", description: `Le contrat #${key} a été refusé.` });
      // FIX: re-fetch to reflect refused contracts (they disappear from pending)
      await fetchData();
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message ?? "Impossible de refuser.", variant: "destructive" });
    } finally {
      setRejectingId(null);
    }
  };

  const renderContractsList = (contractsList: Contract[], type: string) => {
    if (loading) return <div>Chargement...</div>;
    if (contractsList.length === 0) return <div>Aucun contrat trouvé.</div>;

    return (
      <div className="space-y-4">
        {contractsList.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl border shadow-card p-6"
          >
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-display font-bold text-foreground">Contrat #{c.id}</span>
                  <Badge variant="outline" className={statusColors[c.status] || ""}>{c.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Type: <span className="text-foreground font-medium">{c.type}</span>
                </p>
                <p className="text-sm font-medium text-foreground">Montant déclaré: {c.montant_declare} TND</p>
                <p className="text-sm text-muted-foreground">Client ID: {c.client_id}</p>
              </div>

              {type === "en_attente" && (
                <div className="flex flex-row lg:flex-col gap-2 self-start">
                  <Button
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90"
                    disabled={approvingId === String(c.id) || rejectingId === String(c.id)}
                    onClick={() => void handleApprove(c.id)}
                  >
                    {approvingId === String(c.id)
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><ThumbsUp className="w-4 h-4 mr-1" /> Approuver</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={approvingId === String(c.id) || rejectingId === String(c.id)}
                    onClick={() => void handleReject(c.id)}
                  >
                    {rejectingId === String(c.id)
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><ThumbsDown className="w-4 h-4 mr-1" /> Refuser</>}
                  </Button>
                  <Button size="sm" variant="ghost" disabled>
                    <Eye className="w-4 h-4 mr-1" /> Détails
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderClaimsList = (claimsList: Claim[]) => {
    if (claimsList.length === 0) return <div>Aucun sinistre trouvé.</div>;

    return (
      <div className="space-y-4">
        {claimsList.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl border shadow-card p-6"
          >
            <div className="flex flex-col lg:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-display font-bold text-foreground">Sinistre #{c.id}</span>
                  <Badge variant="outline" className={statusColors[c.status] || ""}>{c.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Type de contrat: <span className="text-foreground font-medium">{c.contractType}</span>
                </p>
                <p className="text-sm font-medium text-foreground">Montant déclaré: {c.montantDeclare}</p>
                <p className="text-sm text-muted-foreground">Description: {c.description}</p>
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Analyse IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Risque fraude:</span>
                    <Progress value={c.fraudRisk} className="flex-1 h-2" />
                    <span className={`text-xs font-bold ${c.fraudRisk > 50 ? "text-destructive" : c.fraudRisk > 25 ? "text-warning" : "text-success"}`}>
                      {c.fraudRisk}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-row lg:flex-col gap-2 self-start">
                <Button size="sm" variant="ghost" disabled>
                  <Eye className="w-4 h-4 mr-1" /> Détails
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground">ClaimSphere</span>
              <Badge className="ml-2 bg-accent text-accent-foreground text-xs">Agent</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">Agent Karim</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Contrats Actifs", value: activeContracts.length, icon: CheckCircle, color: "text-success" },
            { label: "Contrats en Attente", value: pendingContracts.length, icon: Clock, color: "text-warning" },
            { label: "Sinistres en Attente", value: claims.filter(c => c.status === "non_traite").length, icon: AlertTriangle, color: "text-warning" },
            { label: "Sinistres en Cours", value: claims.filter(c => c.status === "en_cours").length, icon: Users, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} custom={i} className="bg-card rounded-xl p-5 border shadow-card">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="contrats" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contrats">Contrats</TabsTrigger>
            <TabsTrigger value="sinistres">Sinistres</TabsTrigger>
          </TabsList>

          <TabsContent value="contrats" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Contrats Actifs</h2>
              {renderContractsList(activeContracts, "actifs")}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">Contrats en Attente</h2>
              {renderContractsList(pendingContracts, "en_attente")}
            </div>
          </TabsContent>

          <TabsContent value="sinistres" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Sinistres en Attente</h2>
              {renderClaimsList(claims.filter(c => c.status === "non_traite"))}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">Sinistres en Cours</h2>
              {renderClaimsList(claims.filter(c => c.status === "en_cours"))}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">Sinistres Traités</h2>
              {renderClaimsList(claims.filter(c => c.status === "traite"))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}