import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileText, AlertTriangle, CreditCard, Bell, Plus, TrendingUp,
  Car, Calendar, ChevronRight, CheckCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/useDashboard";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } } as const),
};

const statusColors: Record<string, string> = {
  warning: "bg-warning/10 text-warning",
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
};

export default function DashboardHome() {
  const { user, stats, contracts, notifications, loading } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Bonjour, {loading ? "..." : user?.full_name ?? "là"} 👋
          </h2>
          <p className="text-muted-foreground text-sm">Voici un résumé de votre espace assurance.</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle assurance
        </Button>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Contrats actifs", value: loading ? "..." : String(stats.activeContracts), icon: FileText, color: "text-primary" },
          { label: "Sinistres en cours", value: loading ? "..." : String(stats.ongoingClaims), icon: AlertTriangle, color: "text-warning" },
          { label: "Prochaine échéance", value: loading ? "..." : stats.nextDueIn ? `${stats.nextDueIn} jours` : "—", icon: Calendar, color: "text-destructive" },
          { label: "Total payé (2026)", value: loading ? "..." : `${stats.totalPaid.toLocaleString()} DH`, icon: CreditCard, color: "text-success" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1} className="bg-card rounded-xl p-5 border shadow-card">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contracts */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="lg:col-span-2 bg-card rounded-xl border shadow-card">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="font-display font-semibold text-foreground">Mes contrats</h3>
            <Link to="/dashboard/contracts" className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Chargement...</p>
            ) : contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun contrat pour le moment.</p>
            ) : (
              contracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{c.vehicle}</div>
                      <div className="text-xs text-muted-foreground">{c.id} · {c.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-success border-success/30 bg-success/5 mb-1">{c.status}</Badge>
                    <div className="text-xs text-muted-foreground">Expire: {c.expiry}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="bg-card rounded-xl border shadow-card">
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </h3>
            <Badge className="bg-destructive text-destructive-foreground text-xs">
              {loading ? "..." : notifications.length}
            </Badge>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune notification.</p>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${statusColors[n.type]}`}>
                  <div className="mt-0.5">
                    {n.type === "warning" && <Clock className="w-4 h-4" />}
                    {n.type === "info" && <AlertTriangle className="w-4 h-4" />}
                    {n.type === "success" && <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{n.text}</p>
                    <p className="text-xs opacity-70 mt-1">{n.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}