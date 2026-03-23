import { Router } from 'express';
import { protect, requireRole } from '../middleware/auth.middleware';
import {
  createRide,
  getAvailableRides,
  acceptRide,
  updateRideStatus,
  endRide,
  getClientRides,
  getDriverRides,
  getDriverEarnings,
} from '../controllers/ride.controller';

const router = Router();

// All ride routes require authentication
router.use(protect);

// Client routes
router.post('/', requireRole('client'), createRide);
router.get('/my-rides', requireRole('client'), getClientRides);

// Driver routes
router.get('/available', requireRole('driver'), getAvailableRides);
router.get('/driver/my-rides', requireRole('driver'), getDriverRides);
router.get('/driver/earnings', requireRole('driver'), getDriverEarnings);
router.patch('/:id/accept', requireRole('driver'), acceptRide);
router.patch('/:id/status', requireRole('driver'), updateRideStatus);
router.patch('/:id/end', requireRole('driver'), endRide);

export default router;
