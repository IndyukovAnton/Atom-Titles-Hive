import { useState, useCallback, useEffect, useRef } from 'react';
import type { MediaFile } from './types';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 0.5;

interface UsePhotoViewerControlsOptions {
  files: MediaFile[];
  currentIndex: number | null;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function usePhotoViewerControls({
  files,
  currentIndex,
  onClose,
  onIndexChange,
}: UsePhotoViewerControlsOptions) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const currentFile = currentIndex !== null ? files[currentIndex] : null;
  const isOpen = currentIndex !== null;

  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Wheel must use a native non-passive listener: React attaches onWheel as
  // passive, which makes e.preventDefault() a no-op and spams a browser warning.
  useEffect(() => {
    if (!isOpen) return;
    const node = containerRef.current;
    if (!node) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [isOpen, handleZoomIn, handleZoomOut]);

  const goToPrev = useCallback(() => {
    if (currentIndex === null || currentIndex <= 0) return;
    setDirection(-1);
    onIndexChange?.(currentIndex - 1);
  }, [currentIndex, onIndexChange]);

  const goToNext = useCallback(() => {
    if (currentIndex === null || currentIndex >= files.length - 1) return;
    setDirection(1);
    onIndexChange?.(currentIndex + 1);
  }, [currentIndex, files.length, onIndexChange]);

  const goToIndex = useCallback(
    (index: number) => {
      setDirection(index > (currentIndex ?? 0) ? 1 : -1);
      onIndexChange?.(index);
    },
    [currentIndex, onIndexChange],
  );

  const handleDownload = useCallback(() => {
    if (!currentFile) return;
    const link = document.createElement('a');
    link.href = currentFile.url;
    link.download = `media-${currentFile.id}.${currentFile.type === 'video' ? 'mp4' : 'jpg'}`;
    link.click();
  }, [currentFile]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    onClose,
    goToPrev,
    goToNext,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [zoom, position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || zoom <= 1) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    },
    [isDragging, zoom],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  return {
    zoom,
    position,
    isDragging,
    direction,
    containerRef,
    currentFile,
    isOpen,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    goToPrev,
    goToNext,
    goToIndex,
    handleDownload,
    handleClose,
    handleBackdropClick,
  };
}
