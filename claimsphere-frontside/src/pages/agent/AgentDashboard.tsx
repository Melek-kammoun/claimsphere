import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Users, Shield, Filter, Search,
  CheckCircle, Clock, Eye, ThumbsUp, ThumbsDown,
  UserCheck, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } } as const),
};

type ContractApiResponse = {
  id: number;
  status: string;
  type: string;
  montant_declare: number;
  client_id: string;
};

const statusColors: Record<string, string> = {
  non_traite: "bg-warning/10 text-warning border-warning/30",
  approuve: "bg-success/10 text-success border-success/30",
  refuse: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function AgentDashboard() {
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [pendingContracts, setPendingContracts] = useState<Contract[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch active contracts
        const activeResponse = await fetch("http://localhost:5000/api/contrats?status=actif");
        const activeData = await activeResponse.json();
        setActiveContracts(
          Array.isArray(activeData)
            ? activeData.map((item: ContractApiResponse) => ({
                id: item.id,
                status: item.status,
                type: item.type,
                montant_declare: item.montant_declare || 0,
                client_id: item.client_id,
              }))
            : []
        );

        // Fetch pending contracts
        const pendingResponse = await fetch("http://localhost:5000/api/contrats/pending");
        const pendingData = await pendingResponse.json();
        setPendingContracts(
          Array.isArray(pendingData)
            ? pendingData.map((item: ContractApiResponse) => ({
                id: item.id,
                status: item.status,
                type: item.type,
                montant_declare: item.montant_declare || 0,
                client_id: item.client_id,
              }))
            : []
        );

        // Mock data for claims (back-end not ready)
        setClaims([
          {
            id: 1,
            status: "non_traite",
            description: "Accident de voiture - collision arrière",
            contractType: "tous_risques",
            montantDeclare: "5000 TND",
            fraudRisk: 15,
          },
          {
            id: 2,
            status: "en_cours",
            description: "Vol de véhicule",
            contractType: "vol",
            montantDeclare: "15000 TND",
            fraudRisk: 30,
          },
          {
            id: 3,
            status: "traite",
            description: "Bris de glace - pare-brise",
            contractType: "bris_de_glace",
            montantDeclare: "800 TND",
            fraudRisk: 5,
          },
          {
            id: 4,
            status: "non_traite",
            description: "Incendie partiel",
            contractType: "incendie",
            montantDeclare: "12000 TND",
            fraudRisk: 45,
          },
        ]);
      } catch (err) {
        console.error("Erreur de chargement:", err);
        setActiveContracts([]);
        setPendingContracts([]);
        setClaims([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // ✅ Approuver un contrat
  const handleApprove = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/contrats/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approuve' })
      });
      setPendingContracts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Erreur approbation:", err);
    }
  };

  // ✅ Refuser un contrat
  const handleReject = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/contrats/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'refuse' })
      });
      setPendingContracts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Erreur refus:", err);
    }
  };

  const renderContractsList = (contractsList: Contract[], type: string) => {
    if (loading) {
      return <div>Chargement...</div>;
    }
    if (contractsList.length === 0) {
      return <div>Aucun contrat trouvé.</div>;
    }
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
                    onClick={() => handleApprove(c.id)}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" /> Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(c.id)}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" /> Refuser
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
    if (claimsList.length === 0) {
      return <div>Aucun sinistre trouvé.</div>;
    }
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

                {/* AI indicator */}
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
      {/* Header */}
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
        <Tabs defaultValue="contrats" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contrats">Contrats</TabsTrigger>
            <TabsTrigger value="sinistres">Sinistres</TabsTrigger>
          </TabsList>

          <TabsContent value="contrats" className="space-y-6">
            {/* Contrats Actifs */}
            <div>
              <h2 className="text-xl font-bold mb-4">Contrats Actifs</h2>
              {renderContractsList(activeContracts, "actifs")}
            </div>

            {/* Contrats en Attente */}
            <div>
              <h2 className="text-xl font-bold mb-4">Contrats en Attente</h2>
              {renderContractsList(pendingContracts, "en_attente")}
            </div>
          </TabsContent>

          <TabsContent value="sinistres" className="space-y-6">
            {/* Sinistres en Attente */}
            <div>
              <h2 className="text-xl font-bold mb-4">Sinistres en Attente</h2>
              {renderClaimsList(claims.filter(c => c.status === "non_traite"))}
            </div>

            {/* Sinistres en Cours */}
            <div>
              <h2 className="text-xl font-bold mb-4">Sinistres en Cours</h2>
              {renderClaimsList(claims.filter(c => c.status === "en_cours"))}
            </div>

            {/* Sinistres Traités */}
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