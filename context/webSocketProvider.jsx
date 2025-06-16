import React, { createContext, useContext, useEffect, useRef } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useFocusEffect } from "@react-navigation/native";
import apiConfig from "../services/apiConfig";

const WSContext = createContext(null);

export const WebSocketProvider = ({ gymId, children, url1, url2 }) => {
  const listeners = useRef(new Set());
  const wsRef = useRef(null);
  useFocusEffect(
    React.useCallback(() => {
      if (!gymId) return;

      const url = `wss://${
        apiConfig.API_URL?.split("//")[1]
      }/${url1}/ws/${url2}/${gymId}`;
      const ws = new ReconnectingWebSocket(url, [], {
        maxRetries: 999,
        reconnectInterval: 1500,
      });
      wsRef.current = ws;

      ws.addEventListener("message", (e) => {
        try {
          const payload = JSON.parse(e.data);
          listeners.current.forEach((fn) => fn(payload));
        } catch (err) {
          console.log(err);
        }
      });

      const ping = setInterval(() => {
        if (ws.readyState === ws.OPEN) ws.send("{}");
      }, 20000);

      return () => {
        clearInterval(ping);
        ws.close();
      };
    }, [gymId])
  );

  const add = (fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  };

  return <WSContext.Provider value={{ add }}>{children}</WSContext.Provider>;
};

export const useWS = () => {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error("WebSocketProvider missing");
  return ctx;
};
