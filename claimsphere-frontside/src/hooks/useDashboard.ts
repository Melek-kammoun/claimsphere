import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";

interface User {
  full_name?: string;
  ongoingClaims?: number;
  nextDueIn?: number | null;
  totalPaid?: number;
}

interface Contract {
  id: string;
  vehicle: string;
  type: string;
  status: string;
  expiry: string;
  premium: string;
}

interface Notification {
  text: string;
  type: "warning" | "info" | "success";
  time: string;
}

interface Stats {
  activeContracts: number;
  ongoingClaims: number;
  nextDueIn: number | null;
  totalPaid: number;
}

export function useDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({ activeContracts: 0, ongoingClaims: 0, nextDueIn: null, totalPaid: 0 });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userData, contractsData, notificationsData] = await Promise.all([
          apiRequest<User>("/users/me"),
          apiRequest<unknown>("/contracts?limit=2"),
          apiRequest<unknown>("/notifications?limit=3"),
        ]);

        setUser(userData);
        setContracts(Array.isArray(contractsData) ? (contractsData as Contract[]) : []);
        setNotifications(Array.isArray(notificationsData) ? (notificationsData as Notification[]) : []);
        setStats({
          activeContracts: Array.isArray(contractsData)
            ? (contractsData as Contract[]).filter((c) => c.status === "Actif").length
            : 0,
          ongoingClaims: userData.ongoingClaims ?? 0,
          nextDueIn: userData.nextDueIn ?? null,
          totalPaid: userData.totalPaid ?? 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return { user, stats, contracts, notifications, loading };
}