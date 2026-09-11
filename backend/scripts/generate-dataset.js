/**
 * FitResQ Synthetic Dataset Generator
 * Generates a realistic, relational synthetic customer dataset:
 * - Exactly 100 Customers (CUS-001 to CUS-100)
 * - 250–400 Orders (~320 orders)
 * - 80–150 Refunds (~115 refunds)
 * - 100–200 Support Cases (~145 cases)
 * - 300–600 Messages (~420 messages)
 *
 * Enforces 100% referential integrity and conforms strictly to existing
 * FitResQ DynamoDB schemas in ap-south-1.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Realistic Data Seed Pools
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Rohan', 'Aditya', 'Arjun', 'Kabir', 'Aryan', 'Ananya', 'Diya', 'Ishita',
  'Riya', 'Neha', 'Tanvi', 'Sneha', 'Pooja', 'Meera', 'Swara', 'Anika', 'Rhea', 'Siddharth',
  'Vikram', 'Rahul', 'Karthik', 'Sanjay', 'Gaurav', 'Nikhil', 'Amit', 'Deepak', 'Priya', 'Shruti',
  'Divya', 'Meenal', 'Varun', 'Manish', 'Rajat', 'Alok', 'Shreya', 'Nidhi', 'Bhavna', 'Payal',
  'Aakash', 'Kunal', 'Abhishek', 'Mayank', 'Harsh', 'Tanya', 'Kriti', 'Simran', 'Palak', 'Anjali'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Mehta', 'Nair', 'Iyer', 'Joshi', 'Kulkarni', 'Deshmukh', 'Rao',
  'Reddy', 'Gupta', 'Singh', 'Agarwal', 'Choudhury', 'Bhatt', 'Sen', 'Mukherjee', 'Das', 'Pillai',
  'Menon', 'Hegde', 'Gowda', 'Bose', 'Chatterjee', 'Dubey', 'Trivedi', 'Pandey', 'Mishra', 'Kapoor'
];

const CITIES = [
  { city: 'Bengaluru', state: 'KA', pincode: '560038', area: 'Indiranagar' },
  { city: 'Bengaluru', state: 'KA', pincode: '560034', area: 'Koramangala' },
  { city: 'Bengaluru', state: 'KA', pincode: '560001', area: 'Lavelle Road' },
  { city: 'Mumbai', state: 'MH', pincode: '400050', area: 'Bandra West' },
  { city: 'Mumbai', state: 'MH', pincode: '400076', area: 'Powai' },
  { city: 'Delhi', state: 'DL', pincode: '110017', area: 'Hauz Khas' },
  { city: 'Delhi', state: 'DL', pincode: '110024', area: 'Lajpat Nagar' },
  { city: 'Hyderabad', state: 'TG', pincode: '500081', area: 'HITEC City' },
  { city: 'Hyderabad', state: 'TG', pincode: '500034', area: 'Banjara Hills' },
  { city: 'Pune', state: 'MH', pincode: '411006', area: 'Kalyani Nagar' },
  { city: 'Chennai', state: 'TN', pincode: '600028', area: 'R.A. Puram' },
  { city: 'Kolkata', state: 'WB', pincode: '700019', area: 'Ballygunge' }
];

const PRODUCTS = [
  { itemName: 'Classic Cotton Oversized Shirt', itemSku: 'SKU-SHIRT-BLK-M', itemDetails: 'Size: M • Color: Jet Black • Qty: 1', price: 2499 },
  { itemName: 'Relaxed Fit Linen Trousers', itemSku: 'SKU-TRSR-BGE-32', itemDetails: 'Size: 32 • Color: Beige • Qty: 1', price: 1899 },
  { itemName: 'Merino Wool Blend Cardigan', itemSku: 'SKU-KNT-NAVY-L', itemDetails: 'Size: L • Color: Navy • Qty: 1', price: 3299 },
  { itemName: 'Minimalist White Sneakers', itemSku: 'SKU-SNK-WHT-42', itemDetails: 'Size: 42 • Color: Crisp White • Qty: 1', price: 2499 },
  { itemName: 'Structured Tan Leather Handbag', itemSku: 'SKU-BAG-TAN-01', itemDetails: 'Material: Full Grain Leather • Color: Tan • Qty: 1', price: 3999 },
  { itemName: 'Heavyweight Cotton Crewneck T-Shirt', itemSku: 'SKU-TEE-GRY-M', itemDetails: 'Size: M • Color: Charcoal Grey • Qty: 1', price: 1299 },
  { itemName: 'Structured Slim Blazer', itemSku: 'SKU-BLZR-GRY-40', itemDetails: 'Size: 40 • Color: Slate Grey • Qty: 1', price: 4199 }
];

const PAYMENT_METHODS = ['UPI', 'CREDIT_CARD', 'NET_BANKING', 'DEBIT_CARD'];

// Simple seeded pseudo-random number generator for 100% deterministic repeatable generation
function createSeededRandom(seed = 123456789) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Main Dataset Generator Function
// ---------------------------------------------------------------------------

export function generateFitResQDataset(randomSeed = 42) {
  const rand = createSeededRandom(randomSeed);

  const choose = (arr) => arr[Math.floor(rand() * arr.length)];
  const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
  const pad = (n, width = 3) => String(n).padStart(width, '0');

  const customers = [];
  const orders = [];
  const refunds = [];
  const cases = [];
  const messages = [];

  // Base dates reference
  const START_EPOCH = new Date('2025-10-01T00:00:00Z').getTime();
  const END_EPOCH = new Date('2026-09-01T00:00:00Z').getTime();
  const randomDateIso = (start = START_EPOCH, end = END_EPOCH) => {
    const time = start + rand() * (end - start);
    return new Date(time).toISOString();
  };

  // =========================================================================
  // 1. GENERATE 100 CUSTOMERS (CUS-001 to CUS-100)
  // =========================================================================
  for (let i = 1; i <= 100; i++) {
    const userId = `CUS-${pad(i, 3)}`;
    let firstName, lastName;

    if (i === 1) {
      // Primary demo customer reserved for Swara / primary user
      firstName = 'Swara';
      lastName = 'Joshi';
    } else {
      firstName = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
      lastName = LAST_NAMES[(i * 11) % LAST_NAMES.length];
    }

    const safeUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${pad(i, 3)}`;
    const email = `customer${pad(i, 3)}@fitresq.demo`;
    const phone = `+91 9${randInt(1000, 9999)} ${randInt(10000, 99999)}`;
    const createdAt = randomDateIso(START_EPOCH, START_EPOCH + (i * 2.5 * 86400000));
    const updatedAt = new Date(new Date(createdAt).getTime() + randInt(1, 30) * 86400000).toISOString();

    customers.push({
      userId,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      role: 'CUSTOMER',
      cognitoSub: null, // Left null for synthetic customers; mapped when authenticated
      createdAt,
      updatedAt,
    });
  }

  // =========================================================================
  // 2. GENERATE ORDERS (target ~320 orders, range 250-400)
  // =========================================================================
  let orderCounter = 10001;

  // Preserve existing CUS-001 orders from backend records
  const existingCus1Orders = [
    { orderId: 'ORD-10021', date: '2026-08-28T10:15:00Z', total: 2499, itemIdx: 0, status: 'DELIVERED', refundEligible: true },
    { orderId: 'ORD-10055', date: '2026-08-15T14:30:00Z', total: 3299, itemIdx: 2, status: 'DELIVERED', refundEligible: true },
    { orderId: 'ORD-10101', date: '2026-08-20T09:00:00Z', total: 1899, itemIdx: 1, status: 'DELIVERED', refundEligible: true },
    { orderId: 'ORD-10102', date: '2026-08-22T16:45:00Z', total: 1299, itemIdx: 5, status: 'DELIVERED', refundEligible: true },
    { orderId: 'ORD-10010', date: '2026-07-10T11:20:00Z', total: 3999, itemIdx: 4, status: 'DELIVERED', refundEligible: false },
  ];

  // Helper to generate an address
  const getAddress = (loc) => `Flat ${randInt(101, 908)}, Building ${String.fromCharCode(65 + randInt(0, 5))}, ${loc.area}, ${loc.city}, ${loc.state} ${loc.pincode}`;

  // Assign orders to each customer
  customers.forEach((cust, index) => {
    const loc = CITIES[index % CITIES.length];
    let custOrdersCount;

    if (cust.userId === 'CUS-001') {
      // Add predefined CUS-001 orders
      existingCus1Orders.forEach((eo) => {
        const prod = PRODUCTS[eo.itemIdx];
        orders.push({
          orderId: eo.orderId,
          userId: cust.userId,
          orderDate: eo.date,
          items: [{ ...prod, quantity: 1, refundAmount: prod.price }],
          totalAmount: eo.total,
          currency: 'INR',
          paymentMethod: 'UPI',
          orderStatus: eo.status,
          deliveryStatus: 'DELIVERED',
          deliveryAddress: getAddress(loc),
          createdAt: eo.date,
          updatedAt: eo.date,
        });
      });
      return;
    }

    // Varied distribution: 1 to 6 orders per customer
    // index % 5 gives: 1, 2, 3, 4, 5, etc.
    const distRoll = rand();
    if (distRoll < 0.10) custOrdersCount = 1;
    else if (distRoll < 0.35) custOrdersCount = 2;
    else if (distRoll < 0.65) custOrdersCount = 3;
    else if (distRoll < 0.85) custOrdersCount = 4;
    else if (distRoll < 0.95) custOrdersCount = 5;
    else custOrdersCount = 6;

    for (let o = 0; o < custOrdersCount; o++) {
      // Avoid colliding with reserved order IDs
      while ([10021, 10055, 10101, 10102, 10010].includes(orderCounter)) {
        orderCounter++;
      }
      const orderId = `ORD-${orderCounter++}`;

      const itemCount = rand() < 0.75 ? 1 : randInt(2, 3);
      const chosenProducts = [];
      let totalAmount = 0;

      for (let it = 0; it < itemCount; it++) {
        const p = choose(PRODUCTS);
        chosenProducts.push({
          itemName: p.itemName,
          itemSku: p.itemSku,
          itemDetails: p.itemDetails,
          quantity: 1,
          price: p.price,
          refundAmount: p.price,
        });
        totalAmount += p.price;
      }

      const orderDate = randomDateIso(new Date(cust.createdAt).getTime(), END_EPOCH);
      const payMethod = choose(PAYMENT_METHODS);

      const statusRoll = rand();
      let orderStatus, deliveryStatus;
      if (statusRoll < 0.65) {
        orderStatus = 'DELIVERED';
        deliveryStatus = 'DELIVERED';
      } else if (statusRoll < 0.80) {
        orderStatus = 'SHIPPED';
        deliveryStatus = rand() < 0.5 ? 'IN_TRANSIT' : 'OUT_FOR_DELIVERY';
      } else if (statusRoll < 0.92) {
        orderStatus = 'PROCESSING';
        deliveryStatus = 'PENDING';
      } else {
        orderStatus = 'CANCELLED';
        deliveryStatus = 'RETURNED';
      }

      orders.push({
        orderId,
        userId: cust.userId,
        orderDate,
        items: chosenProducts,
        totalAmount,
        currency: 'INR',
        paymentMethod: payMethod,
        orderStatus,
        deliveryStatus,
        deliveryAddress: getAddress(loc),
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }
  });

  // =========================================================================
  // 3. GENERATE REFUNDS (target ~115 refunds, range 80-150)
  // =========================================================================
  let refundCounter = 90001;

  // Preserve existing CUS-001 live refund
  refunds.push({
    orderId: 'ORD-10021', // Partition key in FitResQRefunds
    refundId: 'RF-90001',
    userId: 'CUS-001',
    caseId: 'FR-1F40B7F5',
    amount: '2499',
    currency: 'INR',
    status: 'PROCESSING',
    paymentMethod: 'UPI',
    upiId: 'customer001@okhdfcbank',
    initiatedAt: '2026-08-29T10:30:00Z',
    expectedBy: '2026-09-03T10:30:00Z',
    updatedAt: '2026-09-01T18:00:00Z',
  });

  // Pick candidates for refunds from delivered or cancelled orders
  // Exclude ORD-10021 since it's already added
  const refundCandidates = orders.filter(
    (o) => o.orderId !== 'ORD-10021' && (o.orderStatus === 'DELIVERED' || o.orderStatus === 'CANCELLED')
  );

  // Target exactly 114 additional refunds -> 115 total
  const targetAdditionalRefunds = 114;
  const step = refundCandidates.length / targetAdditionalRefunds;

  for (let r = 0; r < targetAdditionalRefunds; r++) {
    const candidateIdx = Math.floor(r * step) % refundCandidates.length;
    const order = refundCandidates[candidateIdx];
    refundCounter++;

    const refundId = `RF-${refundCounter}`;
    const initiatedTime = new Date(new Date(order.orderDate).getTime() + randInt(2, 7) * 86400000);
    const expectedTime = new Date(initiatedTime.getTime() + 48 * 3600000);
    const updatedTime = new Date(initiatedTime.getTime() + randInt(12, 72) * 3600000);

    const rStatusRoll = rand();
    let rStatus;
    if (rStatusRoll < 0.55) rStatus = 'COMPLETED';
    else if (rStatusRoll < 0.75) rStatus = 'PROCESSING';
    else if (rStatusRoll < 0.87) rStatus = 'INITIATED';
    else if (rStatusRoll < 0.94) rStatus = 'DELAYED';
    else rStatus = 'FAILED';

    const refundRecord = {
      orderId: order.orderId,
      refundId,
      userId: order.userId,
      amount: String(order.items[0]?.refundAmount || order.totalAmount),
      currency: 'INR',
      status: rStatus,
      paymentMethod: order.paymentMethod,
      initiatedAt: initiatedTime.toISOString(),
      expectedBy: expectedTime.toISOString(),
      updatedAt: updatedTime.toISOString(),
    };

    if (order.paymentMethod === 'UPI') {
      const upiProvider = choose(['okhdfcbank', 'okaxis', 'oksbi', 'icici', 'paytm']);
      refundRecord.upiId = `${order.userId.toLowerCase()}@${upiProvider}`;
    }

    refunds.push(refundRecord);
  }

  // Map orderId -> refund for case cross-linking
  const orderRefundMap = new Map();
  refunds.forEach((ref) => {
    orderRefundMap.set(ref.orderId, ref);
  });

  // =========================================================================
  // 4. GENERATE CASES (target ~145 cases, range 100-200)
  // =========================================================================

  // Preserve existing 7 CUS-001 cases from live backend
  const existingCus1Cases = [
    {
      caseId: 'FR-1F40B7F5',
      userId: 'CUS-001',
      orderId: 'ORD-10021',
      category: 'REFUND_DELAY',
      priority: 'HIGH',
      status: 'ESCALATED',
      sentiment: 'NEGATIVE',
      description: 'My refund has not arrived yet.',
      escalationLevel: '1',
      createdAt: '2026-09-01T16:51:52.821353+00:00',
      updatedAt: '2026-09-07T17:31:21.920930+00:00',
    },
    {
      caseId: 'FR-7D002B18',
      userId: 'CUS-001',
      orderId: 'ORD-10055',
      category: 'REFUND_DELAY',
      priority: 'MEDIUM',
      status: 'OPEN',
      sentiment: 'UNKNOWN',
      description: 'I returned my product but my refund is still pending.',
      escalationLevel: '0',
      createdAt: '2026-09-01T17:27:07.474851+00:00',
      updatedAt: '2026-09-01T17:27:07.474851+00:00',
    },
    {
      caseId: 'FR-32534B62',
      userId: 'CUS-001',
      orderId: 'ORD-10021',
      category: 'REFUND_DELAY',
      priority: 'MEDIUM',
      status: 'OPEN',
      sentiment: 'UNKNOWN',
      description: 'My refund has not arrived yet.',
      escalationLevel: '0',
      createdAt: '2026-09-01T16:59:43.064588+00:00',
      updatedAt: '2026-09-01T16:59:43.064588+00:00',
    },
    {
      caseId: 'FR-648D23C3',
      userId: 'CUS-001',
      orderId: 'ORD-10055',
      category: 'REFUND_DELAY',
      priority: 'MEDIUM',
      status: 'OPEN',
      sentiment: 'UNKNOWN',
      description: 'I returned my product but my refund is still pending.',
      escalationLevel: '0',
      createdAt: '2026-09-01T17:24:23.893825+00:00',
      updatedAt: '2026-09-01T17:24:23.893825+00:00',
    },
    {
      caseId: 'FR-10001',
      userId: 'CUS-001',
      orderId: 'ORD-10021',
      category: 'REFUND_DELAY',
      priority: 'HIGH',
      status: 'OPEN',
      sentiment: 'NEGATIVE',
      description: 'My refund has not arrived yet.',
      slaDeadline: '2026-09-02T16:05:00Z',
      escalationLevel: '0',
      createdAt: '2026-09-01T16:05:00Z',
      updatedAt: '2026-09-01T16:05:00Z',
    },
    {
      caseId: 'FR-EDF067FF',
      userId: 'CUS-001',
      orderId: 'ORD-10102',
      category: 'REFUND_DELAY',
      priority: 'MEDIUM',
      status: 'OPEN',
      sentiment: 'UNKNOWN',
      description: 'I am still waiting for my refund.',
      escalationLevel: '0',
      createdAt: '2026-09-02T11:15:46.533233+00:00',
      updatedAt: '2026-09-02T11:15:46.533233+00:00',
    },
    {
      caseId: 'FR-10D468D0',
      userId: 'CUS-001',
      orderId: 'ORD-10101',
      category: 'REFUND_DELAY',
      priority: 'MEDIUM',
      status: 'OPEN',
      sentiment: 'UNKNOWN',
      description: 'My refund is still pending and I need an update.',
      escalationLevel: '0',
      createdAt: '2026-09-02T11:05:48.667306+00:00',
      updatedAt: '2026-09-02T11:05:48.667306+00:00',
    },
  ];

  cases.push(...existingCus1Cases);

  const CASE_TEMPLATES = [
    {
      category: 'REFUND_DELAY',
      desc: (oid, refId) => `Return package verified at hub for order ${oid}, but refund ${refId || ''} is taking longer than the 24h SLA.`,
      priority: 'HIGH',
      sentiment: 'NEGATIVE',
    },
    {
      category: 'REFUND_STATUS',
      desc: (oid) => `Checking the bank clearance and UPI settlement status for order ${oid}.`,
      priority: 'MEDIUM',
      sentiment: 'NEUTRAL',
    },
    {
      category: 'RETURN_ISSUE',
      desc: (oid) => `Received incorrect size for order ${oid}. Requesting reverse courier pickup and size replacement.`,
      priority: 'MEDIUM',
      sentiment: 'NEUTRAL',
    },
    {
      category: 'ORDER_STATUS',
      desc: (oid) => `Order ${oid} shows in-transit for over 4 days with no updated courier scan.`,
      priority: 'LOW',
      sentiment: 'NEUTRAL',
    },
    {
      category: 'DELIVERY_DELAY',
      desc: (oid) => `Delivery for order ${oid} was scheduled yesterday but courier marked delivery attempt failed without contacting me.`,
      priority: 'HIGH',
      sentiment: 'NEGATIVE',
    },
    {
      category: 'PAYMENT_ISSUE',
      desc: (oid) => `Double debit occurred on my credit card during checkout for order ${oid}.`,
      priority: 'HIGH',
      sentiment: 'NEGATIVE',
    },
  ];

  // Target exactly 138 additional cases -> 145 total cases
  const targetAdditionalCases = 138;
  let caseIdCounter = 20000;

  for (let c = 0; c < targetAdditionalCases; c++) {
    // Select customer (from CUS-002 through CUS-100 to give good coverage)
    const custIndex = (c % 99) + 1;
    const cust = customers[custIndex];

    // Find orders for this customer
    const custOrders = orders.filter((o) => o.userId === cust.userId);
    const order = custOrders.length > 0 ? custOrders[c % custOrders.length] : null;

    const associatedRefund = order ? orderRefundMap.get(order.orderId) : null;
    const tpl = associatedRefund ? CASE_TEMPLATES[0] : choose(CASE_TEMPLATES);

    const hexCode = Math.floor(rand() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
    const caseId = `FR-${hexCode}`;

    const orderDateEpoch = order ? new Date(order.orderDate).getTime() : new Date(cust.createdAt).getTime();
    const createdAtTime = new Date(orderDateEpoch + randInt(2, 10) * 86400000);
    const updatedTime = new Date(createdAtTime.getTime() + randInt(4, 48) * 3600000);
    const deadlineTime = new Date(createdAtTime.getTime() + 24 * 3600000);

    const statusRoll = rand();
    let status;
    if (statusRoll < 0.45) status = 'RESOLVED';
    else if (statusRoll < 0.70) status = 'IN_PROGRESS';
    else if (statusRoll < 0.90) status = 'OPEN';
    else status = 'ESCALATED';

    const caseRecord = {
      caseId,
      userId: cust.userId,
      orderId: order ? order.orderId : undefined,
      category: tpl.category,
      priority: tpl.priority,
      status,
      sentiment: tpl.sentiment,
      description: tpl.desc(order ? order.orderId : 'ORD-PENDING', associatedRefund?.refundId),
      escalationLevel: status === 'ESCALATED' ? '1' : '0',
      slaDeadline: deadlineTime.toISOString(),
      createdAt: createdAtTime.toISOString(),
      updatedAt: updatedTime.toISOString(),
    };

    cases.push(caseRecord);

    // If there is an associated refund, link it back to this case
    if (associatedRefund && !associatedRefund.caseId) {
      associatedRefund.caseId = caseId;
    }
  }

  // =========================================================================
  // 5. GENERATE MESSAGES (target ~420 messages, range 300-600)
  // =========================================================================

  // Preserve existing messages for FR-1F40B7F5
  const existingMessagesCus1 = [
    {
      caseId: 'FR-1F40B7F5',
      messageKey: '2026-09-02T14:00:01Z#MSG-001',
      sender: 'CUSTOMER',
      message: 'Hello, I raised a return for order ORD-10021 due to a defect on the collar seam. When will my refund arrive?',
      createdAt: '2026-09-02T14:00:01Z',
      userId: 'CUS-001',
    },
    {
      caseId: 'FR-1F40B7F5',
      messageKey: '2026-09-02T14:00:05Z#MSG-002',
      sender: 'AI_SUPPORT',
      message: 'Hello! Your return request for order ORD-10021 has been registered under Case FR-1F40B7F5. Refunds are triggered once intake is verified.',
      createdAt: '2026-09-02T14:00:05Z',
    },
    {
      caseId: 'FR-1F40B7F5',
      messageKey: '2026-09-05T17:33:17.999949+00:00#MSG-578F8E',
      sender: 'CUSTOMER',
      message: "I still haven't received my refund.",
      createdAt: '2026-09-05T17:33:17.999949+00:00',
      userId: 'CUS-001',
    },
    {
      caseId: 'FR-1F40B7F5',
      messageKey: '2026-09-05T17:40:52.018082+00:00#MSG-0FD639',
      sender: 'CUSTOMER',
      message: "I still haven't received my refund.",
      createdAt: '2026-09-05T17:40:52.018082+00:00',
      userId: 'CUS-001',
    },
    {
      caseId: 'FR-1F40B7F5',
      messageKey: '2026-09-07T17:31:19.916556+00:00#MSG-2672BC',
      sender: 'CUSTOMER',
      message: 'Checking status on my refund from frontend test.',
      createdAt: '2026-09-07T17:31:19.916556+00:00',
      userId: 'CUS-001',
    },
    {
      caseId: 'FR-1F40B7F5',
      messageKey: '2026-09-07T17:31:20.232114+00:00#MSG-FC644B',
      sender: 'CUSTOMER',
      message: 'Checking status on my refund from frontend test.',
      createdAt: '2026-09-07T17:31:20.232114+00:00',
      userId: 'CUS-001',
    },
  ];

  messages.push(...existingMessagesCus1);

  // Remaining cases to add messages to (144 cases).
  // Target: total messages ~420. Existing: 6. Need ~414 messages.
  // 414 / 144 ≈ ~2.87 messages per case.
  const otherCases = cases.filter((c) => c.caseId !== 'FR-1F40B7F5');
  let msgSeq = 100;

  otherCases.forEach((kase, idx) => {
    // Generate 2 to 4 messages per case
    const msgCount = (idx % 3 === 0) ? 4 : (idx % 2 === 0 ? 3 : 2);
    const caseStart = new Date(kase.createdAt).getTime();

    // Message 1: Customer opening
    msgSeq++;
    const t1 = new Date(caseStart);
    const key1 = `${t1.toISOString()}#MSG-${pad(msgSeq, 4)}`;
    messages.push({
      caseId: kase.caseId,
      messageKey: key1,
      sender: 'CUSTOMER',
      message: kase.description,
      createdAt: t1.toISOString(),
      userId: kase.userId,
    });

    // Message 2: AI Support instant response
    msgSeq++;
    const t2 = new Date(caseStart + 60000); // 1 min later
    const key2 = `${t2.toISOString()}#MSG-${pad(msgSeq, 4)}`;
    messages.push({
      caseId: kase.caseId,
      messageKey: key2,
      sender: 'AI_SUPPORT',
      message: `Hello! I have reviewed your case regarding ${kase.category.replace(/_/g, ' ').toLowerCase()}. Our resolution guarantee is active under the 24-hour SLA window.`,
      createdAt: t2.toISOString(),
    });

    if (msgCount >= 3) {
      // Message 3: Agent update
      msgSeq++;
      const t3 = new Date(caseStart + randInt(3600000, 14400000));
      const key3 = `${t3.toISOString()}#MSG-${pad(msgSeq, 4)}`;
      messages.push({
        caseId: kase.caseId,
        messageKey: key3,
        sender: 'AGENT',
        message: kase.status === 'RESOLVED'
          ? 'We have verified the resolution with the logistics and banking network. Your request has been successfully closed.'
          : 'A support specialist has taken ownership of this inquiry and contacted our fulfillment partner.',
        createdAt: t3.toISOString(),
      });
    }

    if (msgCount >= 4) {
      // Message 4: Final customer acknowledgment or system resolution
      msgSeq++;
      const t4 = new Date(caseStart + randInt(18000000, 36000000));
      const key4 = `${t4.toISOString()}#MSG-${pad(msgSeq, 4)}`;
      messages.push({
        caseId: kase.caseId,
        messageKey: key4,
        sender: kase.status === 'RESOLVED' ? 'SYSTEM' : 'CUSTOMER',
        message: kase.status === 'RESOLVED'
          ? 'System SLA Update: Case closed within target SLA resolution window. Satisfaction score recorded.'
          : 'Thank you for following up. Please let me know as soon as the status changes.',
        createdAt: t4.toISOString(),
      });
    }
  });

  return {
    customers,
    orders,
    refunds,
    cases,
    messages,
    summary: {
      customerCount: customers.length,
      orderCount: orders.length,
      refundCount: refunds.length,
      caseCount: cases.length,
      messageCount: messages.length,
    },
  };
}

// Export dataset to disk if executed as CLI
if (process.argv[1] && process.argv[1].endsWith('generate-dataset.js')) {
  console.log('Generating FitResQ synthetic dataset...');
  const dataset = generateFitResQDataset();

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, 'customers.json'), JSON.stringify(dataset.customers, null, 2));
  fs.writeFileSync(path.join(dataDir, 'orders.json'), JSON.stringify(dataset.orders, null, 2));
  fs.writeFileSync(path.join(dataDir, 'refunds.json'), JSON.stringify(dataset.refunds, null, 2));
  fs.writeFileSync(path.join(dataDir, 'cases.json'), JSON.stringify(dataset.cases, null, 2));
  fs.writeFileSync(path.join(dataDir, 'messages.json'), JSON.stringify(dataset.messages, null, 2));
  fs.writeFileSync(path.join(dataDir, 'all-seed-data.json'), JSON.stringify(dataset, null, 2));

  console.log('✔ Dataset successfully generated and written to backend/data:');
  console.log(`   Customers: ${dataset.summary.customerCount}`);
  console.log(`   Orders:    ${dataset.summary.orderCount}`);
  console.log(`   Refunds:   ${dataset.summary.refundCount}`);
  console.log(`   Cases:     ${dataset.summary.caseCount}`);
  console.log(`   Messages:  ${dataset.summary.messageCount}`);
}

export default generateFitResQDataset;
