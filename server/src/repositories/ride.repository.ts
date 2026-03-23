import { IRide, Ride, RideStatus } from '../models/ride.model';
import { BaseRepository } from './base.repository';

class RideRepository extends BaseRepository<IRide> {
  constructor() {
    super(Ride);
  }

  async findByClientId(clientId: string): Promise<IRide[]> {
    return this.model
      .find({ clientId })
      .sort({ createdAt: -1 })
      .populate('driverId', 'name phone')
      .exec();
  }

  async findByDriverId(driverId: string): Promise<IRide[]> {
    return this.model
      .find({ driverId })
      .sort({ createdAt: -1 })
      .populate('clientId', 'name phone')
      .exec();
  }

  async findAvailableRides(): Promise<IRide[]> {
    return this.model
      .find({ status: 'PENDING', driverId: null })
      .sort({ createdAt: -1 })
      .populate('clientId', 'name phone')
      .exec();
  }

  async acceptRide(rideId: string, driverId: string): Promise<IRide | null> {
    return this.model
      .findOneAndUpdate(
        { _id: rideId, status: 'PENDING', driverId: null },
        { driverId, status: 'ACCEPTED' },
        { new: true }
      )
      .exec();
  }

  /**
   * Find a ride by a driver that is currently in-motion (i.e. actively executing,
   * not just a future confirmed scheduled ride).
   * Instant rides: ACCEPTED or beyond.
   * Scheduled rides: only count if they've left ACCEPTED (i.e. driver is en-route).
   */
  async findDriverActiveRide(driverId: string): Promise<IRide | null> {
    return this.model
      .findOne({
        driverId,
        status: { $in: ['ON_THE_WAY', 'WAITING_FOR_PICKUP', 'ONGOING_RIDE'] },
      })
      .exec();
  }

  async updateStatus(rideId: string, status: RideStatus): Promise<IRide | null> {
    return this.updateById(rideId, { status });
  }

  async findByDateRange(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IRide[]> {
    return this.model
      .find({
        driverId,
        status: 'RIDE_ENDED',
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}

export const rideRepository = new RideRepository();
