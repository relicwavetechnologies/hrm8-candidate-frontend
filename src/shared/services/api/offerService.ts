/**
 * Offer API Service
 * Handles all offer-related API calls
 */

import { apiClient } from '../api';
import type { OfferLetter } from '@/shared/types/offer';

export interface CreateOfferRequest {
  applicationId: string;
  offerType: string;
  salary: number;
  salaryCurrency?: string;
  salaryPeriod: string;
  startDate: string;
  benefits?: string[];
  bonusStructure?: string;
  equityOptions?: string;
  workLocation: string;
  workArrangement: string;
  probationPeriod?: number;
  vacationDays?: number;
  customTerms?: any;
  approvalWorkflow?: any;
  expiryDate?: string;
  customMessage?: string;
  templateId?: string;
}

export interface NegotiationMessage {
  id: string;
  offerId: string;
  messageType: string;
  message: string;
  proposedChanges?: any;
  senderId: string;
  senderType: string;
  senderName: string;
  senderEmail?: string;
  responded: boolean;
  response?: string;
  responseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferDocument {
  id: string;
  offerId: string;
  applicationId?: string;
  name: string;
  description?: string;
  category: string;
  status: string;
  fileUrl?: string;
  fileName?: string;
  uploadedDate?: string;
  uploadedBy?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  reviewNotes?: string;
  expiryDate?: string;
  isRequired: boolean;
  templateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

class OfferService {
  /**
   * Create a new offer
   */
  async createOffer(applicationId: string, data: CreateOfferRequest) {
    return apiClient.post<OfferLetter>(`/api/applications/${applicationId}/offers`, data);
  }

  /**
   * Get offer by ID
   */
  async getOffer(offerId: string) {
    return apiClient.get<OfferLetter>(`/api/offers/${offerId}`);
  }

  /**
   * Get all offers for an application
   */
  async getApplicationOffers(applicationId: string) {
    return apiClient.get<OfferLetter[]>(`/api/applications/${applicationId}/offers`);
  }

  /**
   * Update offer
   */
  async updateOffer(offerId: string, data: Partial<CreateOfferRequest>) {
    return apiClient.put<OfferLetter>(`/api/offers/${offerId}`, data);
  }

  /**
   * Send offer
   */
  async sendOffer(offerId: string) {
    return apiClient.post<OfferLetter>(`/api/offers/${offerId}/send`, {});
  }

  /**
   * Accept offer (candidate)
   */
  async acceptOffer(offerId: string, signedDocumentUrl?: string) {
    return apiClient.post<OfferLetter>(`/api/offers/${offerId}/accept`, {
      signedDocumentUrl,
    });
  }

  /**
   * Decline offer (candidate)
   */
  async declineOffer(offerId: string, reason?: string) {
    return apiClient.post<OfferLetter>(`/api/offers/${offerId}/decline`, {
      reason,
    });
  }

  /**
   * Withdraw offer (employer)
   */
  async withdrawOffer(offerId: string, reason?: string) {
    return apiClient.post<OfferLetter>(`/api/offers/${offerId}/withdraw`, {
      reason,
    });
  }

  /**
   * Initiate negotiation (candidate)
   */
  async initiateNegotiation(offerId: string, data: {
    message: string;
    proposedChanges?: any;
  }) {
    return apiClient.post<NegotiationMessage>(`/api/offers/${offerId}/negotiations`, data);
  }

  /**
   * Get negotiation history
   */
  async getNegotiationHistory(offerId: string) {
    return apiClient.get<NegotiationMessage[]>(`/api/offers/${offerId}/negotiations`);
  }

  /**
   * Respond to negotiation (employer)
   */
  async respondToNegotiation(offerId: string, negotiationId: string, data: {
    message: string;
    response: 'accept' | 'reject' | 'counter';
    counterChanges?: any;
  }) {
    return apiClient.post<NegotiationMessage>(`/api/offers/${offerId}/negotiations/${negotiationId}/respond`, data);
  }

  /**
   * Accept negotiated terms (candidate)
   */
  async acceptNegotiatedTerms(offerId: string, negotiationId: string) {
    return apiClient.post(`/api/offers/${offerId}/negotiations/${negotiationId}/accept`, {});
  }

  /**
   * Create document request (employer)
   */
  async createDocumentRequest(offerId: string, data: {
    name: string;
    description?: string;
    category: string;
    isRequired?: boolean;
    templateUrl?: string;
    expiryDate?: string;
  }) {
    return apiClient.post<OfferDocument>(`/api/offers/${offerId}/documents`, data);
  }

  /**
   * Get required documents
   */
  async getRequiredDocuments(offerId: string) {
    return apiClient.get<OfferDocument[]>(`/api/offers/${offerId}/documents`);
  }

  /**
   * Upload document (candidate)
   */
  async uploadDocument(offerId: string, documentId: string, data: {
    fileUrl: string;
    fileName: string;
  }) {
    return apiClient.post<OfferDocument>(`/api/offers/${offerId}/documents/${documentId}/upload`, data);
  }

  /**
   * Review document (employer)
   */
  async reviewDocument(offerId: string, documentId: string, data: {
    status: 'approved' | 'rejected' | 'revision-required';
    notes?: string;
  }) {
    return apiClient.post<OfferDocument>(`/api/offers/${offerId}/documents/${documentId}/review`, data);
  }
}

export const offerService = new OfferService();


