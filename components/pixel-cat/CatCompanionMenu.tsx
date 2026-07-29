"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { MouseEvent } from "react";

export function CatCompanionMenu({
  isOpen,
  onClose,
  onSayHello,
  onPlayRunner,
  onPet,
  onHide,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSayHello: () => void;
  onPlayRunner: () => void;
  onPet: () => void;
  onHide: () => void;
}) {
  const runAction = (event: MouseEvent<HTMLButtonElement>, action: () => void) => {
    event.stopPropagation();
    action();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="pixel-cat-menu"
          role="group"
          aria-label="Cat companion shortcuts"
          initial={{ opacity: 0, y: 5, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
        >
          <span>CAT SHORTCUTS</span>
          <a href="/projects" onClick={onClose}>View projects</a>
          <button type="button" onClick={(event) => runAction(event, onSayHello)}>Say hello</button>
          <button type="button" onClick={(event) => runAction(event, onPlayRunner)}>Play runner</button>
          <button type="button" onClick={(event) => runAction(event, onPet)}>Give a pet</button>
          <button type="button" onClick={(event) => runAction(event, onHide)}>Hide cat</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
