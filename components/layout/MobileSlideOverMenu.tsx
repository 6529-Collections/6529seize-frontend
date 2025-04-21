import React from "react";

interface MobileSlideOverMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSlideOverMenu = ({ isOpen, onClose }: MobileSlideOverMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="slide-over-menu-container">
      <div className="slide-over-backdrop" onClick={onClose}></div>
      
      <div className="slide-over-menu">
        Slide Over Menu
      </div>
      
      <style jsx>{`
        .slide-over-menu-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2000;
          display: flex;
        }
        
        .slide-over-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 2001;
        }
        
        .slide-over-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 80%;
          max-width: 320px;
          height: 100%;
          background-color: #1F1F1F;
          z-index: 2002;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default MobileSlideOverMenu;