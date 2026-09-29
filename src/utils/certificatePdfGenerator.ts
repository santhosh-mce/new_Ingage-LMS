import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { IngageCertificate, IngageCertificateProps } from '../components/certificate/IngageCertificate';

export interface CertificateExportOptions {
  studentName?: string;
  courseTitle?: string;
  certificateNumber?: string;
  formattedDate?: string;
  instructorName?: string;
  filename?: string;
}

/**
 * Capture an existing DOM element and export it as an ultra-high-resolution A4 landscape PDF.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string = 'Ingage-Certificate.pdf'
): Promise<void> {
  // 1. Capture at 2.5x scale for 300dpi equivalent resolution
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
    onclone: (clonedDoc) => {
      // Ensure cloned element is fully visible and not transformed
      const target = clonedDoc.getElementById(element.id);
      if (target) {
        target.style.transform = 'none';
        target.style.position = 'static';
        target.style.margin = '0 auto';
      }
    },
  });

  // 2. Generate PDF using standard A4 landscape dimensions (297mm x 210mm)
  // The certificate's 1.414 aspect ratio maps directly to A4 landscape (297 / 210 = 1.414)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Export a certificate as a high-resolution PDF directly from certificate data.
 * Renders IngageCertificate off-screen, captures it with html2canvas, and generates the PDF.
 */
export async function downloadCertificatePdfFromData(
  options: CertificateExportOptions
): Promise<void> {
  const {
    studentName = 'Santhosh Kumar D',
    courseTitle = 'Full Stack Development',
    certificateNumber = 'ING-2026-7842',
    formattedDate = 'Sep 18, 2026',
    instructorName = 'Alex Rivera',
    filename = `Ingage-Certificate-${options.certificateNumber || 'completion'}.pdf`,
  } = options;

  // 1. Create a container off-screen with fixed width and height
  const container = document.createElement('div');
  container.id = 'temp-pdf-export-container';
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '1000px';
  container.style.height = '707px';
  container.style.zIndex = '-9999';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // 2. Render IngageCertificate into the temporary off-screen container
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(IngageCertificate, {
          id: 'temp-certificate-canvas',
          studentName,
          courseTitle,
          certificateNumber,
          formattedDate,
          instructorName,
          className: '!m-0 !w-[1000px] !h-[707px] !max-w-none !rounded-none !shadow-none',
        })
      );
      // Allow browser layout and styling recalculation
      setTimeout(resolve, 200);
    });

    const certElement = container.firstElementChild as HTMLElement || container;

    // 3. Export to PDF
    await exportElementToPdf(certElement, filename);
  } finally {
    // Clean up temporary DOM tree
    try {
      root.unmount();
      document.body.removeChild(container);
    } catch {
      // noop
    }
  }
}

/**
 * Capture an element and download as a high-resolution PNG image
 */
export async function exportElementToPng(
  element: HTMLElement,
  filename: string = 'Ingage-Certificate.png'
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const downloadLink = document.createElement('a');
  downloadLink.href = dataUrl;
  downloadLink.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
