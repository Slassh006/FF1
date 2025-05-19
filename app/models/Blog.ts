import mongoose from 'mongoose';

// Define interfaces
interface Like {
  user: mongoose.Types.ObjectId;
  timestamp: Date;
}

interface BlogDocument extends mongoose.Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: {
    url: string;
    alt: string;
    caption: string;
    fileId?: mongoose.Types.ObjectId;
  };
  author: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  status: string;
  publishedAt: Date;
  featured: boolean;
  views: number;
  likes: Like[];
  comments: any[]; // We can define a more specific type if needed
  metadata: {
    readTime: number;
    wordCount: number;
    lastModified: Date;
    modifiedBy: mongoose.Types.ObjectId;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage: string;
  };
  revisions: {
    content: string;
    author: mongoose.Types.ObjectId;
    timestamp: Date;
    description: string;
  }[];
}

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide blog title'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: [true, 'Please provide blog content'],
  },
  excerpt: {
    type: String,
    required: [true, 'Please provide blog excerpt'],
  },
  featuredImage: {
    url: String,
    alt: String,
    caption: String,
    fileId: { type: mongoose.Schema.Types.ObjectId, required: false }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    enum: ['news', 'guide', 'event', 'update', 'community'],
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: Date,
  featured: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  metadata: {
    readTime: Number, // in minutes
    wordCount: Number,
    lastModified: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogImage: String,
  },
  revisions: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    description: String,
  }],
}, {
  timestamps: true,
});

// Indexes for efficient queries
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ 'comments.user': 1 });
blogSchema.index({ author: 1, status: 1 });

// Virtual for comment count
blogSchema.virtual('commentCount').get(function() {
  return this.comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);
});

// Virtual for like count
blogSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Update the methods with proper type annotations
blogSchema.methods.hasLiked = function(userId: string): boolean {
  return this.likes.some((like: Like) => like.user.toString() === userId);
};

blogSchema.methods.addLike = function(userId: string): void {
  if (!this.hasLiked(userId)) {
    this.likes.push({ user: userId, timestamp: new Date() });
  }
};

blogSchema.methods.removeLike = function(userId: string): void {
  this.likes = this.likes.filter((like: Like) => like.user.toString() !== userId);
};

// Method to toggle like
blogSchema.methods.toggleLike = async function(userId: string) {
  const existingLike = this.likes.find((like: { user: mongoose.Types.ObjectId }) => like.user.toString() === userId);
  
  if (existingLike) {
    this.likes = this.likes.filter((like: { user: mongoose.Types.ObjectId }) => like.user.toString() !== userId);
  } else {
    this.likes.push({
      user: userId,
      timestamp: new Date(),
    });
  }
  
  await this.save();
  return !existingLike;
};

// Method to add comment
blogSchema.methods.addComment = async function(userId: string, content: string) {
  this.comments.push({
    user: userId,
    content,
    createdAt: new Date(),
  });
  
  await this.save();
  return this.comments[this.comments.length - 1];
};

// Method to add reply to comment
blogSchema.methods.addReply = async function(commentId: string, userId: string, content: string) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  comment.replies.push({
    user: userId,
    content,
    createdAt: new Date(),
  });
  
  await this.save();
  return comment.replies[comment.replies.length - 1];
};

// Method to toggle comment like
blogSchema.methods.toggleCommentLike = async function(commentId: string, userId: string) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  const likeIndex = comment.likes.findIndex((like: mongoose.Types.ObjectId) => like.toString() === userId);
  
  if (likeIndex > -1) {
    comment.likes.splice(likeIndex, 1);
  } else {
    comment.likes.push(userId);
  }
  
  await this.save();
  return likeIndex === -1;
};

// Method to increment view count
blogSchema.methods.incrementViews = async function() {
  this.views++;
  await this.save();
  return this.views;
};

// Method to save revision
blogSchema.methods.saveRevision = async function(userId: string, content: string, description: string) {
  this.revisions.push({
    content,
    author: userId,
    timestamp: new Date(),
    description,
  });
  
  await this.save();
  return this.revisions[this.revisions.length - 1];
};

// Define the model
let Blog: mongoose.Model<BlogDocument>;

try {
  // Check if the model already exists to prevent recompilation errors
  Blog = (mongoose.models?.Blog || mongoose.model<BlogDocument>('Blog', blogSchema)) as mongoose.Model<BlogDocument>;
} catch (error) {
  // If there's an error, try creating the model
  Blog = mongoose.model<BlogDocument>('Blog', blogSchema);
}

export default Blog; 