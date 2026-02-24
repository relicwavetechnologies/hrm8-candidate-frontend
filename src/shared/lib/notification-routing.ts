import type { Notification } from '@/shared/services/notificationService';

type RawNotification = Partial<Notification> & {
  action_url?: string;
  created_at?: string;
  read_at?: string;
  job_id?: string;
  application_id?: string;
  company_id?: string;
  lead_id?: string;
  region_id?: string;
  data?: Record<string, unknown> | null;
};

const JOB_ALERT_TYPES = new Set(['JOB_ALERT', 'JOB_MATCH']);
const MESSAGE_TYPES = new Set(['NEW_MESSAGE', 'MESSAGE', 'MESSAGE_RECEIVED']);
const INTERVIEW_TYPES = new Set(['INTERVIEW_SCHEDULED', 'INTERVIEW_RESCHEDULED', 'INTERVIEW_REMINDER']);
const APPLICATION_TYPES = new Set([
  'APPLICATION_STATUS_CHANGED',
  'APPLICATION_UPDATE',
  'APPLICATION_STATUS_UPDATED',
  'APPLICATION_RECEIVED',
]);
const OFFER_TYPES = new Set(['OFFER_EXTENDED', 'OFFER_SENT']);

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const readString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const extractFromActionPath = (actionUrl: string | undefined, regex: RegExp): string | undefined => {
  if (!actionUrl) {
    return undefined;
  }

  const normalized = sanitizeInternalPath(actionUrl);
  if (!normalized) {
    return undefined;
  }

  const match = normalized.match(regex);
  return readString(match?.[1]);
};

const extractQueryParamFromActionUrl = (actionUrl: string | undefined, key: string): string | undefined => {
  const normalized = sanitizeInternalPath(actionUrl);
  if (!normalized) {
    return undefined;
  }

  const query = normalized.includes('?') ? normalized.substring(normalized.indexOf('?') + 1) : '';
  if (!query) {
    return undefined;
  }

  return readString(new URLSearchParams(query).get(key));
};

const readDataId = (data: Record<string, unknown>, camelKey: string, snakeKey: string): string | undefined => {
  return readString(data[camelKey]) || readString(data[snakeKey]);
};

export const sanitizeInternalPath = (rawUrl: string | undefined): string | undefined => {
  const urlValue = readString(rawUrl);
  if (!urlValue) {
    return undefined;
  }

  if (urlValue.startsWith('//')) {
    return undefined;
  }

  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(urlValue, baseOrigin);

    if (typeof window !== 'undefined' && parsed.origin !== window.location.origin) {
      return undefined;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    if (urlValue.startsWith('/')) {
      return urlValue;
    }
    return undefined;
  }
};

export const normalizeNotification = (rawNotification: RawNotification): Notification => {
  const data = toRecord(rawNotification.data);

  return {
    id: readString(rawNotification.id) || '',
    type: readString(rawNotification.type) || 'SYSTEM_ANNOUNCEMENT',
    title: readString(rawNotification.title) || 'Notification',
    message: readString(rawNotification.message) || '',
    data,
    actionUrl: sanitizeInternalPath(rawNotification.actionUrl || rawNotification.action_url),
    link: sanitizeInternalPath(rawNotification.link),
    read: Boolean(rawNotification.read),
    readAt: readString(rawNotification.readAt || rawNotification.read_at),
    createdAt: readString(rawNotification.createdAt || rawNotification.created_at) || new Date(0).toISOString(),
    jobId: readString(rawNotification.jobId || rawNotification.job_id) || readDataId(data, 'jobId', 'job_id'),
    applicationId:
      readString(rawNotification.applicationId || rawNotification.application_id) ||
      readDataId(data, 'applicationId', 'application_id'),
    companyId: readString(rawNotification.companyId || rawNotification.company_id) || readDataId(data, 'companyId', 'company_id'),
    leadId: readString(rawNotification.leadId || rawNotification.lead_id) || readDataId(data, 'leadId', 'lead_id'),
    regionId: readString(rawNotification.regionId || rawNotification.region_id) || readDataId(data, 'regionId', 'region_id'),
  };
};

export const resolveCandidateNotificationTarget = (notification: Notification): string | null => {
  const data = toRecord(notification.data);
  const actionUrl = notification.actionUrl;

  if (JOB_ALERT_TYPES.has(notification.type)) {
    const jobId =
      notification.jobId ||
      readDataId(data, 'jobId', 'job_id') ||
      extractFromActionPath(actionUrl, /\/jobs\/([^/?#]+)/);

    return jobId ? `/jobs/${jobId}/apply` : null;
  }

  if (MESSAGE_TYPES.has(notification.type)) {
    const conversationId =
      readDataId(data, 'conversationId', 'conversation_id') ||
      extractFromActionPath(actionUrl, /\/messages\/([^/?#]+)/) ||
      extractQueryParamFromActionUrl(actionUrl, 'conversationId');

    return conversationId ? `/candidate/messages/${conversationId}` : null;
  }

  if (INTERVIEW_TYPES.has(notification.type)) {
    const applicationId =
      notification.applicationId ||
      readDataId(data, 'applicationId', 'application_id') ||
      extractFromActionPath(actionUrl, /\/applications\/([^/?#]+)/);

    return applicationId ? `/candidate/applications/${applicationId}?tab=interviews` : null;
  }

  if (APPLICATION_TYPES.has(notification.type)) {
    const applicationId =
      notification.applicationId ||
      readDataId(data, 'applicationId', 'application_id') ||
      extractFromActionPath(actionUrl, /\/applications\/([^/?#]+)/);

    return applicationId ? `/candidate/applications/${applicationId}` : null;
  }

  if (OFFER_TYPES.has(notification.type)) {
    const offerId =
      readDataId(data, 'offerId', 'offer_id') ||
      extractFromActionPath(actionUrl, /\/offers\/([^/?#]+)/);

    if (offerId) {
      return `/candidate/offers/${offerId}`;
    }

    const applicationId =
      notification.applicationId ||
      readDataId(data, 'applicationId', 'application_id') ||
      extractFromActionPath(actionUrl, /\/applications\/([^/?#]+)/);

    return applicationId ? `/candidate/applications/${applicationId}` : null;
  }

  if (notification.type === 'SYSTEM_ANNOUNCEMENT') {
    const subtype = readDataId(data, 'notificationSubtype', 'notification_subtype');
    if (subtype === 'ASSESSMENT_INVITED') {
      const assessmentId =
        readDataId(data, 'assessmentId', 'assessment_id') ||
        extractFromActionPath(actionUrl, /\/assessments\/([^/?#]+)/);

      return assessmentId ? `/candidate/assessments/${assessmentId}` : null;
    }
  }

  return sanitizeInternalPath(actionUrl || notification.link) || null;
};
