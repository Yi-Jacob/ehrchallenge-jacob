import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { tenant_domain } = useParams();
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all users
  useEffect(() => {
    if (tab === 0) {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      api.get(`/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Domain': tenant_domain,
        },
      })
        .then(res => setUsers(res.data))
        .catch(err => setError(err.response?.data?.error || 'Failed to fetch users'))
        .finally(() => setLoading(false));
    }
  }, [tab, tenant_domain]);

  // Fetch audit logs
  useEffect(() => {
    if (tab === 1) {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      api.get(`/api/audit`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Domain': tenant_domain,
        },
      })
        .then(res => setAuditLogs(res.data))
        .catch(err => setError(err.response?.data?.error || 'Failed to fetch audit logs'))
        .finally(() => setLoading(false));
    }
  }, [tab, tenant_domain]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All Users" />
        <Tab label="Audit Logs" />
      </Tabs>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {tab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {tab === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Record ID</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.tableName}</TableCell>
                      <TableCell>{log.userId || 'N/A'}</TableCell>
                      <TableCell>{log.recordId || 'N/A'}</TableCell>
                      <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Container>
  );
};

export default AdminDashboard; 