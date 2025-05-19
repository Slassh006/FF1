// models/Media.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
// Removed MediaItem import here as IMedia is defined independently now

// Interface for the Mongoose document structure
export interface IMedia extends Document {
  // _id is inherited from Document
  slug: string;
  filename: string;
  caption?: string;
  altText?: string;
  uploadDate: Date; // Use Date type for Mongoose
  size: number;
  type: string; // MIME Type
  gridFsId: mongoose.Types.ObjectId; // Use ObjectId type
  // Add userId or other metadata as needed
  // userId?: mongoose.Types.ObjectId;
}

const MediaSchema: Schema<IMedia> = new Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  filename: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
  },
  altText: {
    type: String,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  size: {
    type: Number,
    required: true,
  },
  type: { // MIME Type
    type: String,
    required: true,
  },
  gridFsId: { // Reference to the GridFS file
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  // Add userId or other metadata as needed
  // userId: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true }, // Ensure virtuals are included in JSON output
  toObject: { virtuals: true } // Ensure virtuals are included when converting to object
});

// Virtual property for the stream URL
MediaSchema.virtual('url').get(function() {
  // Need to cast `this` to IMedia to access slug safely
  const doc = this as IMedia;
  return `/api/admin/media/stream/${doc.slug}`;
});

// Prevent model recompilation in Next.js dev environment
const Media: Model<IMedia> = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media; 