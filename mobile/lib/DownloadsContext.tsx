import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "./ToastContext";
import * as Network from "expo-network";

export interface DownloadedAudio {
  id: string;
  surahId: string;
  surahName: string;
  reciterId: string;
  reciterName: string;
  server: string;
  localUri: string;
  downloadDate: number;
}

interface DownloadsContextData {
  downloads: DownloadedAudio[];
  activeDownloads: Record<string, number>; // id -> progress (0 to 1)
  isDownloaded: (id: string) => boolean;
  downloadAudio: (
    item: Omit<DownloadedAudio, "id" | "localUri" | "downloadDate">,
  ) => Promise<void>;
  deleteAudio: (id: string) => Promise<void>;
  checkOnlineBeforeFetch: () => Promise<boolean>;
}

const DownloadsContext = createContext<DownloadsContextData | undefined>(
  undefined,
);

const DOWNLOADS_KEY = "@quranic_downloads";
const DOWNLOAD_DIR = (FileSystem.documentDirectory || "") + "quranic_audio/";

export const DownloadsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [downloads, setDownloads] = useState<DownloadedAudio[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<
    Record<string, number>
  >({});
  const { showToast } = useToast();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, {
          intermediates: true,
        });
      }

      const stored = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DownloadedAudio[];

        // Verify files still exist
        const validDownloads: DownloadedAudio[] = [];
        for (const item of parsed) {
          const fileInfo = await FileSystem.getInfoAsync(item.localUri);
          if (fileInfo.exists) {
            validDownloads.push(item);
          }
        }

        setDownloads(validDownloads);
        if (validDownloads.length !== parsed.length) {
          await AsyncStorage.setItem(
            DOWNLOADS_KEY,
            JSON.stringify(validDownloads),
          );
        }
      }
    } catch (e) {
      console.error("Failed to initialize downloads", e);
    }
  };

  const checkOnlineBeforeFetch = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      showToast("You are offline. Cannot fetch online data.", "offline");
      return false;
    }
    return true;
  };

  const isDownloaded = useCallback(
    (id: string) => {
      return downloads.some((d) => d.id === id);
    },
    [downloads],
  );

  const downloadAudio = async (
    item: Omit<DownloadedAudio, "id" | "localUri" | "downloadDate">,
  ) => {
    const isOnline = await checkOnlineBeforeFetch();
    if (!isOnline) return;

    const id = `${item.reciterId}-${item.surahId}`;
    if (isDownloaded(id)) {
      showToast("Already downloaded", "info");
      return;
    }

    if (activeDownloads[id] !== undefined) {
      showToast("Download in progress", "info");
      return;
    }

    const formattedSurahId = item.surahId.padStart(3, "0");
    const audioUrl = `${item.server}${formattedSurahId}.mp3`;
    const localUri = `${DOWNLOAD_DIR}${id}.mp3`;

    const downloadResumable = FileSystem.createDownloadResumable(
      audioUrl,
      localUri,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        setActiveDownloads((prev) => ({ ...prev, [id]: progress }));
      },
    );

    try {
      // Initialize progress
      setActiveDownloads((prev) => ({ ...prev, [id]: 0 }));

      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        const newDownload: DownloadedAudio = {
          ...item,
          id,
          localUri: result.uri,
          downloadDate: Date.now(),
        };

        const newDownloads = [newDownload, ...downloads];
        setDownloads(newDownloads);
        await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(newDownloads));
        showToast(`Downloaded ${item.surahName}`, "success");
      }
    } catch (e) {
      console.error("Download failed", e);
      showToast("Download failed", "error");
    } finally {
      setActiveDownloads((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const deleteAudio = async (id: string) => {
    const item = downloads.find((d) => d.id === id);
    if (!item) return;

    try {
      await FileSystem.deleteAsync(item.localUri, { idempotent: true });
      const newDownloads = downloads.filter((d) => d.id !== id);
      setDownloads(newDownloads);
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(newDownloads));
      showToast(`Deleted ${item.surahName}`, "info");
    } catch (e) {
      console.error("Delete failed", e);
      showToast("Failed to delete", "error");
    }
  };

  return (
    <DownloadsContext.Provider
      value={{
        downloads,
        activeDownloads,
        isDownloaded,
        downloadAudio,
        deleteAudio,
        checkOnlineBeforeFetch,
      }}
    >
      {children}
    </DownloadsContext.Provider>
  );
};

export const useDownloads = () => {
  const context = useContext(DownloadsContext);
  if (!context)
    throw new Error("useDownloads must be used within DownloadsProvider");
  return context;
};
