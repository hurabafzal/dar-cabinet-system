import { create } from 'zustand';

interface ScreenshotStore {
  captureScreenshots: (() => Promise<any>) | null;
  setCaptureFunction: (fn: () => Promise<any>) => void;
}

export const useScreenshotStore = create<ScreenshotStore>((set) => ({
  captureScreenshots: null,
  setCaptureFunction: (fn) => set({ captureScreenshots: fn }),
}));