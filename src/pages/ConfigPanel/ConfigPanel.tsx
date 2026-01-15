import { useEffect, useLayoutEffect, useState } from "react";
import { Configurator } from "../../components/Configurator";
import Sidebar from "../../components/Sidebar";
import { useBottomBarStore } from "../../store/bottomBarSlice";
import { useModelStore } from "../../store/modelSlice";
import Topbar from "../../components/Topbar";
import "./ConfigPanel.css";
import { CiRuler } from "react-icons/ci";
import { useConfiguratorStore } from "../../store/configuratorSlice";
import { useIndexStore } from "../../store/indexSlice";
import HandGuideAnimation from "../../components/HandGuideAnimation";

const ConfigPanel = () => {
  const toggleBtn = useConfiguratorStore((select) => select.toggleBtn);
  const setToggleBtn = useConfiguratorStore((select) => select.setToggleBtn);
  const [isMobile, setIsMobile] = useState(false);
  const selectedMesh = useBottomBarStore((select: any) => select.selectedMesh);
  const clickOutline = useModelStore((select: any) => select.clickOutline);
  const isDoubleClickedModel = useModelStore((select: any) => select.isDoubleClickedModel);
  const setIsClickRoom = useConfiguratorStore((select: any) => select.setIsClickRoom);
  const isClickRoom = useConfiguratorStore((select: any) => select.isClickRoom);
  const setSelectedLan = useIndexStore(select => select.setSelectedLan)
  const selectedLan = useIndexStore(select => select.selectedLan)
  const [showHandGuide, setShowHandGuide] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 680);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsMobile]);

  useEffect(() => {
    // Show animation every time after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setShowHandGuide(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleHandGuideComplete = () => {
    setShowHandGuide(false);
  };

  const onRightToggle = () => {
    setToggleBtn(!toggleBtn);
  };

  return (
    <>
      <div className={clickOutline.includes(true) ? "sidebarT active" : "sidebarT"} >
        <Topbar />
      </div>

      <div
        className={toggleBtn ? "toggleBtn active keybind" : "toggleBtn keybind"}
        onClick={onRightToggle}
      >
        <img src="/image/icon/cabinet.png" width={"100%"} />
      </div>

      <div className="left-sidebar-container">
        <Configurator />
      </div>
      {/* 
      <div className="transBtn" onClick={() => setSelectedLan(selectedLan === "English" ? "Arabic" : "English")}>
        <img src="/image/icon/translation.png" width={"100%"} />
      </div> */}

      <div className={toggleBtn ? "sidebarR active" : "sidebarR"}>
        <Sidebar />
      </div>

      {showHandGuide && (
        <HandGuideAnimation onComplete={handleHandGuideComplete} />
      )}

      {/* 
      {!isClickRoom && (<div className={" roomSizeBtn "} >
        <CiRuler
          size={40}
          onClick={() => setIsClickRoom(!isClickRoom)}
        />
      </div>)}
      */}
    </>
  );
};

export default ConfigPanel;
