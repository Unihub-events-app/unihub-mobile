import { create } from "zustand";
import { getSecureToken, removeSecureToken, secureKeys, setSecureToken } from "./storage";

export const useSessionStore = create((set, get) => ({
  hydrated: false,
  userToken: null,
  adminToken: null,
  setUserToken: async (token) => {
    await setSecureToken(secureKeys.userToken, token);
    set({ userToken: token || null });
  },
  setAdminToken: async (token) => {
    await setSecureToken(secureKeys.adminToken, token);
    set({ adminToken: token || null });
  },
  clearSession: async () => {
    await Promise.all([
      removeSecureToken(secureKeys.userToken),
      removeSecureToken(secureKeys.adminToken)
    ]);
    set({ userToken: null, adminToken: null });
  },
  hydrateSession: async () => {
    const [userToken, adminToken] = await Promise.all([
      getSecureToken(secureKeys.userToken),
      getSecureToken(secureKeys.adminToken)
    ]);
    set({ userToken, adminToken, hydrated: true });
  }
}));

export async function getUserToken() {
  return useSessionStore.getState().userToken || getSecureToken(secureKeys.userToken);
}

export async function getAdminToken() {
  return useSessionStore.getState().adminToken || getSecureToken(secureKeys.adminToken);
}
