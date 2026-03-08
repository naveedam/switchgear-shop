import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Users, Tag, Eye, RefreshCw, Send, UserPlus, Clock, FileText, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
  first_quote_at: string | null;
  notification_sent_at: string | null;
  notification_opened_at: string | null;
  notification_channel: string | null;
  seller: { name: string; email: string } | null;
}

interface SellerOption {
  id: string;
  name: string;
  email: string;
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
  admin_review: 'bg-purple-100 text-purple-800',
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
  const [availableSellers, setAvailableSellers] = useState<SellerOption[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [invitingManually, setInvitingManually] = useState(false);
  const [resending, setResending] = useState(false);

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

      // Load available sellers not yet invited
      const invitedIds = (data || []).map((d: any) => d.seller_id);
      const { data: sellers } = await supabase
        .from('companies')
        .select('id, name, email')
        .eq('is_vendor', true)
        .eq('status', 'active');

      setAvailableSellers(
        (sellers || []).filter((s: any) => !invitedIds.includes(s.id)) as SellerOption[]
      );
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleViewDetails = (rfq: RfqRow) => {
    setSelectedRfq(rfq);
    setSelectedSellerId('');
    loadInvitations(rfq.id);
  };

  const handleManualInvite = async () => {
    if (!selectedRfq || !selectedSellerId) return;
    setInvitingManually(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('rfq_seller_invitations')
        .insert({
          rfq_id: selectedRfq.id,
          seller_id: selectedSellerId,
          status: 'pending',
          routing_method: 'admin_manual',
          notification_sent_at: now,
          notification_channel: 'in_app',
        });
      if (error) throw error;

      // Create in-app notification for the seller
      await supabase.from('notifications').insert({
        user_id: selectedSellerId,
        title: `New RFQ: ${selectedRfq.rfq_number}`,
        message: `You've been invited to quote on "${selectedRfq.title}" (${selectedRfq.total_items} items). View and submit your quote now.`,
        type: 'rfq_invitation',
      });

      toast({ title: 'Seller Invited', description: 'Seller has been invited and notified.' });
      await loadInvitations(selectedRfq.id);
      setSelectedSellerId('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to invite seller', variant: 'destructive' });
    } finally {
      setInvitingManually(false);
    }
  };

  const handleResendRfq = async () => {
    if (!selectedRfq) return;
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('route-rfq-sellers', {
        body: { rfqId: selectedRfq.id },
      });
      if (error) throw error;
      toast({
        title: 'RFQ Re-routed',
        description: `${data?.sellers_invited || 0} additional sellers invited.`,
      });
      await loadInvitations(selectedRfq.id);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to re-route RFQ', variant: 'destructive' });
    } finally {
      setResending(false);
    }
  };

  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch =
      rfq.rfq_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary stats
  const totalRfqs = rfqs.length;
  const openRfqs = rfqs.filter(r => r.status === 'open').length;
  const awaitingQuotes = rfqs.filter(r => r.status === 'partially_quoted').length;
  const convertedRfqs = rfqs.filter(r => r.status === 'converted').length;
  const adminReview = rfqs.filter(r => r.status === 'admin_review').length;

  // Response time metrics for selected RFQ
  const respondedInvites = invitations.filter(i => i.first_quote_at);
  const avgResponseTime = respondedInvites.length > 0
    ? respondedInvites.reduce((sum, i) => {
        const diff = new Date(i.first_quote_at!).getTime() - new Date(i.invited_at).getTime();
        return sum + diff;
      }, 0) / respondedInvites.length / (1000 * 60 * 60) // hours
    : null;
  const quoteRate = invitations.length > 0
    ? Math.round((respondedInvites.length / invitations.length) * 100)
    : 0;

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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{totalRfqs}</p>
                <p className="text-xs text-muted-foreground">Total RFQs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{openRfqs}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-xl font-bold">{awaitingQuotes}</p>
                <p className="text-xs text-muted-foreground">Awaiting Quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xl font-bold">{convertedRfqs}</p>
                <p className="text-xs text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {adminReview > 0 && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xl font-bold">{adminReview}</p>
                  <p className="text-xs text-muted-foreground">Needs Routing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
            <SelectItem value="admin_review">Admin Review</SelectItem>
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
        <DialogContent className="max-w-3xl">
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
                  <p className="font-medium">{invitations.length} sellers</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p><Badge className={statusColors[selectedRfq.status]}>{selectedRfq.status.replace('_', ' ')}</Badge></p>
                </div>
              </div>

              {/* Response Time Metrics */}
              {invitations.length > 0 && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg Response Time:</span>
                    <p className="font-medium">
                      {avgResponseTime !== null ? `${avgResponseTime.toFixed(1)} hours` : 'No responses yet'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quote Rate:</span>
                    <p className="font-medium">{quoteRate}% ({respondedInvites.length}/{invitations.length})</p>
                  </div>
                </div>
              )}

              {/* Manual Invite */}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select value={selectedSellerId} onValueChange={setSelectedSellerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seller to invite..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSellers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>
                      ))}
                      {availableSellers.length === 0 && (
                        <SelectItem value="none" disabled>No available sellers</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={handleManualInvite}
                  disabled={!selectedSellerId || invitingManually}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {invitingManually ? 'Inviting...' : 'Invite'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendRfq}
                  disabled={resending}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {resending ? 'Routing...' : 'Re-route'}
                </Button>
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
                      <TableHead>Notified</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Invited</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                              {inv.routing_method === 'category_auto' ? 'Auto' :
                               inv.routing_method === 'admin_manual' ? 'Manual' :
                               inv.routing_method || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {inv.notification_sent_at ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                ✓ {format(new Date(inv.notification_sent_at), 'dd MMM HH:mm')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">Not sent</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={inviteStatusColors[inv.status] || ''}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {inv.first_quote_at
                              ? formatDistanceToNow(new Date(inv.first_quote_at), { addSuffix: false })
                              : inv.status === 'responded' && inv.responded_at
                                ? formatDistanceToNow(new Date(inv.responded_at), { addSuffix: false })
                                : '-'}
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
