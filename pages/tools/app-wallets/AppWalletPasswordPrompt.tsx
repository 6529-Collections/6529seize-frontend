import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

interface UsePromptResult {
  showPrompt: (message: string) => Promise<string | null>;
  PromptModal: JSX.Element;
}

export function usePrompt(): UsePromptResult {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [resolver, setResolver] = useState<
    ((val: string | null) => void) | null
  >(null);

  const showPrompt = (msg: string) => {
    return new Promise<string | null>((resolve) => {
      setMessage(msg);
      setInputValue("");
      setIsOpen(true);
      setResolver(() => resolve);
    });
  };

  function handleConfirm() {
    if (resolver) resolver(inputValue);
    setIsOpen(false);
  }
  function handleCancel() {
    if (resolver) resolver(null);
    setIsOpen(false);
  }

  const PromptModal = (
    <Modal show={isOpen} onHide={handleCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Password Prompt</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{message}</p>
        <Form.Control
          type="password"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return { showPrompt, PromptModal };
}
