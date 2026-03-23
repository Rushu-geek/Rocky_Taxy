import { IUser, User } from '../models/user.model';
import { BaseRepository } from './base.repository';

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<IUser | null> {
    return this.updateById(userId, { fcmToken });
  }

  async clearFcmToken(userId: string): Promise<IUser | null> {
    return this.updateById(userId, { fcmToken: null });
  }

  async findAvailableDrivers(): Promise<IUser[]> {
    return this.model.find({ role: 'driver', isAvailable: true }).exec();
  }
}

export const userRepository = new UserRepository();
