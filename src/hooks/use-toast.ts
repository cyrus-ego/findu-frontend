'use client';

import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
};

type ErrorDialog = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string }
  | { type: 'SHOW_ERROR_DIALOG'; dialog: ErrorDialog }
  | { type: 'HIDE_ERROR_DIALOG'; dialogId?: string };

interface State {
  toasts: ToasterToast[];
  errorDialog: ErrorDialog | null;
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };
    case 'DISMISS_TOAST': {
      if (action.toastId) {
        if (!toastTimeouts.has(action.toastId)) {
          toastTimeouts.set(
            action.toastId,
            setTimeout(() => {
              toastTimeouts.delete(action.toastId!);
              dispatch({ type: 'REMOVE_TOAST', toastId: action.toastId });
            }, TOAST_REMOVE_DELAY),
          );
        }
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t,
        ),
      };
    }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: action.toastId
          ? state.toasts.filter((t) => t.id !== action.toastId)
          : [],
      };
    case 'SHOW_ERROR_DIALOG':
      return { ...state, errorDialog: action.dialog };
    case 'HIDE_ERROR_DIALOG':
      if (action.dialogId && state.errorDialog?.id !== action.dialogId) {
        return state;
      }
      return { ...state, errorDialog: null };
  }
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [], errorDialog: null };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

type Toast = Omit<ToasterToast, 'id'>;

function toast(props: Toast) {
  const id = genId();

  if (props.variant === 'destructive') {
    const dismiss = () => dispatch({ type: 'HIDE_ERROR_DIALOG', dialogId: id });
    dispatch({
      type: 'SHOW_ERROR_DIALOG',
      dialog: {
        id,
        title: props.title || 'Có lỗi xảy ra',
        description: props.description,
      },
    });
    return { id, dismiss };
  }

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
  dispatch({ type: 'ADD_TOAST', toast: { ...props, id, open: true, onOpenChange: (o) => { if (!o) dismiss(); } } });
  return { id, dismiss };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { listeners.splice(listeners.indexOf(setState), 1); };
  }, []);
  return {
    ...state,
    toast,
    dismiss: (id?: string) => dispatch({ type: 'DISMISS_TOAST', toastId: id }),
    dismissError: (id?: string) => dispatch({ type: 'HIDE_ERROR_DIALOG', dialogId: id }),
  };
}

export { useToast, toast };
