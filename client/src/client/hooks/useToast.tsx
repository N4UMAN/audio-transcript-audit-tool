import { useState, useCallback } from "react";

interface useToastReturn {
    toast: ToastData;
    showToast: (message: string, duration?: number) => void;
    hideToast: () => void;
}

export function useToast(defaultDuration: number = 3000): useToastReturn {

    const [toast, setToast] = useState<ToastData>({
        show: false,
        message: ''
    });

    const showToast = useCallback((message: string, duration?: number) => {
        setToast({
            show: true,
            message: message
        });

        //Autohide toast after 'X' duration
        setTimeout(() => {
            setToast({
                show: false,
                message: ''
            });
        }, duration ?? defaultDuration);
    }, [defaultDuration]);

    //This is to manually hide toast
    const hideToast = useCallback((): void => {
        setToast({ show: false, message: '' });
    }, []);
    return {
        toast,
        showToast,
        hideToast
    }
}

