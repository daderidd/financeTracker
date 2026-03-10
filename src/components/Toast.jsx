import React, { useEffect, useState } from 'react';

const Toast = ({ message, onUndo, duration = 5000, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md animate-[slideUp_0.2s_ease-out]">
      <span className="text-sm flex-1">{message}</span>
      {onUndo && (
        <button
          onClick={() => { onUndo(); setVisible(false); onDismiss?.(); }}
          className="px-2 py-1 bg-white text-gray-800 rounded text-xs font-medium hover:bg-gray-100 whitespace-nowrap"
        >
          Undo
        </button>
      )}
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="text-gray-400 hover:text-white text-xs"
      >
        x
      </button>
    </div>
  );
};

export default Toast;
