import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from './api';

// TanStack's online flag follows the device's connectivity, so mutations pause with no signal (§12 L).
onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((s) => setOnline(!!s.isConnected && s.isInternetReachable !== false)));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { networkMode: 'offlineFirst', gcTime: 7 * 24 * 60 * 60 * 1000, staleTime: 30_000, retry: 1 },
    mutations: { networkMode: 'online', retry: 3 },
  },
});

// Defaults keyed by mutationKey let a mutation that was paused when the app closed resume after restart.
queryClient.setMutationDefaults(['check'], { mutationFn: (v: { listId: string; ingredientId: string; checked: boolean }) => api.lists.check(v.listId, v.ingredientId, v.checked) });
queryClient.setMutationDefaults(['pantry'], { mutationFn: (v: { listId: string; ingredientId: string }) => api.lists.pantry(v.listId, v.ingredientId, true) });
queryClient.setMutationDefaults(['expiry'], { mutationFn: (v: { id: string; expiresOn: string | null }) => api.ingredients.setExpiry(v.id, v.expiresOn) });
queryClient.setMutationDefaults(['low'], { mutationFn: (v: { id: string; isLow: boolean }) => api.ingredients.setLow(v.id, v.isLow) });

export const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'home-kitchen-cache', throttleTime: 500 });
export const persistOptions = { persister, maxAge: 7 * 24 * 60 * 60 * 1000, buster: 'v1' };
