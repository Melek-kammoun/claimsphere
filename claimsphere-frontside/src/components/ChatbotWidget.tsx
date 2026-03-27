import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
}

const initialMessages: Message[] = [
  { id: 1, text: "Bonjour ! Je suis l'assistant ClaimSphere. Comment puis-je vous aider ?", sender: "bot", time: "Maintenant" },
];

const botReplies: Record<string, string> = {
  sinistre: "Pour déclarer un sinistre, rendez-vous dans la section 'Sinistres' de votre tableau de bord et cliquez sur 'Déclarer un sinistre'. Vous pouvez aussi me donner les détails ici.",
  contrat: "Vous pouvez consulter vos contrats dans la section 'Mes contrats'. Souhaitez-vous souscrire à une nouvelle offre ?",
  paiement: "Vos paiements sont disponibles dans la section 'Paiements'. Votre prochaine échéance est dans 5 jours.",
  default: "Je comprends votre demande. Un conseiller va être notifié pour vous assister. En attendant, n'hésitez pas à parcourir votre tableau de bord.",
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), text: input, sender: "user", time: "Maintenant" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const lower = input.toLowerCase();
      const key = Object.keys(botReplies).find((k) => k !== "default" && lower.includes(k)) || "default";
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: botReplies[key], sender: "bot", time: "Maintenant" },
      ]);
    }, 800);
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-elevated border flex flex-col overflow-hidden"
            style={{ height: "480px" }}
          >
            {/* Header */}
            <div className="bg-gradient-primary text-primary-foreground p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-semibold text-sm">Assistant ClaimSphere</div>
                <div className="text-xs opacity-80">En ligne</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tapez votre message..."
                className="flex-1 text-sm"
              />
              <Button size="icon" onClick={handleSend} className="bg-gradient-primary text-primary-foreground hover:opacity-90 flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
