import { useState, useEffect } from 'react';
import { Dialog, Menu } from '@headlessui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface Refill {
  refillId: string;
  odometer: number;
  volume: number;
  pricePerUnit: number;
  totalCost: number;
  currency: string;
  fuelType: string;
  station?: string;
  createdAt: string;
}

export default function Refills() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const currentVehicleId = vehicleId || localStorage.getItem('currentVehicleId');

  useEffect(() => {
    if (vehicleId) {
      localStorage.setItem('currentVehicleId', vehicleId);
    } else if (!currentVehicleId) {
      navigate('/vehicles');
    }
  }, [vehicleId, currentVehicleId, navigate]);
  const [refills, setRefills] = useState<Refill[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    odometer: '', 
    volume: '', 
    pricePerUnit: '', 
    totalCost: '', 
    currency: 'USD', 
    fuelType: 'Regular',
    station: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('idToken');

  const fetchRefills = async () => {
    if (!token || !currentVehicleId) {
      setError('Not authenticated or vehicle not selected');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/vehicles/${currentVehicleId}/refills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setRefills(data.refills || []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchRefills(); }, [currentVehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const url = editingId 
      ? `${import.meta.env.VITE_API_URL}/vehicles/${currentVehicleId}/refills/${editingId}`
      : `${import.meta.env.VITE_API_URL}/vehicles/${currentVehicleId}/refills`;
    
    await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ 
        odometer: parseFloat(formData.odometer),
        volume: parseFloat(formData.volume),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalCost: parseFloat(formData.totalCost),
        currency: formData.currency,
        fuelType: formData.fuelType,
        station: formData.station
      })
    });
    
    setFormData({ odometer: '', volume: '', pricePerUnit: '', totalCost: '', currency: 'USD', fuelType: 'Regular', station: '' });
    setShowForm(false);
    setEditingId(null);
    setLoading(false);
    fetchRefills();
  };

  const handleEdit = (refill: Refill) => {
    setFormData({ 
      odometer: refill.odometer.toString(),
      volume: refill.volume.toString(),
      pricePerUnit: refill.pricePerUnit.toString(),
      totalCost: refill.totalCost.toString(),
      currency: refill.currency,
      fuelType: refill.fuelType,
      station: refill.station || ''
    });
    setEditingId(refill.refillId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${import.meta.env.VITE_API_URL}/vehicles/${currentVehicleId}/refills/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowDeleteDialog(false);
    setDeleteId(null);
    fetchRefills();
  };

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Refills</h1>
        <button 
          onClick={() => { 
            setShowForm(!showForm); 
            setEditingId(null); 
            setFormData({ odometer: '', volume: '', pricePerUnit: '', totalCost: '', currency: 'USD', fuelType: 'Regular', station: '' }); 
          }} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          {showForm ? 'Cancel' : '+ Add Refill'}
        </button>
      </div>

      {showForm && (
        <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold text-white mb-4">
                {editingId ? 'Edit Refill' : 'Add Refill'}
              </Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Odometer" 
                    value={formData.odometer} 
                    onChange={(e) => setFormData({...formData, odometer: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Volume (L)" 
                    value={formData.volume} 
                    onChange={(e) => setFormData({...formData, volume: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Price/Unit" 
                    value={formData.pricePerUnit} 
                    onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Total Cost" 
                    value={formData.totalCost} 
                    onChange={(e) => setFormData({...formData, totalCost: e.target.value})} 
                    required 
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                  />
                </div>
                <select 
                  value={formData.fuelType} 
                  onChange={(e) => setFormData({...formData, fuelType: e.target.value})} 
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option>Regular</option>
                  <option>Premium</option>
                  <option>Diesel</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Station (optional)" 
                  value={formData.station} 
                  onChange={(e) => setFormData({...formData, station: e.target.value})} 
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" 
                />
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingId(null); }} 
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      <div className="grid gap-4">
        {refills.map((r) => (
          <div key={r.refillId} className="bg-slate-800 p-6 rounded-lg flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white">{r.volume}L @ {r.pricePerUnit} {r.currency}/L</h3>
              <p className="text-slate-400">Odometer: {r.odometer} km • Total: {r.totalCost} {r.currency}</p>
              <p className="text-slate-500 text-sm">{r.fuelType} {r.station ? `• ${r.station}` : ''}</p>
            </div>
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg">
                <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleEdit(r)}
                      className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}
                    >
                      Edit
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => { setDeleteId(r.refillId); setShowDeleteDialog(true); }}
                      className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-red-400 rounded-b-lg`}
                    >
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        ))}
        {refills.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-400">
            <p>No refills yet. Add your first refill to get started!</p>
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Delete Refill</Dialog.Title>
            <p className="text-slate-300 mb-6">Are you sure you want to delete this refill? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => deleteId && handleDelete(deleteId)} 
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete
              </button>
              <button 
                onClick={() => setShowDeleteDialog(false)} 
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
