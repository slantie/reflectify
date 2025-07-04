import { Dialog } from "@headlessui/react";
import {
    XMarkIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

interface DeleteDivisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DeleteDivisionModal({
    isOpen,
    onClose,
    onConfirm,
}: DeleteDivisionModalProps) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-md w-full rounded-lg bg-white p-6 transform ease-out duration-300 transition-all animate-in fade-in zoom-in-95">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 rounded-full bg-negative-lighter flex items-center justify-center mb-3">
                            <ExclamationTriangleIcon className="h-6 w-6 text-negative-main" />
                        </div>
                        <Dialog.Title className="text-xl font-semibold text-secondary-darker">
                            Delete Division
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-secondary-lighter0">
                            Are you sure you want to delete this division? This
                            action cannot be undone.
                        </p>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-secondary-main hover:text-secondary-lighter0 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-secondary-dark hover:bg-secondary-lighter border border-secondary-light rounded-lg transition-colors flex items-center gap-2"
                        >
                            <XCircleIcon className="h-5 w-5" />
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-negative-main hover:bg-negative-main rounded-lg transition-colors flex items-center gap-2"
                        >
                            <TrashIcon className="h-5 w-5" />
                            Delete Division
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
