export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'accountant';
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  permissions: {
    canManageCustomers: boolean;
    canManagePassports: boolean;
    canManageBookings: boolean;
    canManageVisas: boolean;
    canManageFinances: boolean;
    canDeleteRecords: boolean;
    canExportExcel: boolean;
    canManageEmployees: boolean;
    canManageSettings: boolean;
    canViewAuditLogs: boolean;
  };
}

export interface Customer {
  id: string;
  fullNameAr: string;
  fullNameEn: string;
  nationalId?: string;
  dob: string;
  age: number;
  nationality: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  whatsapp?: string;
  email: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  status: 'active' | 'vip' | 'archived';
  assignedEmployeeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Passport {
  id: string;
  customerId: string;
  passportNumber: string;
  holderNameAr: string;
  holderNameEn: string;
  nationality: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  passportType: 'regular' | 'diplomatic' | 'special';
  scanAttachmentUrl?: string;
  notes?: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  createdAt: string;
  customerNameAr?: string;
  customerNameEn?: string;
  customerPhone?: string;
}

export interface NationalIdRecord {
  id: string;
  customerId: string;
  idNumber: string;
  issueDate?: string;
  expiryDate?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  documentAttachmentUrl?: string;
  notes?: string;
  createdAt: string;
  customerNameAr?: string;
  customerNameEn?: string;
  customerPhone?: string;
}

export type ServiceCategory = 'flight' | 'visa' | 'package' | 'hotel' | 'transfer' | 'custom';
export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'archived';

export interface Traveler {
  nameAr: string;
  nameEn: string;
  passportNumber?: string;
  dob?: string;
  type: 'adult' | 'child' | 'infant';
}

export interface Booking {
  id: string;
  bookingRef: string;
  customerId: string;
  serviceCategory: ServiceCategory;
  destination: string;
  origin?: string;
  departureDate: string;
  returnDate?: string;
  airline?: string;
  flightNumber?: string;
  ticketNumber?: string;
  hotelDetails?: string;
  supplierId?: string;
  assignedEmployeeId: string;
  status: BookingStatus;
  totalPrice: number;
  supplierCost: number;
  currency: string;
  travelers: Traveler[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  customerNameAr?: string;
  customerNameEn?: string;
  customerPhone?: string;
  supplierName?: string;
  paidAmount?: number;
  remainingBalance?: number;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
}

export interface VisaApplication {
  id: string;
  applicationRef: string;
  customerId: string;
  travelerName: string;
  passportNumber: string;
  destinationCountry: string;
  visaCategory: 'tourist' | 'business' | 'student' | 'transit' | 'work';
  submissionDate?: string;
  appointmentDate?: string;
  expectedDecisionDate?: string;
  status: 'incomplete' | 'preparing' | 'submitted' | 'appointment_scheduled' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  checklist: {
    id: string;
    nameAr: string;
    nameEn: string;
    isCompleted: boolean;
    notes?: string;
  }[];
  fees: number;
  currency: string;
  assignedEmployeeId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customerNameAr?: string;
  customerNameEn?: string;
  customerPhone?: string;
}

export interface Supplier {
  id: string;
  name: string;
  serviceType: 'airline' | 'hotel' | 'visa_agent' | 'transport' | 'tour_operator' | 'insurance';
  contactPerson: string;
  phone: string;
  email: string;
  balanceOwed: number;
  currency: string;
  notes?: string;
  status: 'active' | 'inactive';
}

export interface Payment {
  id: string;
  paymentRef: string;
  customerId: string;
  bookingId?: string;
  date: string;
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'pos' | 'cheque';
  transactionRef?: string;
  recordedById: string;
  notes?: string;
  createdAt: string;
  customerNameAr?: string;
  customerNameEn?: string;
  bookingRef?: string;
}

export interface Expense {
  id: string;
  expenseRef: string;
  category: 'supplier_cost' | 'office_rent' | 'utilities' | 'salaries' | 'marketing' | 'software' | 'visa_fee' | 'other';
  date: string;
  amount: number;
  currency: string;
  supplierId?: string;
  bookingId?: string;
  description: string;
  receiptUrl?: string;
  recordedById: string;
  createdAt: string;
  supplierName?: string;
}

export interface CustomerDocument {
  id: string;
  customerId: string;
  bookingId?: string;
  title: string;
  documentType: 'passport_scan' | 'national_id_scan' | 'visa' | 'ticket' | 'voucher' | 'receipt' | 'other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  uploadedById: string;
  createdAt: string;
  customerNameAr?: string;
  customerNameEn?: string;
}

export interface NotificationItem {
  id: string;
  type: 'passport_expiry' | 'upcoming_departure' | 'visa_status' | 'unpaid_balance' | 'system';
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'backup' | 'restore';
  entity: string;
  entityId?: string;
  details: string;
  ip?: string;
  createdAt: string;
}

export interface AppSettings {
  companyNameAr: string;
  companyNameEn: string;
  commercialReg: string;
  iataCode: string;
  phone: string;
  email: string;
  addressAr: string;
  addressEn: string;
  defaultCurrency: string;
  currencies: string[];
  passportWarningDays: number;
  bookingRefPrefix: string;
  invoiceFooterAr: string;
  invoiceFooterEn: string;
  logoUrl?: string;
  logoType?: 'preset' | 'custom' | 'default';
  taglineAr?: string;
  taglineEn?: string;
}
