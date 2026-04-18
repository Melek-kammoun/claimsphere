import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Car, Calendar, CreditCard, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-client";

interface Contract {
  id: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  montant_declare: number;
  marque: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
};

export default function ContractsPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await apiRequest<Contract[]>('/api/contrats/client/me');
        setContracts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Mes contrats</h2>
          <p className="text-muted-foreground text-sm">Consultez et gérez vos contrats d'assurance.</p>
        </div>
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => navigate("/dashboard/contracts/new")}
        >
          <Plus className="w-4 h-4 mr-2" /> Nouvelle souscription
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Chargement...</p>
      ) : contracts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Aucun contrat pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {contracts.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl border shadow-card overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground">{c.marque}</h3>
                      <p className="text-sm text-muted-foreground">#{String(c.id).slice(0, 8)} · {c.type}</p>                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      c.status === "Actif"
                        ? "bg-success/5 text-success border-success/30 self-start"
                        : "bg-warning/5 text-warning border-warning/30 self-start"
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Formule", value: c.type, icon: FileText },
                    { label: "Début", value: formatDate(c.start_date), icon: Calendar },
                    { label: "Fin", value: formatDate(c.end_date), icon: Calendar },
                    { label: "Montant déclaré", value: `${c.montant_declare?.toLocaleString()} DH`, icon: CreditCard },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <item.icon className="w-3 h-3" /> {item.label}
                      </div>
                      <div className="text-sm font-medium text-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-muted/30 border-t px-6 py-3 flex gap-3">
                <Button variant="ghost" size="sm"><Download className="w-4 h-4 mr-1" /> Télécharger attestation</Button>
                <Button variant="ghost" size="sm"><FileText className="w-4 h-4 mr-1" /> Conditions</Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}