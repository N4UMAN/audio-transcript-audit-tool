import React from 'react'


interface ToastProps {
    toast: ToastData;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
    return (
        <div
            className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 
        bg-gray-900 text-white text-[10px] px-4 py-2 
        rounded-full shadow-lg flex items-center gap-2 z-50
        transition-opacity duration-300
        ${toast.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
        >
            <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-green-400"
            >
                <polyline points="20 6 9 17 4 12" />
            </svg>
            {toast.message}
        </div>
    );
};

export default Toast
