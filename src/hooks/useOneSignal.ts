import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  initOneSignal,
  requestNotificationPermission,
  isPushEnabled,
  setExternalUserId,
  removeExternalUserId,
  setUserTags,
} from '@/lib/onesignal';

export function useOneSignal() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Inicializar OneSignal
  useEffect(() => {
    const init = async () => {
      const success = await initOneSignal();
      setIsInitialized(success);
      
      if (success) {
        const enabled = await isPushEnabled();
        setPermissionGranted(enabled);
      }
    };
    
    init();
  }, []);

  // Vincular usuário ao OneSignal quando logar e solicitar permissão automaticamente
  useEffect(() => {
    if (!isInitialized) return;

    const syncUser = async () => {
      if (user?.id) {
        await setExternalUserId(user.id);
        // Adicionar tags úteis para segmentação
        await setUserTags({
          user_id: user.id,
          email: user.email || '',
        });
        
        // Solicitar permissão automaticamente se ainda não foi concedida
        const enabled = await isPushEnabled();
        if (!enabled) {
          // Pequeno delay para não ser intrusivo logo no login
          setTimeout(async () => {
            const granted = await requestNotificationPermission();
            setPermissionGranted(granted);
          }, 2000);
        }
      } else {
        await removeExternalUserId();
      }
    };

    syncUser();
  }, [user?.id, user?.email, isInitialized]);

  // Solicitar permissão de notificação
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  return {
    isInitialized,
    permissionGranted,
    requestPermission,
  };
}

export default useOneSignal;
