import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Users, FileText, Shield, Filter, Search,
  CheckCircle, Clock, XCircle, Eye, ThumbsUp, ThumbsDown,
  UserCheck, Bot, TrendingUp, BarChart3,
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

const cases = [
  { id: "SN-2026-034", client: "Ahmed Benali", type: "Accident", priority: "Haute", status: "En attente", amount: "15 000 DH", fraudRisk: 12, aiRecommendation: "Approuver - dossier conforme" },
  { id: "SN-2026-041", client: "Fatima Zohra", type: "Vol", priority: "Urgente", status: "En attente", amount: "45 000 DH", fraudRisk: 78, aiRecommendation: "Vérification expert requise - anomalies détectées" },
  { id: "SN-2026-039", client: "Youssef Alami", type: "Bris de glace", priority: "Normale", status: "En traitement", amount: "3 200 DH", fraudRisk: 5, aiRecommendation: "Approuver - cas standard" },
  { id: "SN-2026-028", client: "Sara Idrissi", type: "Accident", priority: "Haute", status: "Expert demandé", amount: "28 000 DH", fraudRisk: 35, aiRecommendation: "Attente rapport expert" },
];

const priorityColors: Record<string, string> = {
  Urgente: "bg-destructive/10 text-destructive border-destructive/30",
  Haute: "bg-warning/10 text-warning border-warning/30",
  Normale: "bg-primary/10 text-primary border-primary/30",
};

export default function AgentDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredCases = cases.filter((c) => {
    const matchSearch = c.client.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || c.type === filterType;
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
            { label: "Dossiers en attente", value: "12", icon: Clock, color: "text-warning" },
            { label: "Traités aujourd'hui", value: "8", icon: CheckCircle, color: "text-success" },
            { label: "Alertes fraude IA", value: "3", icon: AlertTriangle, color: "text-destructive" },
            { label: "Clients actifs", value: "1 240", icon: Users, color: "text-primary" },
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
              placeholder="Rechercher par client ou numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Accident">Accident</SelectItem>
              <SelectItem value="Vol">Vol</SelectItem>
              <SelectItem value="Bris de glace">Bris de glace</SelectItem>
              <SelectItem value="Incendie">Incendie</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cases */}
        <div className="space-y-4">
          {filteredCases.map((c, i) => (
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
                    <Badge variant="outline" className={priorityColors[c.priority]}>{c.priority}</Badge>
                    <Badge variant="outline">{c.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Client: <span className="text-foreground font-medium">{c.client}</span> · Type: {c.type}</p>
                  <p className="text-sm font-medium text-foreground">Montant réclamé: {c.amount}</p>

                  {/* AI indicator */}
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Analyse IA</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{c.aiRecommendation}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Risque fraude:</span>
                      <Progress value={c.fraudRisk} className="flex-1 h-2" />
                      <span className={`text-xs font-bold ${c.fraudRisk > 50 ? "text-destructive" : c.fraudRisk > 25 ? "text-warning" : "text-success"}`}>
                        {c.fraudRisk}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2 self-start">
                  <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90">
                    <ThumbsUp className="w-4 h-4 mr-1" /> Approuver
                  </Button>
                  <Button size="sm" variant="destructive">
                    <ThumbsDown className="w-4 h-4 mr-1" /> Refuser
                  </Button>
                  <Button size="sm" variant="outline">
                    <UserCheck className="w-4 h-4 mr-1" /> Expert
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4 mr-1" /> Détails
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
