
import { useState } from 'react';
import type { FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tanttewulnmduvdgtlpc.supabase.co',
  'sb_publishable_tGr1jHlbMZU_HN2CD8PTEw_-rXLw_nY'
);

const labels: Record<string, string> = {
  pending: 'Pending',
  booked: 'Booked',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  returned: 'Returned',
  cancelled: 'Cancelled'
};

export default function Tracking() {
  const [number, setNumber] = useState('');
  const [shipment, setShipment] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function track(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setShipment(null);
    setHistory([]);

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id,tracking_number,receiver_name,status,created_at')
        .eq('tracking_number', number.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setMessage('Tracking number not found.');
        return;
      }

      setShipment(data);

      const { data: updates, error: historyError } =
        await supabase
          .from('shipment_tracking')
          .select('status,location,description,created_at')
          .eq('shipment_id', data.id)
          .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      setHistory(updates || []);
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f8fc',
      fontFamily: 'Arial, sans-serif',
      color: '#222'
    }}>
      <header style={{
        background: 'white',
        padding: '18px 6%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #eee'
      }}>
        <h2 style={{ color: '#D71920', margin: 0 }}>
          MTC <span style={{ color: '#1769AA' }}>CARGO</span>
        </h2>
        <a href="/" style={{
          color: '#1769AA',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>Home</a>
      </header>

      <main style={{
        maxWidth: 650,
        margin: '45px auto',
        padding: 20
      }}>
        <div style={{
          background: '#1769AA',
          color: 'white',
          padding: 30,
          borderRadius: '14px 14px 0 0',
          textAlign: 'center'
        }}>
          <h1>Track Your Shipment</h1>
          <p>Know where your parcel is right now.</p>
        </div>

        <div style={{
          background: 'white',
          padding: 25,
          borderRadius: '0 0 14px 14px',
          boxShadow: '0 5px 20px #00000010'
        }}>
          <form onSubmit={track}>
            <label style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: 10
            }}>
              Enter Tracking Number
            </label>

            <input
              value={number}
              onChange={e => setNumber(e.target.value)}
              placeholder="Example: MTC123456"
              required
              style={{
                width: '100%',
                padding: 14,
                boxSizing: 'border-box',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                marginBottom: 15
              }}
            />

            <button disabled={loading} style={{
              width: '100%',
              padding: 15,
              background: '#D71920',
              color: 'white',
              border: 0,
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              {loading ? 'Searching...' : 'TRACK PARCEL'}
            </button>
          </form>

          {message && (
            <p style={{ color: '#D71920', marginTop: 20 }}>
              {message}
            </p>
          )}

          {shipment && (
            <div style={{ marginTop: 25 }}>
              <h2 style={{ color: '#1769AA' }}>
                Shipment Details
              </h2>

              <p><b>Tracking ID:</b> {shipment.tracking_number}</p>
              <p><b>Receiver:</b> {shipment.receiver_name}</p>

              <p>
                <b>Status:</b>{' '}
                <span style={{
                  color: '#1769AA',
                  fontWeight: 'bold'
                }}>
                  {labels[shipment.status] || shipment.status}
                </span>
              </p>

              <hr />

              <h3 style={{ color: '#1769AA' }}>
                Tracking History
              </h3>

              {history.length === 0 ? (
                <p>No additional tracking updates available.</p>
              ) : history.map((item, index) => (
                <div key={index} style={{
                  borderLeft: '4px solid #D71920',
                  padding: 15,
                  marginBottom: 15,
                  background: '#f5f8fc',
                  borderRadius: 7
                }}>
                  <b style={{ color: '#1769AA' }}>
                    {labels[item.status] || item.status}
                  </b>

                  <p>{item.description || 'Status updated'}</p>

                  {item.location && (
                    <p>Location: {item.location}</p>
                  )}

                  <small>
                    {new Date(item.created_at).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: 20,
        color: '#64748b'
      }}>
        MTC Cargo © 2026
      </footer>
    </div>
  );
}
