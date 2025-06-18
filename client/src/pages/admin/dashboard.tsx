import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Settings, 
  LogOut, 
  Eye, 
  Check, 
  X, 
  Clock,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BetaSignup {
  id: number;
  name: string;
  phone: string;
  email: string;
  businessName: string;
  reraId: string;
  experience: string;
  workingRegions: string[];
  areaOfExpertise: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  notes?: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('signups');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin authentication
  const { data: adminData, isLoading: authLoading } = useQuery({
    queryKey: ['/api/secure-portal/me'],
    retry: false,
  });

  // Fetch beta signups
  const { data: signups, isLoading: signupsLoading } = useQuery({
    queryKey: ['/api/secure-portal/beta-signups'],
    enabled: !!adminData,
  });

  // Update signup status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await apiRequest("PUT", `/api/secure-portal/beta-signups/${id}`, { status, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secure-portal/beta-signups'] });
      toast({
        title: "Status Updated",
        description: "Beta signup status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/secure-portal/logout", {});
      return res.json();
    },
    onSuccess: () => {
      localStorage.removeItem('adminSessionToken');
      setLocation('/admin/login');
    }
  });

  useEffect(() => {
    if (!authLoading && !adminData) {
      setLocation('/admin/login');
    }
  }, [authLoading, adminData, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-white">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Verifying authentication...
        </div>
      </div>
    );
  }

  if (!adminData) {
    return null; // Will redirect to login
  }

  const handleStatusUpdate = (id: number, status: string, notes?: string) => {
    updateStatusMutation.mutate({ id, status, notes });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>;
    }
  };

  const getStats = () => {
    if (!signups || !Array.isArray(signups)) return { pending: 0, approved: 0, rejected: 0, total: 0 };
    
    return signups.reduce((acc: any, signup: BetaSignup) => {
      acc.total++;
      acc[signup.status]++;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0, total: 0 });
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-sm text-slate-400">Welcome, {adminData?.admin?.username}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-2xl font-bold text-white">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <span className="text-2xl font-bold text-white">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold text-white">{stats.approved}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-400" />
                <span className="text-2xl font-bold text-white">{stats.rejected}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="signups" className="data-[state=active]:bg-slate-700">
              Beta Signups
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signups" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Beta Signup Requests</CardTitle>
                <CardDescription className="text-slate-400">
                  Review and manage beta access requests from real estate brokers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : signups && Array.isArray(signups) && signups.length > 0 ? (
                  <div className="space-y-4">
                    {signups.map((signup: BetaSignup) => (
                      <div key={signup.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{signup.name}</h3>
                            <p className="text-sm text-slate-400">{signup.businessName}</p>
                          </div>
                          {getStatusBadge(signup.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Phone: <span className="text-white">{signup.phone}</span></p>
                            <p className="text-slate-400">Email: <span className="text-white">{signup.email}</span></p>
                            <p className="text-slate-400">RERA ID: <span className="text-white">{signup.reraId}</span></p>
                          </div>
                          <div>
                            <p className="text-slate-400">Experience: <span className="text-white">{signup.experience}</span></p>
                            <p className="text-slate-400">Regions: <span className="text-white">{signup.workingRegions?.join(', ')}</span></p>
                            <p className="text-slate-400">Expertise: <span className="text-white">{signup.areaOfExpertise?.join(', ')}</span></p>
                          </div>
                        </div>

                        {signup.status === 'pending' && (
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(signup.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={updateStatusMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(signup.id, 'rejected')}
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
                              disabled={updateStatusMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No beta signups found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Admin Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage admin account settings and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <h3 className="font-medium text-white">Security Notice</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                      Your admin session is secured with device fingerprinting and encrypted tokens. 
                      Always logout when using shared devices.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <h3 className="font-medium text-white mb-2">Session Information</h3>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>Username: <span className="text-white">{adminData?.admin?.username}</span></p>
                      <p>Email: <span className="text-white">{adminData?.admin?.email}</span></p>
                      <p>Device Status: <span className="text-green-400">Verified</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}