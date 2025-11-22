import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useUser } from '../../api/users';
import { getRoleLabel, getStatusLabel, getStatusColor } from '../../types/enums';

export default function ProfilePage() {
  const currentUser = useSelector(selectUser);
  const { data: fullUserData, isLoading } = useUser(currentUser?.id || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "New passwords don't match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    // Mock API call
    console.log('Changing password for user:', currentUser?.id, { currentPassword, newPassword });
    
    // Simulate success
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 500);
  };

  if (!currentUser || isLoading) {
    return <div className="p-6">Loading profile...</div>;
  }

  const user = fullUserData || currentUser;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* User Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {getRoleLabel(user.role)}
                </span>
                {fullUserData?.status && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fullUserData.status)}`}>
                    {getStatusLabel(fullUserData.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* User Details */}
        <div className="p-6 sm:p-8 bg-gray-50/50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Phone Number</label>
              <p className="mt-1 text-gray-900">{fullUserData?.phoneNumber || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Position</label>
              <p className="mt-1 text-gray-900">{fullUserData?.position || '—'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">User ID</label>
              <p className="mt-1 text-gray-900 text-sm font-mono">{user.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Member Since</label>
              <p className="mt-1 text-gray-900">
                {fullUserData?.createdAt ? new Date(fullUserData.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Companies */}
        {fullUserData?.companies && fullUserData.companies.length > 0 && (
          <div className="p-6 sm:p-8 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Companies</h3>
            <div className="flex flex-wrap gap-2">
              {fullUserData.companies.map((company: any) => (
                <span
                  key={company.id}
                  className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700"
                >
                  {company.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Devices */}
        {fullUserData?.devices && fullUserData.devices.length > 0 && (
          <div className="p-6 sm:p-8 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Devices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fullUserData.devices.map((device: any) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-900">{device.name}</p>
                    <p className="text-xs text-gray-500">SN: {device.serialNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 bg-gray-50/50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
          
          <form onSubmit={handleSubmit} className="max-w-md space-y-4">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
