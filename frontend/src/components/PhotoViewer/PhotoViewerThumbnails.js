import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export function PhotoViewerThumbnails({ files, currentIndex, onSelect, }) {
    if (files.length <= 1)
        return null;
    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, className: "absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl", children: _jsx("div", { className: "flex items-center gap-2", children: files.map((file, index) => (_jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => onSelect(index), className: `
              shrink-0 w-14 h-14 rounded-xl overflow-hidden
              transition-all duration-200
              ${index === currentIndex
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/20'
                    : 'opacity-50 hover:opacity-100 ring-1 ring-border/50'}
            `, children: file.type === 'video' ? (_jsx("video", { src: file.url, className: "w-full h-full object-cover", muted: true })) : (_jsx("img", { src: file.url, alt: "", className: "w-full h-full object-cover" })) }, file.id))) }) }));
}
