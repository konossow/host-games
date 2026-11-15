import React, { createContext, useContext } from "react";
import { Modal, Input } from "antd";
import useModal from "antd/es/modal/useModal";

type PromptFunction = () => Promise<string | null>;

const PromptContext = createContext<PromptFunction>(() => Promise.resolve(null));

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, contextHolder] = useModal();

  const prompt: PromptFunction = () => {
    let password = "";

    return new Promise<string | null>((resolve) => {
      const instance = modal.confirm({
        title: "Podaj hasło",
        content: (
          <Input.Password
            autoFocus
            onChange={(e) => {
              password = e.target.value;
            }}
            onPressEnter={(e) => {
              e.stopPropagation();
              e.preventDefault();
              instance.destroy();
              resolve(password);
            }}
          />
        ),
        okText: "Zaloguj",
        icon: null,
        onOk: () => resolve(password)
      });
    });
  };

  return (
    <PromptContext.Provider value={prompt}>
      {contextHolder}
      {children}
    </PromptContext.Provider>
  );
};

export const usePrompt = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error("usePrompt must be used within a PromptProvider");
  }
  return context;
};
