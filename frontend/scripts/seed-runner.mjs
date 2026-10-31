import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database via Neon PostgreSQL...");

  // 1. Users / Staff
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@brightloop.io" },
    update: {
      passwordHash: "$2b$10$VkKoUjG1/HqDf4DZGHPpZO0eQChvBQaEIg9zGW3ZRHlT23PRaoR0O",
    },
    create: {
      name: "Brightloop Admin",
      email: "admin@brightloop.io",
      passwordHash: "$2b$10$VkKoUjG1/HqDf4DZGHPpZO0eQChvBQaEIg9zGW3ZRHlT23PRaoR0O",
      role: "ADMIN",
      isActive: true,
    },
  });

  const staffUser1 = await prisma.user.upsert({
    where: { email: "sarah.chen@brightloop.io" },
    update: {
      passwordHash: "$2b$10$Cioc1p9L0aeLsJVxFZKYSODcLbNRRQj0YtEX06styQnEHHnoIL4p.",
    },
    create: {
      name: "Sarah Chen",
      email: "sarah.chen@brightloop.io",
      passwordHash: "$2b$10$Cioc1p9L0aeLsJVxFZKYSODcLbNRRQj0YtEX06styQnEHHnoIL4p.",
      role: "STAFF",
      isActive: true,
    },
  });

  const staffUser2 = await prisma.user.upsert({
    where: { email: "alex.miller@brightloop.io" },
    update: {
      passwordHash: "$2b$10$Cioc1p9L0aeLsJVxFZKYSODcLbNRRQj0YtEX06styQnEHHnoIL4p.",
    },
    create: {
      name: "Alex Miller",
      email: "alex.miller@brightloop.io",
      passwordHash: "$2b$10$Cioc1p9L0aeLsJVxFZKYSODcLbNRRQj0YtEX06styQnEHHnoIL4p.",
      role: "STAFF",
      isActive: true,
    },
  });

  // 2. Customers
  let cust1 = await prisma.customer.findFirst({ where: { email: "billing@acme.com" } });
  if (!cust1) {
    cust1 = await prisma.customer.create({
      data: {
        companyName: "Acme Technologies Ltd.",
        email: "billing@acme.com",
        phone: "+1 (555) 019-2834",
        taxId: "US9482103",
        billingAddress: "500 Silicon Blvd, Suite 400, San Jose, CA 95134",
      },
    });
  }

  // Create customer portal user
  if (cust1) {
    await prisma.user.upsert({
      where: { email: "billing@acme.com" },
      update: {
        customerId: cust1.id,
        passwordHash: "$2b$10$EhIA1oL/mOy9JTwdCwa7ZejITNvX7Tkyt0pmnULGjJzqHgTCmcXJe",
      },
      create: {
        name: "Acme Billing Contact",
        email: "billing@acme.com",
        passwordHash: "$2b$10$EhIA1oL/mOy9JTwdCwa7ZejITNvX7Tkyt0pmnULGjJzqHgTCmcXJe",
        role: "CUSTOMER",
        customerId: cust1.id,
        isActive: true,
      },
    });
  }

  let cust2 = await prisma.customer.findFirst({ where: { email: "accounts@apexlogistics.com" } });
  if (!cust2) {
    cust2 = await prisma.customer.create({
      data: {
        companyName: "Apex Logistics Solutions",
        email: "accounts@apexlogistics.com",
        phone: "+1 (555) 014-9988",
        taxId: "US8819201",
        billingAddress: "1200 Industrial Parkway, Chicago, IL 60607",
      },
    });
  }

  let cust3 = await prisma.customer.findFirst({ where: { email: "finance@horizonhealth.org" } });
  if (!cust3) {
    cust3 = await prisma.customer.create({
      data: {
        companyName: "Horizon Healthcare Network",
        email: "finance@horizonhealth.org",
        phone: "+1 (555) 012-7744",
        taxId: "US5529104",
        billingAddress: "77 Medical Way, Boston, MA 02115",
      },
    });
  }

  let cust4 = await prisma.customer.findFirst({ where: { email: "admin@zenithstudio.design" } });
  if (!cust4) {
    cust4 = await prisma.customer.create({
      data: {
        companyName: "Zenith Creative Studio",
        email: "admin@zenithstudio.design",
        phone: "+1 (555) 018-3311",
        taxId: "US3301982",
        billingAddress: "450 Broadway, New York, NY 10013",
      },
    });
  }

  // 3. Products & Variants
  let prod1 = await prisma.product.findFirst({ where: { name: "Brightloop Business ERP Suite" } });
  if (!prod1) {
    prod1 = await prisma.product.create({
      data: {
        name: "Brightloop Business ERP Suite",
        type: "SOFTWARE",
        salesPrice: 999.0,
        costPrice: 250.0,
        notes: "Comprehensive ERP platform with automated invoicing, recurring contracts, and catalog.",
        variants: {
          create: [
            { name: "Brand: Odoo Enterprise Engine", priceModifier: 560.0 },
            { name: "Dedicated Cloud Instance", priceModifier: 200.0 },
          ],
        },
      },
    });
  }

  let prod2 = await prisma.product.findFirst({ where: { name: "Enterprise Dedicated Support SLA" } });
  if (!prod2) {
    prod2 = await prisma.product.create({
      data: {
        name: "Enterprise Dedicated Support SLA",
        type: "SERVICE",
        salesPrice: 450.0,
        costPrice: 120.0,
        notes: "24/7 dedicated support engineer and guaranteed 1-hour incident response SLA.",
      },
    });
  }

  let prod3 = await prisma.product.findFirst({ where: { name: "Custom API & Webhook Connector" } });
  if (!prod3) {
    prod3 = await prisma.product.create({
      data: {
        name: "Custom API & Webhook Connector",
        type: "DIGITAL",
        salesPrice: 180.0,
        costPrice: 40.0,
        notes: "High-throughput webhook dispatcher and REST API connector.",
      },
    });
  }

  // 4. Plans
  let plan1 = await prisma.plan.findFirst({ where: { name: "ERP Standard Monthly Plan" } });
  if (!plan1 && prod1) {
    plan1 = await prisma.plan.create({
      data: {
        productId: prod1.id,
        name: "ERP Standard Monthly Plan",
        billingCycle: "MONTHLY",
        price: 999.0,
        minimumQuantity: 1,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        autoClose: false,
      },
    });
  }

  let plan2 = await prisma.plan.findFirst({ where: { name: "ERP Annual Discount Plan" } });
  if (!plan2 && prod1) {
    plan2 = await prisma.plan.create({
      data: {
        productId: prod1.id,
        name: "ERP Annual Discount Plan",
        billingCycle: "YEARLY",
        price: 9990.0,
        minimumQuantity: 1,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        autoClose: false,
      },
    });
  }

  let plan3 = await prisma.plan.findFirst({ where: { name: "Support SLA 24/7 Monthly" } });
  if (!plan3 && prod2) {
    plan3 = await prisma.plan.create({
      data: {
        productId: prod2.id,
        name: "Support SLA 24/7 Monthly",
        billingCycle: "MONTHLY",
        price: 450.0,
        minimumQuantity: 1,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        autoClose: false,
      },
    });
  }

  let plan4 = await prisma.plan.findFirst({ where: { name: "API Webhook Monthly add-on" } });
  if (!plan4 && prod3) {
    plan4 = await prisma.plan.create({
      data: {
        productId: prod3.id,
        name: "API Webhook Monthly add-on",
        billingCycle: "MONTHLY",
        price: 180.0,
        minimumQuantity: 1,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        autoClose: false,
      },
    });
  }

  // 5. Tax Rules
  let tax1 = await prisma.tax.findFirst({ where: { name: "Standard GST 18%" } });
  if (!tax1) {
    tax1 = await prisma.tax.create({
      data: {
        name: "Standard GST 18%",
        type: "PERCENTAGE",
        rate: 18.0,
        description: "Standard Indian Goods & Services Tax",
        isActive: true,
      },
    });
  }

  let tax2 = await prisma.tax.findFirst({ where: { name: "Zero-Rated Export 0%" } });
  if (!tax2) {
    tax2 = await prisma.tax.create({
      data: {
        name: "Zero-Rated Export 0%",
        type: "PERCENTAGE",
        rate: 0.0,
        description: "Zero tax for international export contracts",
        isActive: true,
      },
    });
  }

  // 6. Discount Rules
  let disc1 = await prisma.discount.findFirst({ where: { name: "Volume Tier: 10+ Seats" } });
  if (!disc1) {
    disc1 = await prisma.discount.create({
      data: {
        name: "Volume Tier: 10+ Seats",
        type: "PERCENTAGE",
        value: 15.0,
        minimumQuantity: 10,
        startDate: new Date("2026-01-01"),
        usageLimit: 100,
        isActive: true,
      },
    });
  }

  let disc2 = await prisma.discount.findFirst({ where: { name: "Enterprise Growth Credit" } });
  if (!disc2) {
    disc2 = await prisma.discount.create({
      data: {
        name: "Enterprise Growth Credit",
        type: "FIXED",
        value: 100.0,
        minimumPurchase: 1500.0,
        startDate: new Date("2026-01-01"),
        isActive: true,
      },
    });
  }

  // 7. Quotation Templates
  let tpl1 = await prisma.quotationTemplate.findFirst({ where: { name: "Turnkey Enterprise Package" } });
  if (!tpl1 && plan1) {
    tpl1 = await prisma.quotationTemplate.create({
      data: {
        name: "Turnkey Enterprise Package",
        description: "Includes core ERP platform with 24/7 dedicated support SLA",
        validityDays: 30,
        lines: {
          create: [
            { planId: plan1.id, quantity: 1, unitPrice: 999.0 },
            ...(plan3 ? [{ planId: plan3.id, quantity: 1, unitPrice: 450.0 }] : []),
          ],
        },
      },
    });
  }

  // 8. Subscriptions
  let sub1 = await prisma.subscription.findFirst({ where: { subscriptionNumber: "SUB-2026-0001" } });
  if (!sub1 && cust1 && plan1 && prod1) {
    sub1 = await prisma.subscription.create({
      data: {
        subscriptionNumber: "SUB-2026-0001",
        customerId: cust1.id,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        paymentTermsDays: 15,
        startDate: new Date("2026-01-01"),
        nextBillingDate: new Date("2026-11-15"),
        lines: {
          create: [
            {
              productId: prod1.id,
              planId: plan1.id,
              quantity: 1,
              unitPrice: 999.0,
            },
          ],
        },
      },
    });
  }

  let sub2 = await prisma.subscription.findFirst({ where: { subscriptionNumber: "SUB-2026-0002" } });
  if (!sub2 && cust2 && plan1 && prod1 && plan4 && prod3) {
    sub2 = await prisma.subscription.create({
      data: {
        subscriptionNumber: "SUB-2026-0002",
        customerId: cust2.id,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
        paymentTermsDays: 15,
        startDate: new Date("2026-02-01"),
        nextBillingDate: new Date("2026-11-22"),
        lines: {
          create: [
            {
              productId: prod1.id,
              planId: plan1.id,
              quantity: 1,
              unitPrice: 999.0,
            },
            {
              productId: prod3.id,
              planId: plan4.id,
              quantity: 1,
              unitPrice: 180.0,
            },
          ],
        },
      },
    });
  }

  let sub3 = await prisma.subscription.findFirst({ where: { subscriptionNumber: "SUB-2026-0003" } });
  if (!sub3 && cust3 && plan3 && prod2) {
    sub3 = await prisma.subscription.create({
      data: {
        subscriptionNumber: "SUB-2026-0003",
        customerId: cust3.id,
        status: "CONFIRMED",
        billingCycle: "MONTHLY",
        paymentTermsDays: 30,
        startDate: new Date("2026-03-01"),
        lines: {
          create: [
            {
              productId: prod2.id,
              planId: plan3.id,
              quantity: 1,
              unitPrice: 450.0,
            },
          ],
        },
      },
    });
  }

  let sub4 = await prisma.subscription.findFirst({ where: { subscriptionNumber: "SUB-2026-0004" } });
  if (!sub4 && cust4 && plan1 && prod1) {
    sub4 = await prisma.subscription.create({
      data: {
        subscriptionNumber: "SUB-2026-0004",
        customerId: cust4.id,
        status: "DRAFT",
        billingCycle: "MONTHLY",
        paymentTermsDays: 15,
        lines: {
          create: [
            {
              productId: prod1.id,
              planId: plan1.id,
              quantity: 1,
              unitPrice: 999.0,
            },
          ],
        },
      },
    });
  }

  // 9. Invoices
  let inv1 = await prisma.invoice.findFirst({ where: { invoiceNumber: "INV-2026-0001" } });
  if (!inv1 && cust1 && sub1) {
    inv1 = await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-0001",
        customerId: cust1.id,
        subscriptionId: sub1.id,
        status: "PAID",
        issueDate: new Date("2026-10-01"),
        dueDate: new Date("2026-10-16"),
        subtotal: 999.0,
        taxAmount: 179.82,
        discountAmount: 0.0,
        total: 1178.82,
        paidAmount: 1178.82,
        lines: {
          create: [
            {
              description: "Brightloop Business ERP Suite - Standard Monthly",
              quantity: 1,
              unitPrice: 999.0,
              subtotal: 999.0,
              taxAmount: 179.82,
              total: 1178.82,
            },
          ],
        },
      },
    });
  }

  let inv2 = await prisma.invoice.findFirst({ where: { invoiceNumber: "INV-2026-0002" } });
  if (!inv2 && cust2 && sub2) {
    inv2 = await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-0002",
        customerId: cust2.id,
        subscriptionId: sub2.id,
        status: "CONFIRMED",
        issueDate: new Date("2026-10-15"),
        dueDate: new Date("2026-10-30"),
        subtotal: 1179.0,
        taxAmount: 212.22,
        discountAmount: 0.0,
        total: 1391.22,
        paidAmount: 0.0,
        lines: {
          create: [
            {
              description: "Brightloop Business ERP Suite + API Connector",
              quantity: 1,
              unitPrice: 1179.0,
              subtotal: 1179.0,
              taxAmount: 212.22,
              total: 1391.22,
            },
          ],
        },
      },
    });
  }

  let inv3 = await prisma.invoice.findFirst({ where: { invoiceNumber: "INV-2026-0003" } });
  if (!inv3 && cust3 && sub3) {
    inv3 = await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-0003",
        customerId: cust3.id,
        subscriptionId: sub3.id,
        status: "DRAFT",
        issueDate: new Date("2026-10-28"),
        dueDate: new Date("2026-11-28"),
        subtotal: 450.0,
        taxAmount: 81.0,
        discountAmount: 0.0,
        total: 531.0,
        paidAmount: 0.0,
        lines: {
          create: [
            {
              description: "Enterprise Dedicated Support SLA",
              quantity: 1,
              unitPrice: 450.0,
              subtotal: 450.0,
              taxAmount: 81.0,
              total: 531.0,
            },
          ],
        },
      },
    });
  }

  // 10. Payments
  let pay1 = await prisma.payment.findFirst({ where: { paymentNumber: "PAY-2026-0001" } });
  if (!pay1 && inv1) {
    pay1 = await prisma.payment.create({
      data: {
        paymentNumber: "PAY-2026-0001",
        invoiceId: inv1.id,
        amount: 1178.82,
        method: "BANK_TRANSFER",
        status: "SUCCESS",
        transactionReference: "UTR8839201948",
        notes: "Automated ACH wire settlement",
        paymentDate: new Date("2026-10-05"),
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
