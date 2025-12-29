import { useState, useEffect } from 'react';
import { Dialog, Menu } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  fuelType?: string;
}

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentVehicleId, setCurrentVehicleId] = useState<string | null>(null);

  const token = localStorage.getItem('idToken');

  useEffect(() => {
    console.log('Token:', token ? 'exists' : 'missing');
    setCurrentVehicleId(localStorage.getItem('currentVehicleId'));
  }, [token]);

  const fetchVehicles = async () => {
    if (!token) {
      setError('Not authenticated. Please login.');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setVehicles(data.vehicles || []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editingId 
      ? `${import.meta.env.VITE_API_URL}/vehicles/${editingId}`
      : `${import.meta.env.VITE_API_URL}/vehicles`;
    
    await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...formData, year: parseInt(formData.year) })
    });
    
    setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' });
    setShowForm(false);
    setEditingId(null);
    setLoading(false);
    fetchVehicles();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({ 
      make: vehicle.make, 
      model: vehicle.model, 
      year: vehicle.year.toString(), 
      licensePlate: vehicle.licensePlate || '',
      fuelType: vehicle.fuelType || 'Regular'
    });
    setEditingId(vehicle.vehicleId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`${import.meta.env.VITE_API_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowDeleteDialog(false);
    setDeleteId(null);
    fetchVehicles();
  };

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Vehicles</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ make: '', model: '', year: '', licensePlate: '', fuelType: 'Regular' }); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
          {showForm ? 'Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {showForm && (
        <Dialog open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold text-white mb-4">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</Dialog.Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Make" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} required className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  <input type="text" placeholder="Model" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  <input type="number" placeholder="Year" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                  <input type="text" placeholder="License Plate" value={formData.licensePlate} onChange={(e) => setFormData({...formData, licensePlate: e.target.value})} className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <select value={formData.fuelType} onChange={(e) => setFormData({...formData, fuelType: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
                  <option>Regular</option>
                  <option>Premium</option>
                  <option>Diesel</option>
                </select>
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">
                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Cancel</button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      <div className="grid gap-4">
        {vehicles.map((v) => (
          <div 
            key={v.vehicleId} 
            onClick={() => {
              localStorage.setItem('currentVehicleId', v.vehicleId);
              setCurrentVehicleId(v.vehicleId);
              window.dispatchEvent(new Event('currentVehicleChanged'));
            }}
            className={`bg-slate-800 p-6 rounded-lg flex items-start justify-between cursor-pointer hover:bg-slate-750 ${
            v.vehicleId === currentVehicleId ? 'ring-2 ring-indigo-500' : ''
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="currentVehicle"
                checked={v.vehicleId === currentVehicleId}
                onChange={() => {}}
                className="mt-1 h-5 w-5 text-indigo-500 focus:ring-indigo-500 pointer-events-none"
              />
              <div>
                <h3 className="text-xl font-bold text-white">{v.year} {v.make} {v.model}</h3>
                <p className="text-slate-400">{v.licensePlate} • {v.fuelType}</p>
              </div>
            </div>
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 hover:bg-slate-700 rounded-lg" onClick={(e) => e.stopPropagation()}>
                <EllipsisVerticalIcon className="h-6 w-6 text-slate-400" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg border border-slate-600 focus:outline-none z-10">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate(`/refills/${v.vehicleId}`)}
                      className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white rounded-t-lg`}
                    >
                      View Refills
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleEdit(v)}
                      className={`${active ? 'bg-slate-600' : ''} w-full text-left px-4 py-2 text-white`}
                    >
                      Edit
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => { setDeleteId(v.vehicleId); setShowDeleteDialog(true); }}
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
        {vehicles.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-400">
            <p>No vehicles yet. Add your first vehicle to get started!</p>
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-slate-800 rounded-lg p-6 w-full max-w-sm">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Delete Vehicle</Dialog.Title>
            <p className="text-slate-300 mb-6">Are you sure you want to delete this vehicle? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
              <button onClick={() => setShowDeleteDialog(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Cancel</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
