import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  wallpaperCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Create slug from name
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Define the model
let Category: mongoose.Model<any>;

try {
  // Check if the model already exists to prevent recompilation errors
  Category = mongoose.models?.Category || mongoose.model('Category', categorySchema);
} catch (error) {
  // If there's an error, try creating the model
  Category = mongoose.model('Category', categorySchema);
}

export default Category; 