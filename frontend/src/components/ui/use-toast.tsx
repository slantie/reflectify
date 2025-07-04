import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactElement;
    variant?: "default" | "destructive";
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

let count = 0;

function genId() {
    count = (count + 1) % Number.MAX_VALUE;
    return count.toString();
}

type Action =
    | {
          type: "ADD_TOAST";
          toast: ToasterToast;
      }
    | {
          type: "UPDATE_TOAST";
          toast: Partial<ToasterToast>;
      }
    | {
          type: "DISMISS_TOAST";
          toastId?: ToasterToast["id"];
      }
    | {
          type: "REMOVE_TOAST";
          toastId?: ToasterToast["id"];
      };

interface State {
    toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) {
        return;
    }

    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId,
        });
    }, TOAST_REMOVE_DELAY);

    toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            };

        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t
                ),
            };

        case "DISMISS_TOAST": {
            const { toastId } = action;

            if (toastId) {
                addToRemoveQueue(toastId);
            } else {
                state.toasts.forEach((toast) => {
                    addToRemoveQueue(toast.id);
                });
            }

            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === toastId || toastId === undefined
                        ? {
                              ...t,
                              open: false,
                          }
                        : t
                ),
            };
        }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: [],
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.toastId),
            };
    }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener) => {
        listener(memoryState);
    });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
    const id = genId();

    const update = (props: ToasterToast) =>
        dispatch({
            type: "UPDATE_TOAST",
            toast: { ...props, id },
        });
    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open) dismiss();
            },
        },
    });

    return {
        id: id,
        dismiss,
        update,
    };
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [state]);

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) =>
            dispatch({ type: "DISMISS_TOAST", toastId }),
    };
}

// Toast component
const Toast = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: "default" | "destructive";
    }
>(({ className, variant = "default", ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
                variant === "default" &&
                    "border-secondary-lighter bg-white text-secondary-darker",
                variant === "destructive" &&
                    "border-negative-main bg-negative-lighter text-negative-darker",
                className
            )}
            {...props}
        />
    );
});
Toast.displayName = "Toast";

const ToastAction = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
    <button
        ref={ref}
        className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-secondary-lighter focus:outline-none focus:ring-2 focus:ring-secondary-darker focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            className
        )}
        {...props}
    />
));
ToastAction.displayName = "ToastAction";

const ToastClose = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<"button">
>(({ className, ...props }, ref) => (
    <button
        ref={ref}
        className={cn(
            "absolute right-2 top-2 rounded-md p-1 text-secondary-darker/50 opacity-0 transition-opacity hover:text-secondary-darker focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
            className
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" />
    </button>
));
ToastClose.displayName = "ToastClose";

const ToastTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm font-semibold", className)}
        {...props}
    />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
ToastDescription.displayName = "ToastDescription";

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

// Toaster component to render toasts
function Toaster() {
    const { toasts } = useToast();

    return (
        <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
            {toasts.map(function ({
                id,
                title,
                description,
                action,
                ...props
            }) {
                return (
                    <Toast key={id} {...props}>
                        <div className="grid gap-1">
                            {title && <ToastTitle>{title}</ToastTitle>}
                            {description && (
                                <ToastDescription>
                                    {description}
                                </ToastDescription>
                            )}
                        </div>
                        {action}
                        <ToastClose />
                    </Toast>
                );
            })}
        </div>
    );
}

export {
    type ToasterToast,
    type ToastProps,
    type ToastActionElement,
    Toast,
    ToastAction,
    ToastClose,
    ToastTitle,
    ToastDescription,
    Toaster,
    useToast,
    toast,
};
