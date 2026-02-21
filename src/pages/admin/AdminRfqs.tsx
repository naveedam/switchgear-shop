import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Users, Tag, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface RfqRow {
  id: string;
  rfq_number: string;
  title: string;
  status: string;
  total_items: number;
  quoted_items: number;
  categories_detected: string[];
  sellers_invited: number;
  created_at: string;
  expires_at: string | null;
  buyer: { name: string; email: string } | null;
}

interface InvitationRow {
  id: string;
  seller_id: string;
  status: string;
  matched_categories: string[];
  routing_method: string;
  routing_score: number;
  invited_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  seller: { name: string; email: string } | null;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  open: 'bg-blue-100 text-blue-800',
  quoted: 'bg-green-100 text-green-800',
  partially_quoted: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-muted text-muted-foreground',
  converted: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-red-100 text-red-800',
};

const inviteStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  viewed: 'bg-blue-100 text-blue-800',
  responded: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  expired: 'bg-muted text-muted-foreground',
};

const AdminRfqs: React.FC = () => {
  const [rfqs, setRfqs] = useState<RfqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRfq, setSelectedRfq] = useState<RfqRow | null>(null);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  useEffect(() => {
    loadRfqs();
  }, []);

  const loadRfqs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*, buyer:companies!rfqs_buyer_id_fkey(name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRfqs((data || []) as unknown as RfqRow[]);
    } catch (err) {
      console.error('Error loading RFQs:', err);
      toast({ title: 'Error', description: 'Failed to load RFQs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async (rfqId: string) => {
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('rfq_seller_invitations')
        .select('*, seller:companies!rfq_seller_invitations_seller_id_fkey(name, email)')
        .eq('rfq_id', rfqId)
        .order('routing_score', { ascending: false });

      if (error) throw error;
      setInvitations((data || []) as unknown as InvitationRow[]);
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleViewDetails = (rfq: RfqRow) => {
    setSelectedRfq(rfq);
    loadInvitations(rfq.id);
  };

  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch =
      rfq.rfq_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-6">Loading RFQs...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RFQ Management</h1>
          <p className="text-muted-foreground">Auto-routed RFQs with seller invitation tracking</p>
        </div>
        <Button onClick={loadRfqs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search RFQs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="partially_quoted">Partially Quoted</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* RFQ Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFQ #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Sellers Invited</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRfqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No RFQs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRfqs.map(rfq => (
                  <TableRow key={rfq.id}>
                    <TableCell className="font-mono text-sm">{rfq.rfq_number}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{rfq.title}</TableCell>
                    <TableCell className="text-sm">{rfq.buyer?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(rfq.categories_detected || []).slice(0, 3).map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {cat.replace(/-/g, ' ')}
                          </Badge>
                        ))}
                        {(rfq.categories_detected || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{rfq.categories_detected.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {rfq.sellers_invited || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>{rfq.total_items}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[rfq.status] || ''}>
                        {rfq.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(rfq.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetails(rfq)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedRfq} onOpenChange={() => setSelectedRfq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              RFQ {selectedRfq?.rfq_number} — Seller Invitations
            </DialogTitle>
          </DialogHeader>
          {selectedRfq && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Categories:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedRfq.categories_detected || []).map(cat => (
                      <Badge key={cat} variant="outline" className="text-xs">{cat.replace(/-/g, ' ')}</Badge>
                    ))}
                    {(!selectedRfq.categories_detected || selectedRfq.categories_detected.length === 0) && (
                      <span className="text-muted-foreground">None detected</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Invited:</span>
                  <p className="font-medium">{selectedRfq.sellers_invited || 0} sellers</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p><Badge className={statusColors[selectedRfq.status]}>{selectedRfq.status}</Badge></p>
                </div>
              </div>

              {loadingInvites ? (
                <p className="text-center text-muted-foreground py-4">Loading invitations...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Matched Categories</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No invitations
                        </TableCell>
                      </TableRow>
                    ) : (
                      invitations.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.seller?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(inv.matched_categories || []).map(c => (
                                <Badge key={c} variant="outline" className="text-xs">{c.replace(/-/g, ' ')}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {inv.routing_method === 'category_auto' ? 'Auto' : inv.routing_method || 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={inviteStatusColors[inv.status] || ''}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(inv.invited_at), 'dd MMM HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRfqs;
