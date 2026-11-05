
import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';

// ==========================================
// SUPABASE CONNECTION
// ==========================================

const supabase = createClient(
  'https://tanttewulnmduvdgtlpc.supabase.co',
  'sb_publishable_tGr1jHlbMZU_HN2CD8PTEw_-rXLw_nY'
);

// ==========================================
// TYPES
// ==========================================

type Shipment = {
  id: string;
  tracking_number: string;
  merchant_id: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  parcel_description: string;
  cod_amount: number;
  delivery_charges: number;
  status: string;
  created_at: string;
};

type TrackingHistory = {
  id: string;
  shipment_id: string;
  status: string;
  location: string | null;
  description: string | null;
  created_at: string;
};

// ==========================================
// STATUSES
// ==========================================

const STATUSES = [
  'pending',
  'booked',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'returned',
  'cancelled',
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  booked: 'Booked',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  booked: '#2563eb',
  picked_up: '#7c3aed',
  in_transit: '#0891b2',
  out_for_delivery: '#ea580c',
  delivered: '#16a34a',
  returned: '#64748b',
  cancelled: '#dc2626',
};

// ==========================================
// EMPTY FORM
// ==========================================

const emptyForm = {
  sender_name: '',
  sender_phone: '',
  sender_address: '',
  receiver_name: '',
  receiver_phone: '',
  receiver_address: '',
  parcel_description: '',
  cod_amount: '0',
  delivery_charges: '0',
};

// ==========================================
// STYLES
// ==========================================

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily: 'Arial, sans-serif',
    color: '#172033',
  },

  header: {
    background: '#10233f',
    color: 'white',
    padding: '20px 25px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 15,
  },

  content: {
    maxWidth: 1250,
    padding: 22,
    margin: 'auto',
  },

  card: {
    background: 'white',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 2px 10px #0000000b',
    marginBottom: 20,
  },

  input: {
    width: '100%',
    padding: 12,
    border: '1px solid #cbd5e1',
    borderRadius: 7,
    boxSizing: 'border-box',
    marginTop: 6,
    fontSize: 14,
  },

  label: {
    display: 'block',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 7,
  },

  button: {
    background: '#087eeb',
    color: 'white',
    border: 0,
    padding: '12px 18px',
    borderRadius: 7,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 14,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 850,
  },

  th: {
    padding: 13,
    background: '#eaf2fa',
    textAlign: 'left',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },

  td: {
    padding: 13,
    borderBottom: '1px solid #e2e8f0',
    fontSize: 13,
  },
};

// ==========================================
// MAIN APP
// ==========================================

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [history, setHistory] = useState<TrackingHistory[]>([]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedShipment, setSelectedShipment] =
    useState<Shipment | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);

  // ========================================
  // AUTHENTICATION
  // ========================================

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setMessage(error.message);
        return;
      }

      setSession(data.session);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, newSession) => {
        if (mounted) {
          setSession(newSession);
        }
      });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ========================================
  // LOAD SHIPMENTS
  // ========================================

  async function loadShipments() {
    if (!session) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setMessage('Loading failed: ' + error.message);
      return;
    }

    setShipments((data || []) as Shipment[]);
  }

  useEffect(() => {
    if (session) {
      loadShipments();
    } else {
      setShipments([]);
    }
  }, [session]);

  // ========================================
  // LOGIN
  // ========================================

  async function login(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage('Login failed: ' + error.message);
    }
  }

  // ========================================
  // LOGOUT
  // ========================================

  async function logout() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      setMessage('Logout failed: ' + error.message);
      return;
    }

    setShipments([]);
    setHistory([]);
    setMessage('');
  }

  // ========================================
  // GENERATE TRACKING NUMBER
  // ========================================

  function generateTrackingNumber() {
    return (
      'MTC' +
      Date.now().toString() +
      Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
    );
  }

  // ========================================
  // BOOK NEW SHIPMENT
  // ========================================

  async function addShipment(e: FormEvent) {
    e.preventDefault();

    if (!session?.user?.id) {
      setMessage('Please login first.');
      return;
    }

    setLoading(true);
    setMessage('');

    const trackingNumber = generateTrackingNumber();

    const { error } = await supabase
      .from('shipments')
      .insert({
        ...form,
        merchant_id: session.user.id,
        tracking_number: trackingNumber,
        status: 'pending',
        cod_amount: Number(form.cod_amount),
        delivery_charges: Number(form.delivery_charges),
      });

    setLoading(false);

    if (error) {
      setMessage('Booking failed: ' + error.message);
      return;
    }

    setMessage(
      'Shipment booked successfully! Tracking ID: ' + trackingNumber
    );

    setForm(emptyForm);
    setShowForm(false);

    await loadShipments();
  }

  // ========================================
  // UPDATE SHIPMENT STATUS
  // ========================================

  async function updateShipmentStatus(
    shipmentId: string,
    newStatus: string
  ) {
    if (!STATUSES.includes(newStatus)) return;

    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('shipments')
      .update({ status: newStatus })
      .eq('id', shipmentId);

    setLoading(false);

    if (error) {
      setMessage('Status update failed: ' + error.message);
      return;
    }

    setMessage('Shipment status updated successfully!');

    await loadShipments();
  }

  // ========================================
  // LOAD TRACKING HISTORY
  // ========================================

  async function loadHistory(shipment: Shipment) {
    setSelectedShipment(shipment);
    setShowHistory(true);
    setHistory([]);
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('shipment_tracking')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setMessage('History loading failed: ' + error.message);
      return;
    }

    setHistory((data || []) as TrackingHistory[]);
  }

  // ========================================
  // FILTER SHIPMENTS
  // ========================================

  const filteredShipments = shipments.filter((s) => {
    const query = search.toLowerCase();

    const matchesSearch =
      String(s.tracking_number || '').toLowerCase().includes(query) ||
      String(s.receiver_name || '').toLowerCase().includes(query) ||
      String(s.receiver_phone || '').includes(query) ||
      String(s.sender_name || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ========================================
  // DASHBOARD STATISTICS
  // ========================================

  const total = shipments.length;

  const pending = shipments.filter(s =>
    !['delivered', 'returned', 'cancelled'].includes(s.status)
  ).length;

  const delivered = shipments.filter(
    s => s.status === 'delivered'
  ).length;

  const cod = shipments.reduce(
    (sum, s) => sum + Number(s.cod_amount || 0),
    0
  );

  const stats = [
    {
      title: 'Total Shipments',
      value: total,
      color: '#087eeb',
    },
    {
      title: 'Pending Parcels',
      value: pending,
      color: '#f59e0b',
    },
    {
      title: 'Delivered',
      value: delivered,
      color: '#16a34a',
    },
    {
      title: 'Total COD',
      value: 'Rs. ' + cod.toLocaleString(),
      color: '#7c3aed',
    },
  ];

  // ========================================
  // LOGIN SCREEN
  // ========================================

  if (!session) {
    return (
      <div
        style={{
          ...styles.page,
          display: 'grid',
          placeItems: 'center',
          padding: 20,
        }}
      >
        <form
          onSubmit={login}
          style={{
            ...styles.card,
            width: '100%',
            maxWidth: 400,
            boxSizing: 'border-box',
          }}
        >
          <h1
            style={{
              color: '#087eeb',
              textAlign: 'center',
              letterSpacing: 2,
            }}
          >
            MTC CARGO
          </h1>

          <p style={{ textAlign: 'center', color: '#64748b' }}>
            Courier Management System
          </p>

          <hr />

          <h3>Admin Login</h3>

          <label style={styles.label}>Email Address</label>

          <input
            style={styles.input}
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter admin email"
          />

          <br /><br />

          <label style={styles.label}>Password</label>

          <input
            style={styles.input}
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
          />

          <br /><br />

          <button
            style={{
              ...styles.button,
              width: '100%',
              opacity: loading ? 0.6 : 1,
            }}
            disabled={loading}
          >
            {loading ? 'Please Wait...' : 'Login to Dashboard'}
          </button>

          {message && (
            <p style={{ color: '#dc2626', fontSize: 13 }}>
              {message}
            </p>
          )}

          <p
            style={{
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 12,
              marginTop: 25,
            }}
          >
            MTC Cargo © 2026
          </p>
        </form>
      </div>
    );
  }

  // ========================================
  // MAIN DASHBOARD
  // ========================================

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0, letterSpacing: 2 }}>
            MTC CARGO
          </h2>

          <small>Courier Management System</small>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            style={styles.button}
            onClick={loadShipments}
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            onClick={logout}
            disabled={loading}
            style={{
              ...styles.button,
              background: '#dc2626',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={styles.content}>

        {/* WELCOME */}

        <h1>Admin Dashboard</h1>

        <p style={{ color: '#64748b' }}>
          Welcome, {session.user.email}
        </p>

        {/* STATISTICS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
            gap: 15,
            marginBottom: 25,
          }}
        >
          {stats.map((stat) => (
            <div key={stat.title} style={styles.card}>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                {stat.title}
              </p>

              <h2
                style={{
                  color: stat.color,
                  fontSize: 26,
                  margin: 0,
                }}
              >
                {stat.value}
              </h2>
            </div>
          ))}
        </div>

        {/* MESSAGES */}

        {message && (
          <div
            style={{
              ...styles.card,
              color:
                /failed|error/i.test(message)
                  ? '#dc2626'
                  : '#087e50',
            }}
          >
            {message}

            <button
              onClick={() => setMessage('')}
              style={{
                float: 'right',
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* NEW SHIPMENT */}

        <div style={styles.card}>
          <button
            style={styles.button}
            onClick={() => {
              setShowForm(!showForm);
              setMessage('');
            }}
          >
            {showForm ? 'Close Booking Form' : '+ Book New Shipment'}
          </button>

          {showForm && (
            <form onSubmit={addShipment}>
              <h2>New Shipment Booking</h2>

              <h3 style={{ color: '#087eeb' }}>
                Sender Details
              </h3>

              {([
                ['sender_name', 'Sender Name'],
                ['sender_phone', 'Sender Phone'],
                ['sender_address', 'Sender Address'],
              ] as const).map(([key, label]) => (
                <div key={key} style={{ marginBottom: 15 }}>
                  <label style={styles.label}>{label}</label>

                  <input
                    style={styles.input}
                    required
                    value={form[key]}
                    onChange={e =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={label}
                  />
                </div>
              ))}

              <hr />

              <h3 style={{ color: '#087eeb' }}>
                Receiver Details
              </h3>

              {([
                ['receiver_name', 'Receiver Name'],
                ['receiver_phone', 'Receiver Phone'],
                ['receiver_address', 'Receiver Address'],
              ] as const).map(([key, label]) => (
                <div key={key} style={{ marginBottom: 15 }}>
                  <label style={styles.label}>{label}</label>

                  <input
                    style={styles.input}
                    required
                    value={form[key]}
                    onChange={e =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={label}
                  />
                </div>
              ))}

              <hr />

              <h3 style={{ color: '#087eeb' }}>
                Parcel & Payment Details
              </h3>

              {([
                ['parcel_description', 'Parcel Description'],
                ['cod_amount', 'COD Amount (PKR)'],
                ['delivery_charges', 'Delivery Charges (PKR)'],
              ] as const).map(([key, label]) => (
                <div key={key} style={{ marginBottom: 15 }}>
                  <label style={styles.label}>{label}</label>

                  <input
                    style={styles.input}
                    type={
                      key === 'parcel_description'
                        ? 'text'
                        : 'number'
                    }
                    min={key === 'parcel_description' ? undefined : '0'}
                    step={key === 'parcel_description' ? undefined : 'any'}
                    required={key !== 'parcel_description'}
                    value={form[key]}
                    onChange={e =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={label}
                  />
                </div>
              ))}

              <button
                type="submit"
                style={styles.button}
                disabled={loading}
              >
                {loading ? 'Booking...' : 'Confirm Shipment Booking'}
              </button>
            </form>
          )}
        </div>

        {/* SHIPMENT MANAGEMENT */}

        <div style={styles.card}>
          <h2>Shipment Management</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <input
              style={styles.input}
              placeholder="Search Tracking ID, Name or Phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select
              style={styles.input}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>

              {STATUSES.map(status => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <p style={{ color: '#64748b', fontSize: 13 }}>
            Showing {filteredShipments.length} of {total} shipments
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    'Tracking ID',
                    'Receiver',
                    'Phone',
                    'COD',
                    'Status',
                    'History',
                  ].map(item => (
                    <th key={item} style={styles.th}>
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredShipments.map(s => (
                  <tr key={s.id}>

                    <td style={styles.td}>
                      <strong>{s.tracking_number || 'N/A'}</strong>
                    </td>

                    <td style={styles.td}>
                      {s.receiver_name}
                    </td>

                    <td style={styles.td}>
                      {s.receiver_phone}
                    </td>

                    <td style={styles.td}>
                      Rs. {Number(s.cod_amount || 0).toLocaleString()}
                    </td>

                    <td style={styles.td}>
                      <select
                        value={
                          STATUSES.includes(s.status)
                            ? s.status
                            : 'pending'
                        }
                        disabled={loading}
                        onChange={e =>
                          updateShipmentStatus(s.id, e.target.value)
                        }
                        style={{
                          padding: 8,
                          borderRadius: 7,
                          border: '1px solid #cbd5e1',
                          background: 'white',
                          color: STATUS_COLORS[s.status] || '#172033',
                          fontWeight: 'bold',
                        }}
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.button,
                          padding: '8px 12px',
                          fontSize: 12,
                          background: '#10233f',
                        }}
                        onClick={() => loadHistory(s)}
                        disabled={loading}
                      >
                        View History
                      </button>
                    </td>

                  </tr>
                ))}

                {filteredShipments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 30,
                        textAlign: 'center',
                        color: '#64748b',
                      }}
                    >
                      No shipments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRACKING HISTORY */}

        {showHistory && (
          <div style={styles.card}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <h2>Shipment Tracking History</h2>

              <button
                style={{
                  ...styles.button,
                  background: '#dc2626',
                }}
                onClick={() => {
                  setShowHistory(false);
                  setSelectedShipment(null);
                  setHistory([]);
                }}
              >
                Close
              </button>
            </div>

            {selectedShipment && (
              <div>
                <p>
                  <strong>Tracking ID:</strong>{' '}
                  {selectedShipment.tracking_number}
                </p>

                <p>
                  <strong>Receiver:</strong>{' '}
                  {selectedShipment.receiver_name}
                </p>

                <p>
                  <strong>Current Status:</strong>{' '}
                  {STATUS_LABELS[selectedShipment.status] ||
                    selectedShipment.status}
                </p>
              </div>
            )}

            <hr />

            {loading ? (
              <p>Loading tracking history...</p>
            ) : history.length > 0 ? (
              history.map(item => (
                <div
                  key={item.id}
                  style={{
                    borderLeft: '4px solid #087eeb',
                    padding: '10px 15px',
                    marginBottom: 15,
                    background: '#f8fafc',
                    borderRadius: 5,
                  }}
                >
                  <strong
                    style={{
                      color: STATUS_COLORS[item.status] || '#172033',
                    }}
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </strong>

                  <p style={{ margin: '7px 0' }}>
                    {item.description || 'Shipment status updated'}
                  </p>

                  {item.location && (
                    <p style={{ color: '#64748b', fontSize: 13 }}>
                      Location: {item.location}
                    </p>
                  )}

                  <small style={{ color: '#64748b' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </small>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b' }}>
                No tracking history available.
              </p>
            )}
          </div>
        )}

        {/* FOOTER */}

        <p
          style={{
            textAlign: 'center',
            color: '#64748b',
            padding: 20,
            fontSize: 13,
          }}
        >
          MTC Cargo © 2026 | Courier Management System
        </p>

      </main>
    </div>
  );
}
