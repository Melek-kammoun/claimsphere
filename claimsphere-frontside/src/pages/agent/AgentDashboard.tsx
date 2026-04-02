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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } } as const),
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

export default function AgentDashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/claims");
        const data = await response.json();
        setClaims(
          Array.isArray(data)
            ? data.map((item: any) => ({
                id: item.id,
                status: item.status,
                description: item.description,
                contractType: item.contracts?.type || "-",
                montantDeclare: item.contracts?.montant_declare ? `${item.contracts.montant_declare} TND` : "-",
                fraudRisk: item.ai_scores?.[0]?.score ? Math.round(item.ai_scores[0].score * 100) : 0,
              }))
            : []
        );
      } catch (err) {
        setClaims([]);
      }
      setLoading(false);
    };
    fetchClaims();
  }, []);

  // ✅ Approuver un sinistre
  const handleApprove = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/claims/${id}/approve`, { method: 'PATCH' });
      setClaims(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Erreur approbation:", err);
    }
  };

  // ✅ Refuser un sinistre
  const handleReject = async (id: number) => {
    try {
      await fetch(`http://localhost:5000/api/claims/${id}/reject`, { method: 'PATCH' });
      setClaims(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Erreur refus:", err);
    }
  };

  const filteredCases = claims.filter((c) => {
    const matchSearch =
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || c.contractType === filterType;
    return matchSearch && matchType;
  });

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
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Dossiers en attente", value: claims.filter(c => c.status === "non_traite").length, icon: Clock, color: "text-warning" },
            { label: "Approuvés", value: claims.filter(c => c.status === "approuve").length, icon: CheckCircle, color: "text-success" },
            { label: "Refusés", value: claims.filter(c => c.status === "refuse").length, icon: AlertTriangle, color: "text-destructive" },
            { label: "Total", value: claims.length, icon: Users, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} custom={i} className="bg-card rounded-xl p-5 border shadow-card">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par description ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par type de contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="tous_risques">Tous risques</SelectItem>
              <SelectItem value="tiers">Tiers</SelectItem>
              <SelectItem value="vol">Vol</SelectItem>
              <SelectItem value="bris_de_glace">Bris de glace</SelectItem>
              <SelectItem value="incendie">Incendie</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cases */}
        <div className="space-y-4">
          {loading ? (
            <div>Chargement des sinistres...</div>
          ) : filteredCases.length === 0 ? (
            <div>Aucun sinistre trouvé.</div>
          ) : (
            filteredCases.map((c, i) => (
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
                      <span className="font-display font-bold text-foreground">{c.id}</span>
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

                  {/* ✅ Actions activées */}
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
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}