import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = '0a15835d-f878-4822-a477-761bbf8e10ea';

let initialized = false;

export async function initOneSignal(): Promise<boolean> {
  if (initialized) return true;
  
  try {
    if (typeof window === 'undefined') return false;

    // Verificar se Service Workers são suportados
    if (!('serviceWorker' in navigator)) {
      console.warn('OneSignal: Service Workers não suportados neste navegador');
      return false;
    }

    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, // Para desenvolvimento
      autoPrompt: false, // Não mostrar prompt automático
      // Usar path padrão na raiz - o OneSignal gerencia o scope internamente
      serviceWorkerPath: '/OneSignalSDKWorker.js',
    });
    
    initialized = true;
    console.log('OneSignal: Inicializado com sucesso');
    return true;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('Can only be used on')) {
      console.warn('OneSignal: Domínio não autorizado para este App ID (esperado em localhost)');
    } else {
      console.error('OneSignal: Erro ao inicializar:', error);
    }
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!initialized) return false;
  try {
    const permission = await OneSignal.Notifications.requestPermission();
    return permission;
  } catch (error) {
    console.error('OneSignal: Erro ao solicitar permissão:', error);
    return false;
  }
}

export async function isPushEnabled(): Promise<boolean> {
  if (!initialized) return false;
  try {
    return await OneSignal.Notifications.permission;
  } catch {
    return false;
  }
}

export async function setExternalUserId(userId: string) {
  if (!initialized) return;
  try {
    // Verificar se já está logado com este ID para evitar erro 409
    const currentId = OneSignal.User?.externalId;
    if (currentId === userId) {
      console.log('OneSignal: External User ID já definido:', userId);
      return;
    }
    await OneSignal.login(userId);
    console.log('OneSignal: External User ID definido:', userId);
  } catch (error: any) {
    // Ignorar erro 409 (conflito) - usuário já vinculado
    if (error?.message?.includes('409') || error?.status === 409) {
      console.log('OneSignal: Usuário já vinculado');
      return;
    }
    console.error('OneSignal: Erro ao definir External User ID:', error);
  }
}

export async function removeExternalUserId() {
  if (!initialized) return;
  try {
    // Verificar se o método logout existe antes de chamar
    if (typeof OneSignal.logout === 'function') {
      await OneSignal.logout();
    }
  } catch (error) {
    console.error('OneSignal: Erro ao remover External User ID:', error);
  }
}

export async function setUserTags(tags: Record<string, string>) {
  if (!initialized) return;
  try {
    if (OneSignal.User?.addTags) {
      await OneSignal.User.addTags(tags);
    }
  } catch (error) {
    console.error('OneSignal: Erro ao definir tags:', error);
  }
}

export { OneSignal };
