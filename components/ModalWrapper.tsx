import React, { useEffect, useCallback, useRef } from 'react';
import { audioService } from '../services/audioService';

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** Set to true to prevent closing by clicking outside */
  preventOutsideClose?: boolean;
  /** Set to true to prevent closing by pressing ESC */
  preventEscClose?: boolean;
  /** z-index class, default is z-[70] */
  zIndex?: string;
}

/**
 * A reusable modal wrapper that handles:
 * - ESC key to close
 * - Click outside to close
 * - Backdrop with blur
 * - Proper focus management
 */
export function ModalWrapper({
  open,
  onClose,
  children,
  className = '',
  preventOutsideClose = false,
  preventEscClose = false,
  zIndex = 'z-[70]'
}: ModalWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !preventEscClose) {
      onClose();
    }
  }, [onClose, preventEscClose]);

  // Handle click outside
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!preventOutsideClose && e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose, preventOutsideClose]);

  useEffect(() => {
    if (!open) return;

    // Capture mount stack so we can trace which component opened this modal
    const mountStack = (new Error()).stack || '';

    if ((window as any).DEBUG_MODAL_SFX) console.debug('🧭 ModalWrapper mount', { ts: Date.now(), stack: mountStack });

    // NOTE: Disabled modal open SFX triggers to avoid spurious close/open sound spam
    // (previously audioService.notifyModalOpen was called here)

    // Add event listener for ESC
    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      if ((window as any).DEBUG_MODAL_SFX) console.debug('🧭 ModalWrapper unmount', { ts: Date.now(), stack: mountStack });
      // NOTE: Disabled modal close SFX triggers to avoid spurious close/open sound spam
      // (previously audioService.notifyModalClose was called here)
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      data-sfx="button_click"
      className={`fixed inset-0 ${zIndex} bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto ${className}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div ref={contentRef} onClick={(e) => e.stopPropagation()} className="max-h-[95vh] overflow-y-auto my-auto">
        {children}
      </div>
    </div>
  );
}

export default ModalWrapper;
