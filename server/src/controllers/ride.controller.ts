import { Request, Response } from 'express';
import { rideRepository } from '../repositories/ride.repository';
import { userRepository } from '../repositories/user.repository';
import { RideStatus } from '../models/ride.model';
import { sendToDevice, sendMulticast } from '../services/fcm.service';

// Valid status transitions for drivers
const STATUS_TRANSITIONS: Record<string, string> = {
  ACCEPTED: 'ON_THE_WAY',
  ON_THE_WAY: 'WAITING_FOR_PICKUP',
  WAITING_FOR_PICKUP: 'ONGOING_RIDE',
  ONGOING_RIDE: 'RIDE_ENDED',
};

/** Helper: safely get a string param from Express 5 params (can be string | string[]) */
const getParam = (req: Request, key: string): string => {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : (val as string);
};

/**
 * POST /api/rides
 * Client creates a new ride request and broadcasts to available drivers
 */
export const createRide = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromLocation, toLocation, passengers, type, scheduledAt } = req.body;

    if (!fromLocation || !toLocation || !passengers || !type) {
      res.status(400).json({ success: false, message: 'fromLocation, toLocation, passengers, and type are required.' });
      return;
    }

    if (type === 'scheduled' && !scheduledAt) {
      res.status(400).json({ success: false, message: 'scheduledAt is required for scheduled rides.' });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ride = await rideRepository.create({
      clientId: req.user!.id as unknown,
      fromLocation,
      toLocation,
      passengers: Number(passengers),
      type,
      scheduledAt: scheduledAt ? new Date(scheduledAt as string) : undefined,
      status: 'PENDING',
    } as any);

    // Broadcast FCM to all available drivers
    const availableDrivers = await userRepository.findAvailableDrivers();
    const driverTokens = availableDrivers
      .map((d) => d.fcmToken)
      .filter((t): t is string => !!t);

    if (driverTokens.length > 0) {
      // Build token→userId map so stale tokens can be auto-cleaned
      const userIdByToken: Record<string, string> = {};
      availableDrivers.forEach((d) => {
        if (d.fcmToken) userIdByToken[d.fcmToken] = String(d._id);
      });
      await sendMulticast(
        driverTokens,
        {
          title: '🚗 New Ride Request!',
          body: `${fromLocation} → ${toLocation} • ${passengers} passenger(s)`,
          data: { type: 'NEW_RIDE_REQUEST', rideId: String(ride._id) },
        },
        userIdByToken
      );
    }

    res.status(201).json({ success: true, ride });
  } catch (error) {
    console.error('CreateRide error:', error);
    res.status(500).json({ success: false, message: 'Server error creating ride.' });
  }
};

/**
 * GET /api/rides/available
 */
export const getAvailableRides = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rides = await rideRepository.findAvailableRides();
    res.json({ success: true, rides });
  } catch (error) {
    console.error('GetAvailableRides error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching available rides.' });
  }
};

/**
 * PATCH /api/rides/:id/accept
 */
export const acceptRide = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const driverId = req.user!.id;

    // Block if this driver already has a ride currently in-motion.
    // Future accepted scheduled rides do NOT count as blocking.
    const activeRide = await rideRepository.findDriverActiveRide(driverId);
    if (activeRide) {
      res.status(409).json({
        success: false,
        message: 'You already have an active ride in progress. Complete it before accepting a new one.',
      });
      return;
    }

    const ride = await rideRepository.acceptRide(id, driverId);
    if (!ride) {
      res.status(409).json({ success: false, message: 'Ride no longer available. Another driver accepted it.' });
      return;
    }

    // Notify client
    const client = await userRepository.findById(String(ride.clientId));
    if (client?.fcmToken) {
      const driver = await userRepository.findById(driverId);
      await sendToDevice(
        client.fcmToken,
        {
          title: '🙌 Driver Found!',
          body: `${driver?.name || 'Your driver'} has accepted your ride request.`,
          data: { type: 'RIDE_ACCEPTED', rideId: String(ride._id) },
        },
        String(client._id)
      );
    }

    res.json({ success: true, ride });
  } catch (error) {
    console.error('AcceptRide error:', error);
    res.status(500).json({ success: false, message: 'Server error accepting ride.' });
  }
};

/**
 * PATCH /api/rides/:id/status
 */
export const updateRideStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const { status } = req.body;
    const driverId = req.user!.id;

    const ride = await rideRepository.findById(id);
    if (!ride) {
      res.status(404).json({ success: false, message: 'Ride not found.' });
      return;
    }

    if (String(ride.driverId) !== driverId) {
      res.status(403).json({ success: false, message: 'Not authorized to update this ride.' });
      return;
    }

    const expectedNext = STATUS_TRANSITIONS[ride.status];
    if (status !== expectedNext) {
      res.status(400).json({
        success: false,
        message: `Invalid status transition. Expected: ${expectedNext}, got: ${status}`,
      });
      return;
    }

    const updatedRide = await rideRepository.updateStatus(id, status as RideStatus);

    // Notify client on key changes
    const client = await userRepository.findById(String(ride.clientId));
    if (client?.fcmToken) {
      const notifyMap: Record<string, { title: string; body: string }> = {
        ON_THE_WAY: { title: '🚗 Driver On the Way!', body: 'Your driver is heading to your pickup location.' },
        WAITING_FOR_PICKUP: { title: '📍 Driver Arrived!', body: 'Your driver is waiting at the pickup location.' },
        ONGOING_RIDE: { title: '🚕 Ride Started!', body: 'Your ride is underway. Sit back and relax!' },
      };
      const notif = notifyMap[status as string];
      if (notif) {
        await sendToDevice(
          client.fcmToken,
          { ...notif, data: { type: `RIDE_${status as string}`, rideId: id } },
          String(client._id)
        );
      }
    }

    res.json({ success: true, ride: updatedRide });
  } catch (error) {
    console.error('UpdateRideStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error updating ride status.' });
  }
};

/**
 * PATCH /api/rides/:id/end
 */
export const endRide = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const { fare, note } = req.body;
    const driverId = req.user!.id;

    if (fare === undefined || fare === null) {
      res.status(400).json({ success: false, message: 'Fare amount is required.' });
      return;
    }

    const ride = await rideRepository.findById(id);
    if (!ride) {
      res.status(404).json({ success: false, message: 'Ride not found.' });
      return;
    }

    if (String(ride.driverId) !== driverId) {
      res.status(403).json({ success: false, message: 'Not authorized.' });
      return;
    }

    if (ride.status !== 'ONGOING_RIDE') {
      res.status(400).json({ success: false, message: 'Ride must be ONGOING_RIDE to end it.' });
      return;
    }

    const updatedRide = await rideRepository.updateById(id, {
      status: 'RIDE_ENDED',
      fare: Number(fare),
      note: (note as string) || null,
    });

    // Notify client
    const client = await userRepository.findById(String(ride.clientId));
    if (client?.fcmToken) {
      await sendToDevice(
        client.fcmToken,
        {
          title: '🏁 Ride Completed!',
          body: `Your ride has ended. Total fare: ₹${fare}`,
          data: { type: 'RIDE_ENDED', rideId: id },
        },
        String(client._id)
      );
    }

    res.json({ success: true, ride: updatedRide });
  } catch (error) {
    console.error('EndRide error:', error);
    res.status(500).json({ success: false, message: 'Server error ending ride.' });
  }
};

/**
 * GET /api/rides/my-rides (client)
 */
export const getClientRides = async (req: Request, res: Response): Promise<void> => {
  try {
    const rides = await rideRepository.findByClientId(req.user!.id);
    res.json({ success: true, rides });
  } catch (error) {
    console.error('GetClientRides error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching rides.' });
  }
};

/**
 * GET /api/rides/driver/my-rides (driver)
 */
export const getDriverRides = async (req: Request, res: Response): Promise<void> => {
  try {
    const rides = await rideRepository.findByDriverId(req.user!.id);
    res.json({ success: true, rides });
  } catch (error) {
    console.error('GetDriverRides error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching rides.' });
  }
};

/**
 * GET /api/rides/driver/earnings?startDate=&endDate=
 */
export const getDriverEarnings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate query params are required.' });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format. Use ISO 8601.' });
      return;
    }

    const rides = await rideRepository.findByDateRange(req.user!.id, start, end);
    const totalEarnings = rides.reduce((sum, r) => sum + (r.fare || 0), 0);

    res.json({ success: true, totalEarnings, count: rides.length, rides });
  } catch (error) {
    console.error('GetDriverEarnings error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching earnings.' });
  }
};
