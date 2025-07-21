import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-4xl w-full relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <div className="overflow-x-auto max-w-full">{children}</div>
      </div>
    </div>
  );
};

export default Modal; 