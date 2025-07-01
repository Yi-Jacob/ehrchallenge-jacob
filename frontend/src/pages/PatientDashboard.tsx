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

interface Therapist {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}
interface Appointment {
  id: string;
  tenant_id: string;
  patient_id: string;
  therapist_id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient_first_name: string;
  patient_last_name: string;
  therapist_first_name: string;
  therapist_last_name: string;
}
interface Note {
  id: string;
  tenant_id: string;
  patient_id: string;
  therapist_id: string;
  appointment_id?: string;
  note_type: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  is_signed: boolean;
  signed_at?: string;
  created_at: string;
  updated_at: string;
  patient_first_name: string;
  patient_last_name: string;
  therapist_first_name: string;
  therapist_last_name: string;
}

const PatientDashboard: React.FC = () => {
  const { tenant_domain } = useParams();
  const [tab, setTab] = useState(0);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all therapists
  useEffect(() => {
    if (tab === 0) {
      setLoading(true);
      setError('');
      api.get(`/api/auth/usersbyrole?role=THERAPIST`, {
        headers: { 'X-Tenant-Domain': tenant_domain },
      })
        .then(res => setTherapists(res.data))
        .catch(err => setError(err.response?.data?.error || 'Failed to fetch therapists'))
        .finally(() => setLoading(false));
    }
  }, [tab, tenant_domain]);

  // Fetch appointments
  useEffect(() => {
    if (tab === 1) {
      setLoading(true);
      setError('');
      // Get the current user (patient) from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      api.get(`/api/appointments`, {
        headers: { 'X-Tenant-Domain': tenant_domain }
      })
        .then(res => setAppointments(res.data))
        .catch(err => setError(err.response?.data?.error || 'Failed to fetch appointments'))
        .finally(() => setLoading(false));
    }
  }, [tab, tenant_domain]);

  // Fetch notes
  useEffect(() => {
    if (tab === 2) {
      setLoading(true);
      setError('');
      api.get(`/api/clinical-notes`, {
        headers: { 'X-Tenant-Domain': tenant_domain },
      })
        .then(res => setNotes(res.data))
        .catch(err => setError(err.response?.data?.error || 'Failed to fetch notes'))
        .finally(() => setLoading(false));
    }
  }, [tab, tenant_domain]);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Patient Dashboard</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All Therapists" />
        <Tab label="Appointments" />
        <Tab label="Notes" />
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {therapists.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.firstName}</TableCell>
                      <TableCell>{t.lastName}</TableCell>
                      <TableCell>{t.email}</TableCell>
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
                    <TableCell>Therapist</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.appointment_date).toLocaleString()}</TableCell>
                      <TableCell>{a.therapist_first_name} {a.therapist_last_name}</TableCell>
                      <TableCell>{a.status}</TableCell>
                      <TableCell>{a.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {tab === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Therapist</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Subjective</TableCell>
                    <TableCell>Assessment</TableCell>
                    <TableCell>Signed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notes.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>{new Date(n.created_at).toLocaleString()}</TableCell>
                      <TableCell>{n.therapist_first_name} {n.therapist_last_name}</TableCell>
                      <TableCell>{n.note_type}</TableCell>
                      <TableCell>{n.subjective}</TableCell>
                      <TableCell>{n.assessment}</TableCell>
                      <TableCell>{n.is_signed ? 'Yes' : 'No'}</TableCell>
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

export default PatientDashboard; 