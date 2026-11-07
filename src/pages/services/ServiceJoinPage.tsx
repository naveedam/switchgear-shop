import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProviderForm from '@/components/services/ProviderForm';

const ServiceJoinPage: React.FC = () => {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="container-wide py-16 max-w-xl text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-2xl font-bold">Profile submitted</h1>
        <p className="mt-2 text-muted-foreground">
          We will contact you on WhatsApp to verify your details. Once verified, we send you jobs that match your trade and area.
        </p>
        <Button asChild variant="ghost" className="mt-6"><Link to="/services">Back to services</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-wide py-10 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold">Join as a skilled worker</h1>
      <p className="mt-1 mb-8 text-muted-foreground">Get work from businesses in Peenya. It is free to join. We will call you to verify your trade before you are listed.</p>
      <ProviderForm onSubmitted={() => setDone(true)} />
    </div>
  );
};

export default ServiceJoinPage;
