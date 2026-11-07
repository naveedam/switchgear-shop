import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RequestForm from '@/components/services/RequestForm';
import { SERVICES_WA_NUMBER, waLink } from '@/services/servicesService';

const ServiceRequestPage: React.FC = () => {
  const [params] = useSearchParams();
  const [number, setNumber] = useState<string | null>(null);

  if (number) {
    return (
      <div className="container-wide py-16 max-w-xl text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-2xl font-bold">Request received</h1>
        <p className="mt-2 text-muted-foreground">
          Your reference is <span className="font-mono font-medium text-foreground">{number}</span>.
          We will call or WhatsApp you shortly, usually within a few hours on working days.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <a target="_blank" rel="noopener noreferrer" href={waLink(SERVICES_WA_NUMBER, `Hi, I just submitted service request ${number}.`)}>Message us on WhatsApp</a>
          </Button>
          <Button asChild variant="ghost"><Link to="/services">Back to services</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-10 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold">Request a skilled worker</h1>
      <p className="mt-1 mb-8 text-muted-foreground">Tell us the job. We will match a verified worker and confirm the rate with you before anyone is sent.</p>
      <RequestForm defaultTrade={params.get('trade') ?? ''} onSubmitted={setNumber} />
    </div>
  );
};

export default ServiceRequestPage;
