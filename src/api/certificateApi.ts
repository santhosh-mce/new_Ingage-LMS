import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ingage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CertificateDto {
  id: number;
  certificateNumber: string;
  verificationCode: string;
  studentName: string;
  courseId: number;
  courseTitle: string;
  courseName?: string;
  courseCategory?: string;
  courseDuration?: string;
  instructor?: string;
  completionDate?: string;
  formattedDate?: string;
  issuedAt: string;
  status: string;
  verificationUrl: string;
  downloadUrl: string;
  viewUrl?: string;
}

export interface CertificateVerificationDto {
  valid: boolean;
  status?: string;
  studentName?: string;
  courseName?: string;
  courseCategory?: string;
  courseDuration?: string;
  instructor?: string;
  completionDate?: string;
  formattedDate?: string;
  issueDate?: string;
  certificateNumber?: string;
  verificationCode?: string;
  message?: string;
}

/**
 * Fetch all certificates belonging to the authenticated student
 */
export async function getMyCertificates(): Promise<CertificateDto[]> {
  const res = await api.get<any>('/certificates/my');
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.certificates)) return res.data.certificates;
  return [];
}

/**
 * Fetch single certificate by ID (verifying ownership)
 */
export async function getCertificateById(id: number | string): Promise<CertificateDto> {
  const res = await api.get<CertificateDto>(`/certificates/${id}`);
  return res.data;
}

/**
 * Fetch student certificate for a specific course if completed
 */
export async function getCourseCertificate(courseId: number | string): Promise<CertificateDto> {
  const res = await api.get<CertificateDto>(`/certificates/course/${courseId}`);
  return res.data;
}

/**
 * Generate official certificate on backend after course completion verification
 */
export async function generateCourseCertificate(courseId: number | string): Promise<CertificateDto> {
  const res = await api.post<CertificateDto>(`/certificates/generate/${courseId}`);
  return res.data;
}

/**
 * Claim or auto-generate certificate for a course
 */
export async function claimCourseCertificate(courseId: number | string): Promise<CertificateDto> {
  const res = await api.post<CertificateDto>(`/certificates/claim/${courseId}`);
  return res.data;
}

/**
 * Download certificate PDF directly from backend as binary application/pdf
 */
export async function downloadCertificatePdf(
  id: number | string,
  certificateNumber?: string,
  courseTitle?: string
): Promise<void> {
  const res = await api.get(`/certificates/${id}/download`, {
    responseType: 'blob',
  });

  // Extract server-provided filename if available
  let filename = '';
  const disposition = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
  if (disposition) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '').trim();
    }
  }

  if (!filename) {
    const safeTitle = courseTitle ? courseTitle.replace(/[^a-zA-Z0-9.-]/g, '-') : '';
    filename = safeTitle
      ? `Certificate-${safeTitle}-${certificateNumber || id}.pdf`
      : `Certificate-${certificateNumber || id}.pdf`;
  }

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * View certificate PDF inline from backend as temporary Blob URL
 */
export async function getCertificateViewBlobUrl(id: number | string): Promise<string> {
  const res = await api.get(`/certificates/${id}/view`, {
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  return window.URL.createObjectURL(blob);
}

/**
 * Download sample certificate PDF directly from backend testing endpoint
 */
export async function downloadSampleCertificatePdf(): Promise<void> {
  const res = await api.get('/certificates/sample/download', {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', 'Certificate-CERT-2026-000001.pdf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Publicly verify certificate authenticity using verificationCode or certificateNumber
 */
export async function verifyCertificate(codeOrNumber: string): Promise<CertificateVerificationDto> {
  const res = await api.get<CertificateVerificationDto>(
    `/certificates/verify/${encodeURIComponent(codeOrNumber.trim())}`
  );
  return res.data;
}

/**
 * Download public verified certificate PDF
 */
export async function downloadPublicCertificatePdf(codeOrNumber: string, certificateNumber?: string): Promise<void> {
  const res = await api.get(
    `/certificates/verify/${encodeURIComponent(codeOrNumber.trim())}/download`,
    { responseType: 'blob' }
  );

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `Certificate-${certificateNumber || codeOrNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
