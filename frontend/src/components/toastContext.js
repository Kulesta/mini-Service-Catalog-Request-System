import { createContext, useContext } from 'react';

const ToastContext = createContext(null);

export const ToastCtx = ToastContext;

export function useToast() {
    return useContext(ToastContext);
}
