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
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';

interface Patient {
  id: string;
  tenant_id: string;
  user_id?: string;
  firstName: string;
  lastName: string;
  date_of_birth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insuranceInfo?: string;
  medical_history?: string;
  created_at: string;
  updated_at: string;
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
  therapist_firstName: string;
  therapist_lastName: string;
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
  therapist_firstName: string;
  therapist_lastName: string;
}

interface AppointmentFormData {
  patient_id: string;
  appointment_date: string;
  duration_minutes: number;
  notes: string;
}

interface NoteFormData {
  patient_id: string;
  appointment_id?: string;
  note_type: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const TherapistDashboard: React.FC = () => {
  const { tenant_domain } = useParams();
  const [tab, setTab] = useState(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Appointment scheduling state
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData>({
    patient_id: '',
    appointment_date: '',
    duration_minutes: 60,
    notes: ''
  });
  const [savingAppointment, setSavingAppointment] = useState(false);

  // Clinical note creation state
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteForm, setNoteForm] = useState<NoteFormData>({
    patient_id: '',
    appointment_id: '',
    note_type: 'SOAP',
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [savingNote, setSavingNote] = useState(false);

  // Fetch all patients
  useEffect(() => {
    if (tab === 0) {
      setLoading(true);
      setError('');
      api.get(`/api/patients`, {
        headers: { 'X-Tenant-Domain': tenant_domain },
      })
        .then(res => setPatients(res.data))
        .catch(err => setError(err.response?.data?.error || 'Failed to fetch patients'))
        .finally(() => setLoading(false));
    }
  }, [tab, tenant_domain]);

  // Fetch appointments (for this therapist)
  useEffect(() => {
    if (tab === 1) {
      setLoading(true);
      setError('');
      api.get(`/api/appointments`, {
        headers: { 'X-Tenant-Domain': tenant_domain },
      })
        .then(res => setAppointments(res.data))
        .catch(err => setError(err.response?.data?.error || 'Failed to fetch appointments'))
        .finally(() => setLoading(false));
    }
  }, [tab, tenant_domain]);

  // Fetch notes (for this therapist)
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

  const handleScheduleAppointment = () => {
    setShowAppointmentDialog(true);
    // Set default date to current date + 1 hour
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    defaultDate.setMinutes(0);
    defaultDate.setSeconds(0);
    defaultDate.setMilliseconds(0);
    
    setAppointmentForm({
      patient_id: '',
      appointment_date: defaultDate.toISOString().slice(0, 16),
      duration_minutes: 60,
      notes: ''
    });
  };

  const handleCancelAppointment = () => {
    setShowAppointmentDialog(false);
    setAppointmentForm({
      patient_id: '',
      appointment_date: '',
      duration_minutes: 60,
      notes: ''
    });
  };

  const handleSaveAppointment = async () => {
    if (!appointmentForm.patient_id || !appointmentForm.appointment_date) {
      setError('Please fill in all required fields');
      return;
    }

    setSavingAppointment(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const appointmentData = {
        patient_id: appointmentForm.patient_id,
        appointment_date: new Date(appointmentForm.appointment_date).toISOString(),
        duration_minutes: appointmentForm.duration_minutes,
        notes: appointmentForm.notes,
        status: 'SCHEDULED'
      };

      await api.post('/api/appointments', appointmentData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Domain': tenant_domain,
        },
      });

      setShowAppointmentDialog(false);
      setAppointmentForm({
        patient_id: '',
        appointment_date: '',
        duration_minutes: 60,
        notes: ''
      });
      
      // Refresh appointments if we're on the appointments tab
      if (tab === 1) {
        const res = await api.get(`/api/appointments`, {
          headers: { 'X-Tenant-Domain': tenant_domain },
        });
        setAppointments(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule appointment');
    } finally {
      setSavingAppointment(false);
    }
  };

  const handleAddNote = () => {
    setShowNoteDialog(true);
    setNoteForm({
      patient_id: '',
      appointment_id: '',
      note_type: 'SOAP',
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    });
  };

  const handleCancelNote = () => {
    setShowNoteDialog(false);
    setNoteForm({
      patient_id: '',
      appointment_id: '',
      note_type: 'SOAP',
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    });
  };

  const handleSaveNote = async () => {
    if (!noteForm.patient_id || !noteForm.subjective || !noteForm.assessment) {
      setError('Please fill in all required fields (Patient, Subjective, and Assessment)');
      return;
    }

    setSavingNote(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const noteData = {
        patient_id: noteForm.patient_id,
        appointment_id: noteForm.appointment_id || undefined,
        note_type: noteForm.note_type,
        subjective: noteForm.subjective,
        objective: noteForm.objective,
        assessment: noteForm.assessment,
        plan: noteForm.plan
      };

      await api.post('/api/clinical-notes', noteData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Domain': tenant_domain,
        },
      });

      setShowNoteDialog(false);
      setNoteForm({
        patient_id: '',
        appointment_id: '',
        note_type: 'SOAP',
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      });
      
      // Refresh notes if we're on the notes tab
      if (tab === 2) {
        const res = await api.get(`/api/clinical-notes`, {
          headers: { 'X-Tenant-Domain': tenant_domain },
        });
        setNotes(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create clinical note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Therapist Dashboard</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All Patients" />
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
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleScheduleAppointment}
                >
                  Schedule Appointment
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Address</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patients.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.firstName} {p.lastName}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>{p.phone}</TableCell>
                        <TableCell>{p.gender}</TableCell>
                        <TableCell>{p.address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="secondary"
                  onClick={handleAddNote}
                >
                  Add Note
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{new Date(a.appointment_date).toLocaleString()}</TableCell>
                        <TableCell>{a.patient_first_name} {a.patient_last_name}</TableCell>
                        <TableCell>{a.status}</TableCell>
                        <TableCell>{a.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          {tab === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Patient</TableCell>
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
                      <TableCell>{n.patient_first_name} {n.patient_last_name}</TableCell>
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

      {/* Appointment Scheduling Dialog */}
      <Dialog open={showAppointmentDialog} onClose={handleCancelAppointment} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Patient</InputLabel>
                <Select
                  value={appointmentForm.patient_id}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, patient_id: e.target.value })}
                  label="Patient"
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Appointment Date & Time"
                value={appointmentForm.appointment_date}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Duration (minutes)</InputLabel>
                <Select
                  value={appointmentForm.duration_minutes}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, duration_minutes: e.target.value as number })}
                  label="Duration (minutes)"
                >
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={45}>45 minutes</MenuItem>
                  <MenuItem value={60}>60 minutes</MenuItem>
                  <MenuItem value={90}>90 minutes</MenuItem>
                  <MenuItem value={120}>120 minutes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAppointment} disabled={savingAppointment}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAppointment} 
            variant="contained" 
            disabled={savingAppointment}
          >
            {savingAppointment ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clinical Note Creation Dialog */}
      <Dialog open={showNoteDialog} onClose={handleCancelNote} maxWidth="md" fullWidth>
        <DialogTitle>Create Clinical Note</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Patient</InputLabel>
                <Select
                  value={noteForm.patient_id}
                  onChange={(e) => setNoteForm({ ...noteForm, patient_id: e.target.value })}
                  label="Patient"
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Appointment (Optional)</InputLabel>
                <Select
                  value={noteForm.appointment_id}
                  onChange={(e) => setNoteForm({ ...noteForm, appointment_id: e.target.value })}
                  label="Appointment (Optional)"
                >
                  <MenuItem value="">
                    <em>No appointment linked</em>
                  </MenuItem>
                  {appointments
                    .filter(appointment => !noteForm.patient_id || appointment.patient_id === noteForm.patient_id)
                    .map((appointment) => (
                      <MenuItem key={appointment.id} value={appointment.id}>
                        {new Date(appointment.appointment_date).toLocaleString()} - {appointment.patient_first_name} {appointment.patient_last_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Note Type</InputLabel>
                <Select
                  value={noteForm.note_type}
                  onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })}
                  label="Note Type"
                >
                  <MenuItem value="SOAP">SOAP</MenuItem>
                  <MenuItem value="PROGRESS">Progress</MenuItem>
                  <MenuItem value="ASSESSMENT">Assessment</MenuItem>
                  <MenuItem value="TREATMENT_PLAN">Treatment Plan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Subjective"
                value={noteForm.subjective}
                onChange={(e) => setNoteForm({ ...noteForm, subjective: e.target.value })}
                placeholder="Patient's reported symptoms and concerns..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Objective"
                value={noteForm.objective}
                onChange={(e) => setNoteForm({ ...noteForm, objective: e.target.value })}
                placeholder="Observations, vital signs, test results..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Assessment"
                value={noteForm.assessment}
                onChange={(e) => setNoteForm({ ...noteForm, assessment: e.target.value })}
                placeholder="Diagnosis, differential diagnosis..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Plan"
                value={noteForm.plan}
                onChange={(e) => setNoteForm({ ...noteForm, plan: e.target.value })}
                placeholder="Treatment plan, follow-up, medications..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNote} disabled={savingNote}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNote} 
            variant="contained" 
            disabled={savingNote}
          >
            {savingNote ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TherapistDashboard; 