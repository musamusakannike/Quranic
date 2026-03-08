import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BookmarkItem {
  id: string; // Format: "chapter-verse"
  chapter: number;
  verse: number;
  createdAt: number;
}

interface BookmarksContextValue {
  bookmarks: BookmarkItem[];
  isLoaded: boolean;
  addBookmark: (chapter: number, verse: number) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  isBookmarked: (id: string) => boolean;
}

const BookmarksContext = createContext<BookmarksContextValue | undefined>(
  undefined,
);

const BOOKMARKS_STORAGE_KEY = "@quranic_bookmarks";

export const BookmarksProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const stored = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (stored) {
          setBookmarks(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load bookmarks", error);
      } finally {
        setIsLoaded(true);
      }
    };
    void loadBookmarks();
  }, []);

  const saveBookmarks = async (newBookmarks: BookmarkItem[]) => {
    try {
      await AsyncStorage.setItem(
        BOOKMARKS_STORAGE_KEY,
        JSON.stringify(newBookmarks),
      );
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error("Failed to save bookmarks", error);
    }
  };

  const addBookmark = async (chapter: number, verse: number) => {
    const id = `${chapter}-${verse}`;
    const newBookmark: BookmarkItem = {
      id,
      chapter,
      verse,
      createdAt: Date.now(),
    };

    // Check if already exists to prevent duplicates
    if (bookmarks.some((b) => b.id === id)) return;

    const newBookmarks = [newBookmark, ...bookmarks];
    await saveBookmarks(newBookmarks);
  };

  const removeBookmark = async (id: string) => {
    const newBookmarks = bookmarks.filter((b) => b.id !== id);
    await saveBookmarks(newBookmarks);
  };

  const isBookmarked = (id: string) => {
    return bookmarks.some((b) => b.id === id);
  };

  return (
    <BookmarksContext.Provider
      value={{ bookmarks, isLoaded, addBookmark, removeBookmark, isBookmarked }}
    >
      {children}
    </BookmarksContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarksProvider");
  }
  return context;
};
