import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    searchParams.get("tab") === "signup" ? "signup" : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ cin: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    cin: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    contractNumber: "",
  });

  const validateLogin = () => {
    const errs: Record<string, string> = {};
    if (!loginForm.cin.trim()) errs.cin = "Le CIN est requis";
    if (!loginForm.password) errs.password = "Le mot de passe est requis";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs: Record<string, string> = {};
    if (!signupForm.fullName.trim()) errs.fullName = "Le nom complet est requis";
    if (!signupForm.cin.trim()) errs.cin = "Le CIN est requis";
    if (!signupForm.email.includes("@")) errs.email = "Email invalide";
    if (signupForm.password.length < 6) errs.password = "Minimum 6 caractères";
    if (signupForm.password !== signupForm.confirmPassword) errs.confirmPassword = "Les mots de passe ne correspondent pas";
    if (isExistingClient && !signupForm.contractNumber.trim()) errs.contractNumber = "Le numéro de contrat est requis";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    toast({ title: "Connexion réussie", description: "Bienvenue sur ClaimSphere !" });
    navigate("/dashboard");
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    toast({ title: "Compte créé avec succès", description: "Un email de confirmation a été envoyé." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <span className="font-display font-bold text-xl text-primary-foreground">ClaimSphere</span>
          </Link>
          <h1 className="font-display text-4xl font-bold text-primary-foreground leading-tight mb-4">
            Gérez votre assurance auto en toute simplicité
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            Souscription rapide, suivi en temps réel, support intelligent.
          </p>
        </div>
        <div className="relative z-10 text-primary-foreground/50 text-sm">
          © 2026 ClaimSphere
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-elevated p-8 w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>

          {/* Tabs */}
          <div className="flex rounded-lg bg-muted p-1 mb-8">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setErrors({}); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "login" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <Label htmlFor="cin">Numéro CIN</Label>
                  <Input
                    id="cin"
                    placeholder="AB123456"
                    value={loginForm.cin}
                    onChange={(e) => setLoginForm({ ...loginForm, cin: e.target.value })}
                    className={errors.cin ? "border-destructive" : ""}
                  />
                  {errors.cin && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cin}</p>}
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                </div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                  Se connecter
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <div>
                  <Label>Nom complet</Label>
                  <Input placeholder="Ahmed Benali" value={signupForm.fullName} onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })} className={errors.fullName ? "border-destructive" : ""} />
                  {errors.fullName && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fullName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CIN</Label>
                    <Input placeholder="AB123456" value={signupForm.cin} onChange={(e) => setSignupForm({ ...signupForm, cin: e.target.value })} className={errors.cin ? "border-destructive" : ""} />
                    {errors.cin && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cin}</p>}
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input placeholder="+212 6XX" value={signupForm.phone} onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@exemple.com" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Mot de passe</Label>
                    <Input type="password" placeholder="••••••" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} className={errors.password ? "border-destructive" : ""} />
                    {errors.password && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                  </div>
                  <div>
                    <Label>Confirmer</Label>
                    <Input type="password" placeholder="••••••" value={signupForm.confirmPassword} onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })} className={errors.confirmPassword ? "border-destructive" : ""} />
                    {errors.confirmPassword && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="existing" checked={isExistingClient} onCheckedChange={(v) => setIsExistingClient(!!v)} />
                  <Label htmlFor="existing" className="text-sm cursor-pointer">Déjà client ClaimSphere ?</Label>
                </div>
                {isExistingClient && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                    <Label>Numéro de contrat</Label>
                    <Input placeholder="CS-2026-XXXX" value={signupForm.contractNumber} onChange={(e) => setSignupForm({ ...signupForm, contractNumber: e.target.value })} className={errors.contractNumber ? "border-destructive" : ""} />
                    {errors.contractNumber && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.contractNumber}</p>}
                  </motion.div>
                )}
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                  Créer mon compte
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
