import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Car, Calendar, CreditCard, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const contracts = [
  {
    id: "CS-2026-0142",
    vehicle: "Dacia Logan 2023",
    plate: "12345-A-78",
    type: "Tous Risques",
    status: "Actif",
    startDate: "15/09/2025",
    endDate: "15/09/2026",
    premium: "2 800 DH/an",
    nextPayment: "15/03/2026",
  },
  {
    id: "CS-2026-0087",
    vehicle: "Renault Clio 2021",
    plate: "67890-B-12",
    type: "Tiers Basique",
    status: "Actif",
    startDate: "03/12/2025",
    endDate: "03/12/2026",
    premium: "1 200 DH/an",
    nextPayment: "03/06/2026",
  },
];

export default function ContractsPage() {
  const navigate = useNavigate();

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
                    <h3 className="font-display font-bold text-foreground">{c.vehicle}</h3>
                    <p className="text-sm text-muted-foreground">{c.id} · Plaque: {c.plate}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-success/5 text-success border-success/30 self-start">
                  {c.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Formule", value: c.type, icon: FileText },
                  { label: "Période", value: `${c.startDate} - ${c.endDate}`, icon: Calendar },
                  { label: "Prime annuelle", value: c.premium, icon: CreditCard },
                  { label: "Prochain paiement", value: c.nextPayment, icon: Calendar },
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
    </div>
  );
}
