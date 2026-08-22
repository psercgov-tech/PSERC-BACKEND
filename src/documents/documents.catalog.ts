export type LibraryDocumentId =
  | 'business-rules'
  | 'captive-power'
  | 'customer-service'
  | 'licensing'
  | 'mini-grid'
  | 'tariff-methodology';

export type LibraryDocumentMeta = {
  id: LibraryDocumentId;
  title: string;
  description: string;
  fileName: string;
};

export const LIBRARY_DOCUMENTS: LibraryDocumentMeta[] = [
  {
    id: 'business-rules',
    title: 'Business Rules',
    description:
      'PSERC business rules for market participants and Commission processes.',
    fileName: 'business-rules.pdf',
  },
  {
    id: 'captive-power',
    title: 'Captive Power Generation Regulations',
    description:
      'Regulations governing captive power generation in Plateau State.',
    fileName: 'captive-power-generation-regulations.pdf',
  },
  {
    id: 'customer-service',
    title: 'Customer Service Standards and Protection Regulation',
    description:
      'Standards and protections for electricity consumers in Plateau State.',
    fileName: 'customer-service-standards.pdf',
  },
  {
    id: 'licensing',
    title: 'Licensing Regulations',
    description: 'Rules for applying, holding and complying with PSERC licences.',
    fileName: 'licensing-regulations.pdf',
  },
  {
    id: 'mini-grid',
    title: 'Mini Grid Regulations',
    description: 'Regulatory framework for mini-grid operations in Plateau State.',
    fileName: 'mini-grid-regulations.pdf',
  },
  {
    id: 'tariff-methodology',
    title: 'Tariff Methodology Regulation',
    description: 'Methodology for electricity tariff setting and related reviews.',
    fileName: 'tariff-methodology-regulation.pdf',
  },
];

export function findLibraryDocument(id: string): LibraryDocumentMeta | undefined {
  return LIBRARY_DOCUMENTS.find((doc) => doc.id === id);
}
