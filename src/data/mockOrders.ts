
import { Order } from '@/types/order';

export const mockOrders: Order[] = [
    {
        id: 'ORD-2025-0001',
        buyerId: 'USR-001',
        buyerName: 'John Doe',
        sellerId: 'SEL-001',
        sellerName: 'Tech Emporium',
        items: [],
        subtotal: 499.99,
        tax: 39.99,
        shippingDetails: {
            address: { street: '123 Main St', city: 'Anytown', state: 'CA', zipCode: '12345', country: 'USA' },
            method: 'Standard Shipping',
            shippingCost: 15.00,
        },
        paymentDetails: {
            method: 'credit_card',
            status: 'completed',
            amount: 554.98,
            currency: 'USD'
        },
        totalAmount: 554.98,
        status: 'processing',
        createdAt: new Date('2025-06-12T14:48:00.000Z'),
        updatedAt: new Date('2025-06-12T14:48:00.000Z'),
    },
    {
        id: 'ORD-2025-0002',
        buyerId: 'USR-002',
        buyerName: 'Jane Smith',
        sellerId: 'SEL-002',
        sellerName: 'Fashion Forward',
        items: [],
        subtotal: 125.50,
        tax: 10.04,
        shippingDetails: {
            address: { street: '456 Oak Ave', city: 'Otherville', state: 'NY', zipCode: '54321', country: 'USA' },
            method: 'Express Shipping',
            shippingCost: 25.00,
        },
        paymentDetails: {
            method: 'credit_card',
            status: 'completed',
            amount: 160.54,
            currency: 'USD'
        },
        totalAmount: 160.54,
        status: 'shipped',
        createdAt: new Date('2025-06-11T10:20:00.000Z'),
        updatedAt: new Date('2025-06-11T18:00:00.000Z'),
    },
    {
        id: 'ORD-2025-0003',
        buyerId: 'USR-003',
        buyerName: 'Peter Jones',
        sellerId: 'SEL-001',
        sellerName: 'Tech Emporium',
        items: [],
        subtotal: 1299.00,
        tax: 103.92,
        shippingDetails: {
            address: { street: '789 Pine Ln', city: 'Sometown', state: 'TX', zipCode: '67890', country: 'USA' },
            method: 'Standard Shipping',
            shippingCost: 0.00,
        },
        paymentDetails: {
            method: 'credit_card',
            status: 'completed',
            amount: 1402.92,
            currency: 'USD'
        },
        totalAmount: 1402.92,
        status: 'delivered',
        createdAt: new Date('2025-06-05T09:05:00.000Z'),
        updatedAt: new Date('2025-06-08T11:45:00.000Z'),
    },
    {
        id: 'ORD-2025-0004',
        buyerId: 'USR-004',
        buyerName: 'Mary Brown',
        sellerId: 'SEL-003',
        sellerName: 'Home Goods Inc.',
        items: [],
        subtotal: 78.99,
        tax: 6.32,
        shippingDetails: {
            address: { street: '321 Maple Dr', city: 'Villagetown', state: 'FL', zipCode: '13579', country: 'USA' },
            method: 'Standard Shipping',
            shippingCost: 10.00,
        },
        paymentDetails: {
            method: 'credit_card',
            status: 'completed',
            amount: 95.31,
            currency: 'USD'
        },
        totalAmount: 95.31,
        status: 'canceled',
        createdAt: new Date('2025-06-10T16:30:00.000Z'),
        updatedAt: new Date('2025-06-10T17:00:00.000Z'),
    },
];
