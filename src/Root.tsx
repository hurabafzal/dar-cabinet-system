import React, { Suspense, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ConfigPanel from "./pages/ConfigPanel/ConfigPanel";
import Scene from "./threejs_components";
import { Canvas } from "@react-three/fiber";
import IntroPopup from "./components/IntroPopup";
import { Environment, Preload, useGLTF, useProgress, useTexture } from "@react-three/drei";
import { EffectComposer, N8AO, Outline, Selection, TiltShift2, ToneMapping } from "@react-three/postprocessing";

import { Loadpin } from "./threejs_components/loader/Loadpin";
import { useIndexStore } from "./store/indexSlice";
import ChatBot from "react-chatbotify";
import LanguageSelection from "./pages/ConfigPanel/LanguageSelection";
import Tour from "./pages/ConfigPanel/Joyride";
import { Loader } from "./threejs_components/loader/Loader";
import { isIOS, isSafari } from 'react-device-detect';

function Root({ isInitialLoading }: any) {
  const [isSelectedLan, setIsSelectedLan] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const CABINET_ITEMS = useIndexStore((select: any) => select.CABINET_ITEMS);
  
  // Check for saved language on component mount
  useEffect(() => {
    // Important: Only check the dar-language-selected flag
    // Don't check for 'dar-language' directly as it can have a default value
    const hasSelectedLanguage = localStorage.getItem('dar-language-selected');
    
    if (hasSelectedLanguage === 'true') {
      console.log('Root: User has previously selected a language');
      setIsSelectedLan(true);
    } else {
      // First time loading the app - force showing the language selection modal
      console.log('Root: First app load, showing language selection modal');
      setIsSelectedLan(false);
      
      // Clear any potentially incomplete language state to ensure modal shows
      localStorage.removeItem('dar-language');
      localStorage.removeItem('dar-language-selected');
      
      // Reset the language in the store too
      const setSelectedLan = useIndexStore.getState().setSelectedLan;
      setSelectedLan('');
    }
  }, []);
  
  // Show intro after language selection
  useEffect(() => {
    if (isSelectedLan) {
      const seen = localStorage.getItem('dar-intro-shown');
      if (!seen) {
        setTimeout(() => setShowIntro(true), 500);
      }
    }
  }, [isSelectedLan]);

  const settings = {
    header: {
      title: "Welcome to the DAR System"
    },
    footer: {
      text: "powered by DAR design system"
    },
    tooltip: {
      mode: "hi",
      text: "Come here for a clue!😊"
    },
    chatButton: {
      icon: "/image/icon/whatsapp.png"
    },
    botBubble: { simulateStream: true }
  };

  const styles = {
    chatButtonStyle: {
      background: "#ffffff00",
      boxShadow: "none",
      width: "50px",
      height: "50px"
    },
    chatIconStyle: {
      width: "50px",
      height: "50px"
    }
  };

  const handleIntroClose = () => {
    localStorage.setItem('dar-intro-shown', 'true');
    setShowIntro(false);
  };

  const [form, setForm]: any = useState({});
  const formStyle = {
    marginTop: 10,
    marginLeft: 20,
    border: "1px solid #491d8d",
    padding: 10,
    borderRadius: 5,
    maxWidth: 300
  }

  const flow = {
    start: {
      message: "Hello there! What is your name?",
      function: (params: any) => setForm({ ...form, name: params.userInput }),
      path: "ask_age"
    },
    ask_age: {
      message: (params: any) => `Nice to meet you ${params.userInput}, what is your age?`,
      function: (params: any) => setForm({ ...form, age: params.userInput }),
      path: async (params: any) => {
        if (isNaN(Number(params.userInput))) {
          await params.injectMessage("Age needs to be a number!");
          return;
        }
        return "ask_pet";
      }
    },
    ask_pet: {
      message: "Do you own any pets?",
      options: ["Yes", "No"],
      chatDisabled: true,
      function: (params: any) => setForm({ ...form, pet_ownership: params.userInput }),
      path: "ask_choice"
    },
    ask_choice: {
      message: "Select at least 2 and at most 4 pets that you are comfortable to work with:",
      checkboxes: { items: ["Dog", "Cat", "Rabbit", "Hamster", "Bird"], min: 2, max: 4 },
      chatDisabled: true,
      function: (params: any) => setForm({ ...form, pet_choices: params.userInput }),
      path: "ask_work_days"
    },
    ask_work_days: {
      message: "How many days can you work per week?",
      function: (params: any) => setForm({ ...form, num_work_days: params.userInput }),
      path: async (params: any) => {
        if (isNaN(Number(params.userInput))) {
          await params.injectMessage("Number of work day(s) need to be a number!");
          return;
        }
        return "end";
      }
    },
    end: {
      message: "Thank you for your interest, we will get back to you shortly!",
      component: (
        <div style={formStyle}>
          <p>Name: {form.name}</p>
          <p>Age: {form.age}</p>
          <p>Pet Ownership: {form.pet_ownership}</p>
          <p>Pet Choices: {form.pet_choices}</p>
          <p>Num Work Days: {form.num_work_days}</p>
        </div>
      ),
      options: ["New Application"],
      chatDisabled: true,
      path: "start"
    },
  }

  const themes = [
    { id: "tranquil_teal", version: "0.1.0" }
  ]

  return (
    <>
      <Loader isInitialLoading={isInitialLoading} />
      {CABINET_ITEMS?.length > 0 && (
        <>
          <Loadpin />
          <LanguageSelection isSelectedLan={isSelectedLan} setIsSelectedLan={setIsSelectedLan} />
          
          <Tour isSelectedLan={isSelectedLan} setIsSelectedLan={setIsSelectedLan} />
          <ConfigPanel />
          {/*
          <div className="chatbot" style={{ position: "absolute", right: "0%", bottom: "0%" }}>
            <ChatBot flow={flow} themes={themes} settings={settings} styles={styles} />
          </div>
          */}
          <Canvas
            flat
            dpr={[1, isIOS ? 1 : 1.5]}
            gl={{
              powerPreference: 'high-performance',
              alpha: true,
              antialias: true,
              preserveDrawingBuffer: false,
              premultipliedAlpha: false,
            }}
            onCreated={({ gl }) => {
              gl.setClearColor('#ffffff', 0);
            }}
          >
            <Selection>
              <Scene />
            </Selection>
          </Canvas>
        </>
      )}
    </>
  );
}

export default Root;