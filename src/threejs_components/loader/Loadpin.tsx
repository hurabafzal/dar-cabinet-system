import { useIndexStore } from "../../store/indexSlice"
import "./style.css"
export function Loadpin() {
  const isLoading = useIndexStore(select => select.isLoading);
  return (
    <>
      {/* {isLoading && (
        <div className="gifContainer">
          <img src="/gif/34-PM-unscreen-1736858072306.gif" style={{ width: "250px" }} />
        </div>
      )}
        */}
    </>
  )
}