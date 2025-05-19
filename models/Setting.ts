import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string; // Unique key for the setting, e.g., 'googleApiCredentials'
  value: any; // Can store various types of settings data (objects, strings, numbers)
  createdAt?: Date;
  updatedAt?: Date;
}

const SettingSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed, // Allows storing flexible data structures
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema); 