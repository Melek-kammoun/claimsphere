import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  UserPlus,
  Search,
  Trash2,
  BadgeCheck,
  Clock3,
  AlertTriangle,
  Mail,
  Briefcase,
  UserCog,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-client";
import { getStoredUserRole, isAdminSession } from "@/lib/auth-role";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } } as const),
};

type Agent = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  specialty?: string | null;
  status: "Actif" | "En attente" | "Suspendu";
  assignedCases?: number;
  created_at?: string;
  lastActive?: string;
};

type AgentFormData = {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  specialty?: string;
};

const statusStyles: Record<Agent["status"], string> = {
  Actif: "bg-success/10 text-success border-success/30",
  "En attente": "bg-warning/10 text-warning border-warning/30",
  Suspendu: "bg-destructive/10 text-destructive border-destructive/30",
};

const SPECIALTIES = [
  "Sinistres auto",
  "Relation client",
  "Contrôle fraude",
  "Expertise dommages",
  "Gestion sinistres",
  "Investigation",
];

export default function AdminAgentsPage() {
  const sessionRole = getStoredUserRole();
  const isAdmin = isAdminSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgentFormData>({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "Sinistres auto",
  });
  const { toast } = useToast();

  // Charger les agents depuis le backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<Agent[]>("/agents");
        setAgents(data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des agents:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les agents.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [toast]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesFilter = filterStatus === "all" || agent.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [agents, searchQuery, filterStatus]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      specialty: "Sinistres auto",
    });
    setEditingAgentId(null);
  };

  // Ajouter un agent
  const handleAddAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Champs requis",
        description: "Le nom, l'email et le mot de passe sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const createdAgent = await apiRequest<Agent>("/agents", {
        method: "POST",
        body: {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone || undefined,
          specialty: formData.specialty || undefined,
        },
      });

      setAgents((current) => [createdAgent, ...current]);
      resetForm();
      setIsAddDialogOpen(false);

      toast({
        title: "Agent créé",
        description: `${formData.full_name} a été ajouté à l'équipe.`,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'agent.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modifier le statut d'un agent
  const handleStatusChange = async (agentId: string, newStatus: "Actif" | "En attente" | "Suspendu") => {
    try {
      const updatedAgent = await apiRequest<Agent>(`/agents/${agentId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });

      setAgents((current) =>
        current.map((agent) =>
          agent.id === agentId ? { ...agent, status: updatedAgent.status } : agent,
        ),
      );

      toast({
        title: "Statut mis à jour",
        description: `Agent est maintenant ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  // Supprimer un agent
  const handleDeleteAgent = async (agentId: string) => {
    const agent = agents.find((item) => item.id === agentId);

    try {
      await apiRequest(`/agents/${agentId}`, {
        method: "DELETE",
      });

      setAgents((current) => current.filter((item) => item.id !== agentId));
      setConfirmDeleteId(null);

      toast({
        title: "Agent supprimé",
        description: agent ? `${agent.full_name} a été retiré de la liste.` : "L'agent a été retiré.",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'agent.",
        variant: "destructive",
      });
    }
  };

  const stats = [
    {
      label: "Total agents",
      value: agents.length,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Actifs",
      value: agents.filter((a) => a.status === "Actif").length,
      icon: BadgeCheck,
      color: "text-success",
    },
    {
      label: "En attente",
      value: agents.filter((a) => a.status === "En attente").length,
      icon: Clock3,
      color: "text-warning",
    },
    {
      label: "Suspendus",
      value: agents.filter((a) => a.status === "Suspendu").length,
      icon: AlertTriangle,
      color: "text-destructive",
    },
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-card border shadow-card rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">Accès refusé</Badge>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Espace admin réservé</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Cette page est accessible uniquement aux comptes administrateurs.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Rôle détecté: {sessionRole || "aucun"}
            </p>
          </div>
          <Button asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <a href="/auth">Se connecter avec un compte admin</a>
          </Button>
        </div>
      </div>
    );
  }

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
              <Badge className="ml-2 bg-accent text-accent-foreground text-xs">Admin</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCog className="w-4 h-4 text-primary" />
            </div>
            <Badge className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20">
              {sessionRole === "admin" ? "Admin connecté" : "Accès admin"}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="flex flex-col lg:flex-row justify-between gap-4"
        >
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Gestion des agents</h2>
            <p className="text-muted-foreground text-sm">
              Ajoutez des agents, contrôlez leur statut et gérez les équipes.
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                <UserPlus className="w-4 h-4 mr-2" /> Créer un agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Créer un nouvel agent</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 mt-4" onSubmit={handleAddAgent}>
                <div className="space-y-2">
                  <Label>Nom complet *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData((c) => ({ ...c, full_name: e.target.value }))}
                    placeholder="Ex. Amel Jaziri"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                      placeholder="agent@claimsphere.tn"
                      required
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mot de passe *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="+216 XX XXX XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  <Select
                    value={formData.specialty}
                    onValueChange={(v) => setFormData((c) => ({ ...c, specialty: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      resetForm();
                      setIsAddDialogOpen(false);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    {isSubmitting ? "Création..." : "Créer l'agent"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={index + 1}
              className="bg-card rounded-xl p-5 border shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, email ou spécialité..."
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Actif">Actif</SelectItem>
              <SelectItem value="En attente">En attente</SelectItem>
              <SelectItem value="Suspendu">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des agents */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-card rounded-xl border shadow-card p-8 text-center text-muted-foreground">
              Chargement des agents...
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="bg-card rounded-xl border shadow-card p-8 text-center text-muted-foreground">
              {searchQuery || filterStatus !== "all"
                ? "Aucun agent ne correspond à votre recherche."
                : "Aucun agent créé pour le moment."}
            </div>
          ) : (
            filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-card rounded-xl border shadow-card p-5"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold text-foreground">{agent.full_name}</span>
                      <Badge variant="outline" className={statusStyles[agent.status]}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                    {agent.phone && (
                      <p className="text-sm text-muted-foreground">{agent.phone}</p>
                    )}
                    {agent.specialty && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> {agent.specialty}
                      </p>
                    )}
                    {agent.assignedCases !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Dossiers assignés: <span className="text-foreground font-medium">{agent.assignedCases}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Dernière activité: {agent.lastActive || "Jamais connecté"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 self-start">
                    <Select
                      value={agent.status}
                      onValueChange={(value) =>
                        handleStatusChange(agent.id, value as Agent["status"])
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="En attente">En attente</SelectItem>
                        <SelectItem value="Suspendu">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>

                    {confirmDeleteId === agent.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="flex-1"
                        >
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDeleteId(agent.id)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </Button>
                    )}
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
