import { useState, useCallback, useContext } from 'react';
import { api } from '../constants/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ----- Types -----
export interface Ride {
  _id: string;
  clientId: string | { _id: string; name: string; phone: string };
  driverId?: string | { _id: string; name: string; phone: string };
  fromLocation: string;
  toLocation: string;
  passengers: number;
  type: 'instant' | 'scheduled';
  scheduledAt?: string;
  status: string;
  fare?: number;
  note?: string;
  createdAt: string;
}

export interface BookRideData {
  fromLocation: string;
  toLocation: string;
  passengers: number;
  type: 'instant' | 'scheduled';
  scheduledAt?: string;
}

export interface EarningsResponse {
  totalEarnings: number;
  count: number;
  rides: Ride[];
}

export const useRide = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [rides, setRides] = useState<Ride[]>([]);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ---- Client actions ----
  const bookRide = useCallback(async (data: BookRideData): Promise<Ride> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: res } = await api.post('/rides', data);
      showToast({ message: 'Ride booked successfully!', type: 'success' });
      return res.ride;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to book ride.';
      setError(msg);
      showToast({ message: msg, type: 'error' });
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyRides = useCallback(async (): Promise<Ride[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = user?.role === 'driver' ? '/rides/driver/my-rides' : '/rides/my-rides';
      const { data } = await api.get(endpoint);
      setRides(data.rides);
      return data.rides as Ride[];
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load rides.';
      setError(msg);
      showToast({ message: msg, type: 'error' });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  // ---- Driver actions ----
  const fetchAvailableRides = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/rides/available');
      setAvailableRides(data.rides);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load available rides.';
      setError(msg);
      showToast({ message: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptRide = useCallback(async (rideId: string): Promise<Ride> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.patch(`/rides/${rideId}/accept`);
      setActiveRide(data.ride);
      showToast({ message: 'Ride accepted!', type: 'success' });
      return data.ride;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to accept ride.';
      setError(msg);
      showToast({ message: msg, type: 'error' });
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (rideId: string, status: string): Promise<Ride> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.patch(`/rides/${rideId}/status`, { status });
      setActiveRide(data.ride);
      showToast({ message: 'Status updated to: ' + status.replace(/_/g, ' '), type: 'success' });
      return data.ride;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update status.';
      setError(msg);
      showToast({ message: msg, type: 'error' });
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endRide = useCallback(async (rideId: string, fare: number, note?: string): Promise<Ride> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.patch(`/rides/${rideId}/end`, { fare, note });
      setActiveRide(data.ride);
      showToast({ message: 'Ride ended successfully.', type: 'success' });
      return data.ride;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to end ride.';
      setError(msg);
      showToast({ message: msg, type: 'error' });
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchEarnings = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/rides/driver/earnings', {
        params: { startDate, endDate },
      });
      setEarnings(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch earnings.';
      setError(msg);
      showToast({ message: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    rides,
    availableRides,
    activeRide,
    setActiveRide,
    earnings,
    isLoading,
    error,
    clearError,
    bookRide,
    fetchMyRides,
    fetchAvailableRides,
    acceptRide,
    updateStatus,
    endRide,
    fetchEarnings,
  };
};
