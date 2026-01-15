import { useProgress } from "@react-three/drei"
import { useEffect } from "react"
import { useIndexStore } from "../../store/indexSlice"

export function ModelLoader() {
  const setIsLoading = useIndexStore(select => select.setIsLoading);
  const { progress } = useProgress();
  
  useEffect(() => {
    setIsLoading(true);
  }, [setIsLoading]);
  
  useEffect(() => {
    if (parseFloat(progress.toFixed(0)) >= 100) {
      setIsLoading(false);
    }
  }, [progress, setIsLoading]);
  
  return null;
}