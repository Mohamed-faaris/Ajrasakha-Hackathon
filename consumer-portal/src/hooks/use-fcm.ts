import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "./use-toast";
import { useNotificationSettings } from "./use-profile";

export type PermissionStatus = "default" | "granted" | "denied" | "unsupported";

export interface FCMMessage {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
  };
  data?: {
    type?: string;
    url?: string;
    [key: string]: string | undefined;
  };
}

export interface FCMTokenPayload {
  token: string;
  deviceInfo: {
    browser: string;
    os: string;
    userAgent: string;
  };
}

const isNotificationSupported = (): boolean => {
  return typeof window !== "undefined" && "Notification" in window;
};

const isPushSupported = (): boolean => {
  return typeof window !== "undefined" && "PushManager" in window;
};

const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    return "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    return "Firefox";
  } else if (userAgent.match(/safari/i)) {
    return "Safari";
  } else if (userAgent.match(/opr\//i)) {
    return "Opera";
  } else if (userAgent.match(/edg/i)) {
    return "Edge";
  }
  return "Unknown";
};

const getOSName = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.match(/windows nt/i)) {
    return "Windows";
  } else if (userAgent.match(/macintosh|mac os x/i)) {
    return "macOS";
  } else if (userAgent.match(/linux/i)) {
    return "Linux";
  } else if (userAgent.match(/android/i)) {
    return "Android";
  } else if (userAgent.match(/iphone|ipad|ipod/i)) {
    return "iOS";
  }
  return "Unknown";
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn("Notification API not supported");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

export async function registerFCMToken(fcmToken: string): Promise<void> {
  const deviceInfo = {
    browser: getBrowserName(),
    os: getOSName(),
    userAgent: navigator.userAgent,
  };

  try {
    await apiClient.request(
      "/alerts/fcm-token",
      import("zod").then(z => z.void()),
      undefined,
      {
        method: "POST",
        body: {
          token: fcmToken,
          deviceInfo,
        },
      }
    );
  } catch (error) {
    console.error("Failed to register FCM token:", error);
    throw error;
  }
}

export async function unregisterFCMToken(fcmToken: string): Promise<void> {
  try {
    await apiClient.request(
      "/alerts/fcm-token",
      import("zod").then(z => z.void()),
      { token: fcmToken },
      {
        method: "DELETE",
      }
    );
  } catch (error) {
    console.error("Failed to unregister FCM token:", error);
    throw error;
  }
}

export interface UseFCMReturn {
  registerFCM: (token: string) => Promise<void>;
  unregisterFCM: (token: string) => Promise<void>;
  isSupported: boolean;
  permissionStatus: PermissionStatus;
  isRegistering: boolean;
  requestPermission: () => Promise<boolean>;
  fcmToken: string | null;
  setFcmToken: (token: string | null) => void;
}

export function useFCM(autoRequest = false): UseFCMReturn {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("default");
  const [isRegistering, setIsRegistering] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const { data: notificationSettings } = useNotificationSettings();
  const isMounted = useRef(true);

  const isSupported = isNotificationSupported() && isPushSupported();

  useEffect(() => {
    if (!isSupported) {
      setPermissionStatus("unsupported");
      return;
    }

    setPermissionStatus(Notification.permission as PermissionStatus);
  }, [isSupported]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (autoRequest && isSupported && notificationSettings?.push.enabled) {
      if (Notification.permission === "default") {
        requestNotificationPermission().then((granted) => {
          if (granted && isMounted.current) {
            setPermissionStatus("granted");
          }
        });
      }
    }
  }, [autoRequest, isSupported, notificationSettings?.push.enabled]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    const granted = await requestNotificationPermission();
    if (granted) {
      setPermissionStatus("granted");
    } else {
      setPermissionStatus(Notification.permission as PermissionStatus);
    }
    return granted;
  }, [isSupported]);

  const registerFCM = useCallback(async (token: string): Promise<void> => {
    if (!isSupported) {
      throw new Error("Push notifications not supported");
    }

    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        throw new Error("Notification permission not granted");
      }
    }

    setIsRegistering(true);
    try {
      await registerFCMToken(token);
      if (isMounted.current) {
        setFcmToken(token);
      }
    } finally {
      if (isMounted.current) {
        setIsRegistering(false);
      }
    }
  }, [isSupported, permissionStatus, requestPermission]);

  const unregisterFCM = useCallback(async (token: string): Promise<void> => {
    try {
      await unregisterFCMToken(token);
      if (isMounted.current && fcmToken === token) {
        setFcmToken(null);
      }
    } catch (error) {
      console.error("Failed to unregister FCM:", error);
      throw error;
    }
  }, [fcmToken]);

  return {
    registerFCM,
    unregisterFCM,
    isSupported,
    permissionStatus,
    isRegistering,
    requestPermission,
    fcmToken,
    setFcmToken,
  };
}

export interface OnMessageCallbacks {
  onNotification?: (message: FCMMessage) => void;
  onClick?: (data: FCMMessage["data"]) => void;
}

export function onMessageListener(
  messaging: unknown,
  callbacks?: OnMessageCallbacks
): () => void {
  if (!messaging || typeof window === "undefined") {
    return () => {};
  }

  let unsubscribe = () => {};

  const setupListener = async () => {
    try {
      const { onMessage } = await import("firebase/messaging");
      
      if (typeof onMessage !== "function") {
        console.warn("onMessage is not available from Firebase");
        return;
      }

      unsubscribe = onMessage(messaging, (payload: FCMMessage) => {
        const { notification, data } = payload;

        if (callbacks?.onNotification) {
          callbacks.onNotification(payload);
        } else {
          toast({
            title: notification?.title || "New Notification",
            description: notification?.body || "",
            duration: 5000,
          });
        }

        if (Notification.permission === "granted") {
          const notif = new Notification(notification?.title || "New Notification", {
            body: notification?.body || "",
            icon: notification?.image || "/favicon.ico",
            data: data || {},
          });

          notif.onclick = () => {
            window.focus();
            notif.close();

            if (callbacks?.onClick && data) {
              callbacks.onClick(data);
            } else if (data?.url) {
              window.location.href = data.url;
            }
          };
        }
      });
    } catch (error) {
      console.error("Failed to set up FCM message listener:", error);
    }
  };

  setupListener();

  return () => {
    unsubscribe();
  };
}

export function useFCMMessageListener(
  messaging: unknown | null,
  callbacks?: OnMessageCallbacks
): void {
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessageListener(messaging, callbacks);
    return unsubscribe;
  }, [messaging, callbacks]);
}

export function getFCMToken(
  messaging: unknown,
  vapidKey?: string
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!messaging) {
      reject(new Error("Firebase messaging not initialized"));
      return;
    }

    const getToken = async () => {
      try {
        const { getToken: firebaseGetToken } = await import("firebase/messaging");
        
        if (typeof firebaseGetToken !== "function") {
          reject(new Error("getToken is not available from Firebase"));
          return;
        }

        const token = await firebaseGetToken(messaging, { vapidKey });
        resolve(token || null);
      } catch (error) {
        reject(error);
      }
    };

    getToken();
  });
}

export function deleteFCMToken(messaging: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!messaging) {
      reject(new Error("Firebase messaging not initialized"));
      return;
    }

    const deleteToken = async () => {
      try {
        const { deleteToken: firebaseDeleteToken } = await import("firebase/messaging");
        
        if (typeof firebaseDeleteToken !== "function") {
          reject(new Error("deleteToken is not available from Firebase"));
          return;
        }

        await firebaseDeleteToken(messaging);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    deleteToken();
  });
}
