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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } } as const),
};

type Agent = {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  status: "Actif" | "En attente" | "Suspendu";
  assignedCases?: number;
  lastActive?: string;
};

const initialAgents: Agent[] = [
  {
    id: "1",
    name: "Karim Ben Salah",
    email: "karim.bensalah@claimsphere.tn",
    specialty: "Sinistres auto",
    status: "Actif",
    assignedCases: 18,
    lastActive: "Il y a 12 min",
  },
  {
    id: "2",
    name: "Sara Mzoughi",
    email: "sara.mzoughi@claimsphere.tn",
    specialty: "Relation client",
    status: "Actif",
    assignedCases: 11,
    lastActive: "Il y a 1 h",
  },
  {
    id: "3",
    name: "Oussama Trabelsi",
    email: "oussama.trabelsi@claimsphere.tn",
    specialty: "Contrôle fraude",
    status: "En attente",
    assignedCases: 4,
    lastActive: "Hier",
  },
  {
    id: "4",
    name: "Meriem Laaroussi",
    email: "meriem.laaroussi@claimsphere.tn",
    specialty: "Expertise dommages",
    status: "Suspendu",
    assignedCases: 0,
    lastActive: "Il y a 2 semaines",
  },
];

const statusStyles: Record<Agent["status"], string> = {
  Actif: "bg-success/10 text-success border-success/30",
  "En attente": "bg-warning/10 text-warning border-warning/30",
  Suspendu: "bg-destructive/10 text-destructive border-destructive/30",
};

const API_URL = import.meta.env.VITE_NEST_API_URL || 'http://localhost:5000';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    email: "",
    specialty: "Sinistres auto",
    status: "Actif" as Agent["status"],
  });
  const { toast } = useToast();

  // Charger les agents depuis le backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<Agent[]>(`${API_URL}/users/agents`);
        // Normaliser les données avec des valeurs par défaut
        const normalizedAgents = data.map((agent) => ({
          ...agent,
          assignedCases: agent.assignedCases || 0,
          lastActive: agent.lastActive || "Jamais",
          specialty: agent.specialty || "Non spécifiée",
        }));
        setAgents(normalizedAgents);
      } catch (error) {
        console.error("Erreur lors du chargement des agents:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les agents. Affichage des données par défaut.",
          variant: "destructive",
        });
        // Afficher les données initiales en cas d'erreur
        setAgents(initialAgents);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [toast]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "all" || agent.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [agents, searchQuery, filterStatus]);

  // ─── Ajouter un agent ───
  const handleAddAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newAgent.name.trim() || !newAgent.email.trim()) {
      toast({
        title: "Champs requis",
        description: "Le nom et l'email de l'agent sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const name = newAgent.name.trim();
    const email = newAgent.email.trim();

    setIsSubmitting(true);

    try {
      const createdAgent = await apiRequest<Agent>(`${API_URL}/users`, {
        method: "POST",
        body: {
          name,
          email,
          status: newAgent.status,
          specialty: newAgent.specialty,
          role: "agent",
          password: "default",
        },
      });
      
      const agent: Agent = {
        ...createdAgent,
        assignedCases: createdAgent.assignedCases || 0,
        lastActive: createdAgent.lastActive || "À l'instant",
      };
      
      setAgents((current) => [agent, ...current]);
      setNewAgent({ name: "", email: "", specialty: "Sinistres auto", status: "Actif" });
      setIsAddDialogOpen(false);

      toast({
        title: "Agent ajouté",
        description: `${name} a été ajouté à l'équipe.`,
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'agent dans la base de données.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Supprimer un agent ───
  const handleDeleteAgent = async (agentId: string) => {
    const agent = agents.find((item) => item.id === agentId);

    try {
      await apiRequest(`${API_URL}/users/${agentId}`, {
        method: "DELETE",
      });

      setAgents((current) => current.filter((item) => item.id !== agentId));

      toast({
        title: "Agent supprimé",
        description: agent ? `${agent.name} a été retiré de la liste.` : "L'agent a été retiré.",
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
    { label: "Total agents", value: agents.length, icon: Users, color: "text-primary" },
    { label: "Actifs", value: agents.filter(a => a.status === "Actif").length, icon: BadgeCheck, color: "text-success" },
    { label: "En attente", value: agents.filter(a => a.status === "En attente").length, icon: Clock3, color: "text-warning" },
    { label: "Suspendus", value: agents.filter(a => a.status === "Suspendu").length, icon: AlertTriangle, color: "text-destructive" },
  ];

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
            <span className="text-sm font-medium text-foreground hidden sm:block">Super admin</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Gestion des agents</h2>
            <p className="text-muted-foreground text-sm">Ajoutez des agents, contrôlez leur statut et retirez-les en un clic.</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                <UserPlus className="w-4 h-4 mr-2" /> Ajouter un agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Nouvel agent</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 mt-4" onSubmit={handleAddAgent}>
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input
                    value={newAgent.name}
                    onChange={(e) => setNewAgent(c => ({ ...c, name: e.target.value }))}
                    placeholder="Ex. Amel Jaziri"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent(c => ({ ...c, email: e.target.value }))}
                      placeholder="agent@claimsphere.tn"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  <Select value={newAgent.specialty} onValueChange={(v) => setNewAgent(c => ({ ...c, specialty: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir une spécialité" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sinistres auto">Sinistres auto</SelectItem>
                      <SelectItem value="Relation client">Relation client</SelectItem>
                      <SelectItem value="Contrôle fraude">Contrôle fraude</SelectItem>
                      <SelectItem value="Expertise dommages">Expertise dommages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={newAgent.status} onValueChange={(v) => setNewAgent(c => ({ ...c, status: v as Agent["status"] }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir un statut" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="Suspendu">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90">
                    {isSubmitting ? "Ajout..." : "Créer l'agent"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} custom={index + 1} className="bg-card rounded-xl p-5 border shadow-card">
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
              placeholder="Rechercher un agent, un email ou une spécialité..."
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
              Aucun agent ne correspond à votre recherche.
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
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-display font-bold text-foreground">{agent.name}</span>
                      <Badge variant="outline" className={statusStyles[agent.status]}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> {agent.specialty}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dossiers assignés: <span className="text-foreground font-medium">{agent.assignedCases}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Dernière activité: {agent.lastActive}</p>
                  </div>
                  <div className="flex gap-2 self-start">
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAgent(agent.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Supprimer
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
