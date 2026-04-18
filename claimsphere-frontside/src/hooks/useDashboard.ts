import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

interface DashboardData {
  user: User | null;
  stats: {
    activeContracts: number;
    ongoingClaims: number;
    nextDueIn: number | null;
    totalPaid: number;
  };
  contracts: any[];
  notifications: any[];
  loading: boolean;
}

export function useDashboard(): DashboardData {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    activeContracts: 0,
    ongoingClaims: 0,
    nextDueIn: null,
    totalPaid: 0,
  });
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch current user
        console.log('🔍 [useDashboard] Fetching current user from /users/me...');
        try {
          const userResponse = await apiRequest('/users/me');
          console.log('✅ [useDashboard] User response:', userResponse);
          
          if (userResponse?.user) {
            setUser(userResponse.user);
            console.log('✅ [useDashboard] User set:', userResponse.user);
          } else if (userResponse?.data?.user) {
            setUser(userResponse.data.user);
            console.log('✅ [useDashboard] User set from data:', userResponse.data.user);
          } else {
            console.warn('⚠️ [useDashboard] No user data in response:', userResponse);
          }
        } catch (userError) {
          console.error('❌ [useDashboard] Error fetching user:', userError);
        }

        // Fetch contracts
        console.log('🔍 [useDashboard] Fetching contracts...');
        try {
          const contractsData = await apiRequest('/api/contrats/client/me');
          console.log('✅ [useDashboard] Contracts response:', contractsData);
          
          if (Array.isArray(contractsData)) {
            setContracts(contractsData);
          } else if (Array.isArray(contractsData?.data)) {
            setContracts(contractsData.data);
          } else {
            setContracts([]);
          }
        } catch (contractError) {
          console.error('❌ [useDashboard] Error fetching contracts:', contractError);
          setContracts([]);
        }

        // Fetch notifications
        console.log('🔍 [useDashboard] Fetching notifications...');
        try {
          const notificationsData = await apiRequest('/notifications');
          console.log('✅ [useDashboard] Notifications response:', notificationsData);
          
          if (Array.isArray(notificationsData)) {
            setNotifications(notificationsData);
          } else if (Array.isArray(notificationsData?.data)) {
            setNotifications(notificationsData.data);
          } else {
            setNotifications([]);
          }
        } catch (notifError) {
          console.error('❌ [useDashboard] Error fetching notifications:', notifError);
          setNotifications([]);
        }

        // Calculate stats
        console.log('🔍 [useDashboard] Calculating stats...');
        const activeContracts = contracts.length;
        setStats({
          activeContracts,
          ongoingClaims: 0,
          nextDueIn: null,
          totalPaid: 0,
        });
        console.log('✅ [useDashboard] Stats calculated:', { activeContracts });
      } catch (error) {
        console.error('❌ [useDashboard] Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
        console.log('✅ [useDashboard] Loading complete');
      }
    };

    fetchDashboardData();
  }, []);

  return {
    user,
    stats,
    contracts,
    notifications,
    loading,
  };
}