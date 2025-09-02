import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package, CreditCard, Home, ShoppingBag } from 'lucide-react';

const OrderSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Order Placed Successfully!</CardTitle>
            <p className="text-gray-600">
              Thank you for your order. We've received your payment details and will process your order shortly.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Order Reference</p>
                <p className="font-mono text-lg font-semibold">#{orderId.slice(0, 8)}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Payment Verification</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Our team will verify your payment and update the order status within 24 hours.
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-800">Order Processing</h3>
                </div>
                <p className="text-sm text-purple-700">
                  Once payment is confirmed, we'll prepare your items for shipment.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">What's Next?</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• You'll receive an email confirmation shortly</li>
                <li>• We'll notify you when payment is verified</li>
                <li>• Shipping details will be sent once order is dispatched</li>
                <li>• Track your order anytime from your profile</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => navigate('/')} 
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/orders')}
                className="flex-1"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                View My Orders
              </Button>
            </div>

            <div className="text-sm text-gray-500 pt-4 border-t">
              <p>Need help? Contact our support team:</p>
              <p className="font-medium">support@switchgearshop.com | +91-XXXX-XXXXXX</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderSuccessPage;