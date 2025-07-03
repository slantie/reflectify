import { Dialog } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface DeleteFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteFacultyModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteFacultyModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-lg bg-white p-6 transform ease-out duration-300 transition-all animate-in fade-in zoom-in-95">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
            </div>
            <Dialog.Title className="text-2xl font-semibold text-gray-900">
              Delete Faculty Member
            </Dialog.Title>
            <p className="mt-1 text-sm text-gray-500">
              This action cannot be undone. This will permanently delete the
              faculty member from the database.
            </p>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Warning</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>All associated data will be removed</li>
                    <li>This action is permanent and irreversible</li>
                    <li>Related records might be affected</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <XCircleIcon className="h-5 w-5" />
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin">⚪</span>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-5 w-5" />
                  Delete Faculty
                </>
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
