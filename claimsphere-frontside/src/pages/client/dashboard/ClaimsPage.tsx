import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Plus, Upload, Camera, FileText, MapPin,
  CheckCircle, Clock, XCircle, ChevronRight, QrCode, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const claims = [
  { id: "SN-2026-034", date: "12/02/2026", type: "Accident", status: "En traitement", vehicle: "Dacia Logan 2023", amount: "15 000 DH", aiSuggestion: "Remboursement partiel recommandé" },
  { id: "SN-2025-189", date: "28/11/2025", type: "Bris de glace", status: "Remboursé", vehicle: "Renault Clio 2021", amount: "2 500 DH", aiSuggestion: null },
  { id: "SN-2025-102", date: "05/08/2025", type: "Vol", status: "Refusé", vehicle: "Dacia Logan 2023", amount: "45 000 DH", aiSuggestion: "Anomalie détectée par l'IA" },
];

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  "En traitement": { color: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  "Remboursé": { color: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  "Refusé": { color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

export default function ClaimsPage() {
  const [showNewClaim, setShowNewClaim] = useState(false);
  const { toast } = useToast();

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Sinistre déclaré", description: "Votre déclaration a été enregistrée. Vous recevrez une notification de suivi." });
    setShowNewClaim(false);
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Déclaration de sinistre</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitClaim} className="space-y-4 mt-4">
              <div>
                <Label>Contrat concerné</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un contrat" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cs-0142">CS-2026-0142 - Dacia Logan</SelectItem>
                    <SelectItem value="cs-0087">CS-2026-0087 - Renault Clio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type de sinistre</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
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
                <Input type="date" />
              </div>
              <div>
                <Label>Lieu du sinistre</Label>
                <div className="relative">
                  <Input placeholder="Adresse ou localisation" />
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Décrivez les circonstances du sinistre..." rows={3} />
              </div>
              <div>
                <Label>Documents (PV, permis, carte grise)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Glissez vos fichiers ou cliquez pour parcourir</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 10 MB)</p>
                </div>
              </div>
              <div>
                <Label>Photos du véhicule</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowNewClaim(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90">Soumettre</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Code */}
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

      {/* Claims list */}
      <div className="space-y-4">
        {claims.map((claim, i) => {
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
                      <span className="font-display font-semibold text-foreground">{claim.id}</span>
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
        })}
      </div>
    </div>
  );
}
