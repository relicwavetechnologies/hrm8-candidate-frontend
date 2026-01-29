/**
 * Centralized notification service
 * Use this for consistent notifications across the app
 */

import { toast } from 'sonner';

export interface NotificationOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private defaultDuration = 4000;

  success(message: string, options?: NotificationOptions) {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || this.defaultDuration,
      action: options?.action,
    });
  }

  error(message: string, options?: NotificationOptions) {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || this.defaultDuration,
      action: options?.action,
    });
  }

  info(message: string, options?: NotificationOptions) {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || this.defaultDuration,
      action: options?.action,
    });
  }

  warning(message: string, options?: NotificationOptions) {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || this.defaultDuration,
      action: options?.action,
    });
  }

  loading(message: string, options?: NotificationOptions) {
    return toast.loading(message, {
      description: options?.description,
      duration: options?.duration || this.defaultDuration,
    });
  }

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, messages);
  }

  // CRUD helpers
  crud = {
    created: (entity: string) => this.success(`${entity} created successfully`),
    updated: (entity: string) => this.success(`${entity} updated successfully`),
    deleted: (entity: string) => this.success(`${entity} deleted successfully`),
    createFailed: (entity: string, reason?: string) => 
      this.error(`Failed to create ${entity}`, { description: reason }),
    updateFailed: (entity: string, reason?: string) => 
      this.error(`Failed to update ${entity}`, { description: reason }),
    deleteFailed: (entity: string, reason?: string) => 
      this.error(`Failed to delete ${entity}`, { description: reason }),
  };

  dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  }

  dismissAll() {
    toast.dismiss();
  }
}

export const notify = new NotificationService();
