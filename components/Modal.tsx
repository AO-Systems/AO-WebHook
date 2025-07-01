import React, { Fragment } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: React.ReactNode;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, content, onConfirm, confirmText, cancelText }) => {
    if (!isOpen) return null;

    return (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-700">
                        <div className="bg-slate-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                    <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                    <h3 className="text-base font-semibold leading-6 text-slate-100" id="modal-title">
                                        {title}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-slate-400">
                                            {content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            {onConfirm && (
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                >
                                    {confirmText || 'Confirm'}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-600 sm:mt-0 sm:w-auto"
                            >
                                {cancelText || (onConfirm ? 'Cancel' : 'Close')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
