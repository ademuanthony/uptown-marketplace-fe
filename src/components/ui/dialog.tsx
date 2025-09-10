'use client';

import React, { createContext, useContext, useState, useEffect, HTMLAttributes } from 'react';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isOpen = open ?? internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
      {children}
      {isOpen && <DialogPortal />}
    </DialogContext.Provider>
  );
}

function DialogPortal() {
  const context = useContext(DialogContext);

  useEffect(() => {
    if (!context?.open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        context.onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [context]);

  // Don't render anything here - the DialogContent will handle the portal
  return null;
}

export interface DialogTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

function DialogTrigger({ children, asChild, ...props }: DialogTriggerProps) {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('DialogTrigger must be used within a Dialog component');
  }

  const handleClick = () => {
    context.onOpenChange(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...(children.props as Record<string, unknown>),
      onClick: handleClick,
    } as Record<string, unknown>);
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export type DialogContentProps = HTMLAttributes<HTMLDivElement>;

function DialogContent({ className = '', children, ...props }: DialogContentProps) {
  const context = useContext(DialogContext);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (context?.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [context?.open]);

  if (!context?.open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          context.onOpenChange(false);
        }}
        aria-hidden="true"
      />
      {/* Modal Content */}
      <div
        className={`relative z-[101] grid w-full max-w-lg gap-4 border border-slate-200 bg-white p-6 shadow-lg rounded-lg ${className}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {children}
        {/* Close Button */}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 z-10"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            context.onOpenChange(false);
          }}
          aria-label="Close dialog"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m11.7816 4.03157c.0824-.08241.0824-.21569 0-.2981-.0824-.08241-.2157-.08241-.2981 0L7.50002 7.70792 3.51852 3.73282c-.08241-.08241-.21569-.08241-.2981 0-.08241.08241-.08241.21569 0 .2981L7.20192 7.99999 3.22002 11.9819c-.08241.0824-.08241.2157 0 .2981.08241.0824.21569.0824.2981 0L7.50002 8.29206l3.98152 3.97504c.0824.0824.2157.0824.2981 0 .0824-.0824.0824-.2157 0-.2981L7.79812 7.99999l3.98148-3.96842z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;

function DialogHeader({ className = '', ...props }: DialogHeaderProps) {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props} />
  );
}

export type DialogTitleProps = HTMLAttributes<HTMLHeadingElement>;

function DialogTitle({ className = '', ...props }: DialogTitleProps) {
  return (
    <h3
      className={`text-xl font-bold leading-none tracking-tight text-gray-900 ${className}`}
      {...props}
    />
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle };
