import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Car, FileText, Phone, MapPin, Mail, ChevronRight, Star, Clock, Users, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-car.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const offers = [
  {
    title: "Tiers Basique",
    price: "1 200",
    icon: Shield,
    features: ["Responsabilité civile", "Assistance 24/7", "Protection juridique"],
    popular: false,
  },
  {
    title: "Tous Risques",
    price: "2 800",
    icon: Car,
    features: ["Tous risques collision", "Vol & incendie", "Bris de glace", "Assistance premium"],
    popular: true,
  },
  {
    title: "Confort Plus",
    price: "3 500",
    icon: Star,
    features: ["Tous risques étendu", "Véhicule de remplacement", "0 franchise", "Valeur à neuf"],
    popular: false,
  },
];

const stats = [
  { value: "50K+", label: "Clients satisfaits", icon: Users },
  { value: "98%", label: "Taux de satisfaction", icon: Star },
  { value: "<24h", label: "Traitement sinistres", icon: Clock },
  { value: "100%", label: "Digital & simple", icon: Zap },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">ClaimSphere</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#offres" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Nos offres</a>
            <a href="#apropos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">À propos</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="bg-gradient-hero min-h-[85vh] flex items-center relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-[120px]" />
          </div>
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div initial="hidden" animate="visible" className="text-primary-foreground">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-sm mb-6">
                <Zap className="w-4 h-4 text-accent" />
                Assurance auto 100% digitale
              </motion.div>
              <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Protégez votre véhicule en{" "}
                <span className="text-accent">quelques clics</span>
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
                ClaimSphere révolutionne l'assurance automobile avec une plateforme intelligente, rapide et transparente. Souscription en ligne, gestion des sinistres par IA.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                <Link to="/auth?tab=signup">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base px-8">
                    Commencer maintenant
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#offres">
                  <Button size="lg" variant="outline" className="border-primary-foreground/10 bg-primary-foreground/10text-primary-foreground hover:bg-primary-foreground/10">
                    Découvrir les offres
                  </Button>
                </a>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <img src={heroImage} alt="ClaimSphere assurance auto" className="w-full rounded-2xl shadow-elevated" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="font-display text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Offres */}
      <section id="offres" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nos formules d'assurance
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des offres adaptées à chaque besoin, avec une couverture complète et des tarifs compétitifs.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {offers.map((offer, i) => (
              <motion.div
                key={offer.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`relative rounded-2xl p-8 border ${
                  offer.popular
                    ? "border-primary bg-card shadow-elevated"
                    : "border-border bg-card shadow-card"
                }`}
              >
                {offer.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-accent text-accent-foreground text-xs font-semibold px-4 py-1 rounded-full">
                    Le plus populaire
                  </div>
                )}
                <offer.icon className={`w-10 h-10 mb-4 ${offer.popular ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{offer.title}</h3>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold text-foreground">{offer.price}</span>
                  <span className="text-muted-foreground text-sm"> DH/an</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {offer.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?tab=signup">
                  <Button className={`w-full ${offer.popular ? "bg-gradient-primary text-primary-foreground hover:opacity-90" : ""}`} variant={offer.popular ? "default" : "outline"}>
                    Souscrire
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="apropos" className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
                L'assurance auto <span className="text-gradient-primary">réinventée</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-6 leading-relaxed">
                ClaimSphere combine intelligence artificielle et expertise humaine pour vous offrir une expérience d'assurance sans précédent. Déclaration de sinistre en quelques minutes, suivi en temps réel, et remboursement accéléré.
              </motion.p>
              <motion.div variants={fadeUp} custom={2} className="space-y-4">
                {["Souscription 100% en ligne en 5 minutes", "IA pour détection de fraude et estimation", "Suivi de sinistre en temps réel", "Support chatbot 24/7"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Shield, title: "Protection", desc: "Couverture complète" },
                { icon: Clock, title: "Rapidité", desc: "Traitement en 24h" },
                { icon: Users, title: "Accompagnement", desc: "Support dédié" },
                { icon: Zap, title: "Innovation", desc: "IA intégrée" },
              ].map((card) => (
                <div key={card.title} className="bg-card rounded-xl p-6 shadow-card border text-center">
                  <card.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h4 className="font-display font-semibold text-foreground mb-1">{card.title}</h4>
                  <p className="text-xs text-muted-foreground">{card.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-hero text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <span className="font-display font-bold text-xl">ClaimSphere</span>
              </div>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                Votre partenaire assurance automobile intelligent et digital.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Produits</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li>Assurance tiers</li>
                <li>Tous risques</li>
                <li>Confort Plus</li>
                <li>Assistance routière</li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li>À propos</li>
                <li>Carrières</li>
                <li>Conditions générales</li>
                <li>Politique de confidentialité</li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +212 5 22 00 00 00</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> contact@claimsphere.ma</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Casablanca, Maroc</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-sm text-primary-foreground/50">
            © 2026 ClaimSphere. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
