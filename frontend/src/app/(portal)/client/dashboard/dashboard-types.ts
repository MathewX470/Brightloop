
export interface DashboardCustomer {
  id: string;
  name: string;
  company: string;
  email: string;
}

export interface DashboardStats {
  activeSubscriptionCount: number;
  pendingInvoiceCount: number;
  outstandingAmount: number;
  nextRenewalDate: string | null;
}

export interface DashboardSubscription {
  id: string;
  subscriptionNumber: string;
  status: string;
  billingCycle: string;
  nextBillingDate: string | null;
  lines: {
    id: string;
    quantity: number;
    unitPrice: number | string;
    product: {
      id: string;
      name: string;
      type: string;
    };
    plan: {
      id: string;
      name: string;
      billingCycle: string;
      price: number | string;
    };
    variant: {
      id: string;
      name: string;
    } | null;
  }[];
}

export interface DashboardInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number | string;
  paidAmount: number | string;
  issueDate: string;
  dueDate: string;
  createdAt: string;
  lines: {
    description: string;
  }[];
}

export interface DashboardPayment {
  id: string;
  paymentNumber: string;
  amount: number | string;
  method: string;
  status: string;
  paymentDate: string;
  invoice: {
    id: string;
    invoiceNumber: string;
  };
}

export interface DashboardRecentInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number | string;
  issueDate: string;
  createdAt: string;
}

export interface DashboardData {
  customer: DashboardCustomer;
  stats: DashboardStats;
  subscriptions: DashboardSubscription[];
  pendingInvoices: DashboardInvoice[];
  recentPayments: DashboardPayment[];
  recentInvoices: DashboardRecentInvoice[];
  upcomingRenewals: DashboardSubscription[];
  renewalTotal: number;
}
