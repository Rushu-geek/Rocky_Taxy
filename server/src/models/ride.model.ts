import mongoose, { Document, Schema, Types } from 'mongoose';

export type RideType = 'instant' | 'scheduled';

export type RideStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'WAITING_FOR_PICKUP'
  | 'ONGOING_RIDE'
  | 'RIDE_ENDED'
  | 'CANCELLED';

export interface IRide extends Document {
  clientId: Types.ObjectId;
  driverId?: Types.ObjectId;
  fromLocation: string;
  toLocation: string;
  passengers: number;
  type: RideType;
  scheduledAt?: Date;
  status: RideStatus;
  fare?: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RideSchema = new Schema<IRide>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fromLocation: {
      type: String,
      required: [true, 'From location is required'],
      trim: true,
    },
    toLocation: {
      type: String,
      required: [true, 'To location is required'],
      trim: true,
    },
    passengers: {
      type: Number,
      required: [true, 'Number of passengers is required'],
      min: [1, 'At least 1 passenger required'],
      max: [10, 'Maximum 10 passengers allowed'],
    },
    type: {
      type: String,
      enum: ['instant', 'scheduled'],
      required: [true, 'Ride type is required'],
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'ACCEPTED',
        'ON_THE_WAY',
        'WAITING_FOR_PICKUP',
        'ONGOING_RIDE',
        'RIDE_ENDED',
        'CANCELLED',
      ],
      default: 'PENDING',
    },
    fare: {
      type: Number,
      default: null,
      min: [0, 'Fare cannot be negative'],
    },
    note: {
      type: String,
      default: null,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient driver queries on available rides
RideSchema.index({ status: 1, driverId: 1 });
RideSchema.index({ clientId: 1 });
RideSchema.index({ driverId: 1 });
RideSchema.index({ createdAt: -1 });

export const Ride = mongoose.model<IRide>('Ride', RideSchema);
