import { Types } from 'mongoose';
import { 
  Blog, 
  IWallpaper,
  RedeemCode, 
  CraftlandCode, 
  Page, 
  IUser
} from './types';
import NextAuth from 'next-auth';

// Mock Blogs data
export const blogs: Blog[] = [
  {
    id: '1',
    title: 'Free Fire MAX: Update 2023 - What\'s New',
    slug: 'free-fire-max-update-2023',
    content: '<p>The latest update of Free Fire MAX brings a lot of exciting features including new weapons, characters, and game modes.</p><p>Players can now enjoy enhanced graphics, improved gameplay mechanics, and a more immersive battle royale experience.</p>',
    excerpt: 'Explore all the exciting new features and changes coming in the latest Free Fire MAX update.',
    coverImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    author: 'Admin',
    isPublished: true,
    tags: ['Update', 'Features'],
    metaTitle: 'Free Fire MAX Update 2023 - Latest Features & Improvements',
    metaDescription: 'Discover all the newest features, weapons, characters and improvements in the latest Free Fire MAX update of 2023.',
    createdAt: new Date('2023-10-15T10:00:00Z'),
    updatedAt: new Date('2023-10-15T10:00:00Z'),
  },
  {
    id: '2',
    title: 'Top 10 Weapons for Ranked Matches',
    slug: 'top-10-weapons-ranked-matches',
    content: '<p>Choosing the right weapons in Free Fire ranked matches can make a huge difference in your gameplay and rankings.</p><p>This guide covers the top 10 most effective weapons that will help you dominate your opponents and climb the ranks faster.</p>',
    excerpt: 'Master these weapons to dominate your opponents and climb the ranked ladder quickly.',
    coverImage: 'https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
    author: 'Admin',
    isPublished: true,
    tags: ['Weapons', 'Ranked'],
    metaTitle: 'Top 10 Free Fire Weapons for Competitive Ranked Matches',
    metaDescription: 'Discover the best weapons to use in Free Fire ranked matches to increase your win rate and climb the competitive ladder quickly.',
    createdAt: new Date('2023-10-10T10:00:00Z'),
    updatedAt: new Date('2023-10-10T10:00:00Z'),
  },
  {
    id: '3',
    title: 'Best Character Combinations for 2023',
    slug: 'best-character-combinations-2023',
    content: '<p>Combining the right characters in Free Fire can give you powerful ability synergies that will enhance your gameplay significantly.</p><p>In this guide, we explore the most effective character combinations that are dominating the meta in 2023.</p>',
    excerpt: 'Find out which character combinations are dominating the meta this season.',
    coverImage: 'https://images.unsplash.com/photo-1519326776720-9e5c12f34318?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2034&q=80',
    author: 'Admin',
    isPublished: true,
    tags: ['Characters', 'Meta'],
    metaTitle: 'Best Free Fire Character Combinations for 2023 Meta',
    metaDescription: 'Learn about the most powerful and effective character combinations in Free Fire to dominate the battlefield in 2023.',
    createdAt: new Date('2023-10-05T10:00:00Z'),
    updatedAt: new Date('2023-10-05T10:00:00Z'),
  },
];

// Mock Wallpapers data
export const wallpapers: IWallpaper[] = [
  {
    _id: '1', // Use _id
    title: 'Cosmic Dreams',
    description: 'A beautiful nebula in deep space.',
    category: 'Space',
    tags: ['nebula', 'stars', 'galaxy', 'cosmic'],
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420',
    viewCount: 1200,
    downloadCount: 300,
    isPublished: true,
    isHD: true,
    isNew: false,
    isTrending: true,
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
    updatedAt: new Date(),
    // Removed resolution property
  },
  {
    _id: '2', // Use _id
    title: 'Mountain Serenity',
    description: 'A calm mountain lake at sunrise.',
    category: 'Nature',
    tags: ['mountain', 'lake', 'sunrise', 'serene', 'landscape'],
    imageUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=400&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051',
    viewCount: 950,
    downloadCount: 150,
    isPublished: true,
    isHD: true,
    isNew: true,
    isTrending: false,
    createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    updatedAt: new Date(),
    // Removed resolution property
  },
   {
    _id: '3', // Use _id
    title: 'Abstract Flow',
    description: 'Colorful abstract liquid patterns.',
    category: 'Abstract',
    tags: ['abstract', 'colorful', 'liquid', 'flow'],
    imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=400&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f',
    viewCount: 2100,
    downloadCount: 500,
    isPublished: true,
    isHD: true,
    isNew: false,
    isTrending: true,
    createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
    updatedAt: new Date(),
    // Removed resolution property
  },
  {
    _id: '4', // Use _id
    title: 'Forest Path',
    description: 'A serene path through a sunlit forest.',
    category: 'Nature',
    tags: ['forest', 'path', 'sunlight', 'serene', 'nature'],
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
    downloadUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
    viewCount: 1500,
    downloadCount: 250,
    isPublished: false,
    isHD: true,
    isNew: false,
    isTrending: false,
    createdAt: new Date(Date.now() - 86400000 * 14), // 14 days ago
    updatedAt: new Date(),
    // Removed resolution property
  },
];

// Mock Redeem Code data
export const redeemCodes: RedeemCode[] = [
  {
    id: '1',
    code: 'FF12-ABCD-XYZ9-QRST',
    description: 'Get 2x Diamond Royale Vouchers and 1x Weapon Royale Voucher',
    expiresAt: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
    isActive: true,
    reward: 'Diamond & Weapon Vouchers',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    code: 'FF23-EFGH-UVW8-LMNO',
    description: 'Claim 1x Legendary Gun Skin Trial Card and 2x Supply Crates',
    expiresAt: new Date(new Date().getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
    isActive: false,
    reward: 'Gun Skin & Supply Crates',
    createdAt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
  },
];

// Mock Craftland Code data
export const craftlandCodes: CraftlandCode[] = [
  {
    id: 'cl1', // NOTE: CraftlandCode type uses 'id', not '_id'. Keeping 'id'.
    title: 'Sky High Parkour',
    description: 'Test your parkour skills high above the clouds.',
    code: 'FFCL-ABCD-1234',
    category: 'Parkour',
    difficulty: 'hard',
    creator: { _id: 'user1', name: 'CreatorOne' },
    createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    downloadCount: 1500,
    thumbnailUrl: '/images/thumbnails/sky_high_thumb.jpg',
    imageUrl: '/images/covers/sky_high_cover.jpg', // Use imageUrl
    features: ['Checkpoint System', 'Moving Platforms', 'Time Trial'],
    upvotes: [],
    downvotes: [],
    likes: [],
    isVerified: true,
    isFraudulent: false,
    region: 'GLOBAL',
  },
  {
    id: 'cl2', // NOTE: CraftlandCode type uses 'id', not '_id'. Keeping 'id'.
    title: 'Zombie Survival Arena',
    description: 'Survive waves of zombies in this intense arena.',
    code: 'FFCL-EFGH-5678',
    category: 'Survival',
    difficulty: 'medium',
    creator: { _id: 'user2', name: 'CreatorTwo' },
    createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
    downloadCount: 3250,
    thumbnailUrl: '/images/thumbnails/zombie_arena_thumb.jpg',
    imageUrl: '/images/covers/zombie_arena_cover.jpg', // Use imageUrl
    features: ['Wave System', 'Weapon Pickups', 'Team Mode'],
    upvotes: [],
    downvotes: [],
    likes: [],
    isVerified: true,
    isFraudulent: false,
    region: 'IN',
  },
  {
    id: 'cl3', // NOTE: CraftlandCode type uses 'id', not '_id'. Keeping 'id'.
    title: 'Mystery Mansion Escape',
    description: 'Solve puzzles and escape the haunted mansion.',
    code: 'FFCL-IJKL-9012',
    category: 'Puzzle',
    difficulty: 'medium',
    creator: { _id: 'user1', name: 'CreatorOne' },
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    downloadCount: 800,
    imageUrl: '/images/covers/mystery_mansion_cover.jpg',
    features: ['Hidden Clues', 'Multiple Endings', 'Interactive Objects'],
    upvotes: [],
    downvotes: [],
    likes: [],
    isVerified: false,
    isFraudulent: false,
    region: 'BR',
  },
];

// Mock Page data
export const pages: Page[] = [
  {
    id: '1',
    slug: 'about-us',
    title: 'About Us',
    content: '<h2>Welcome to TheFreeFireIndia</h2><p>We are a dedicated community of Free Fire enthusiasts providing the latest information, wallpapers, redeem codes, and more for Indian players.</p><p>Our mission is to create a hub for all Free Fire fans in India where they can find valuable resources and connect with fellow players.</p>',
    metaTitle: 'About TheFreeFireIndia - Free Fire Fan Hub',
    metaDescription: 'Learn about TheFreeFireIndia, the premier fan hub for Free Fire players in India providing wallpapers, redeem codes, and more.',
    isPublished: true,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z'),
  },
  {
    id: '2',
    slug: 'disclaimer',
    title: 'Disclaimer',
    content: '<h2>Disclaimer</h2><p>We are not associated with Garena or Free Fire. This is a fan-made site for educational and entertainment purposes.</p><p>All trademarks, logos, and brand names are the property of their respective owners. All company, product, and service names used on this website are for identification purposes only.</p>',
    metaTitle: 'Disclaimer - TheFreeFireIndia',
    metaDescription: 'Important disclaimer information about TheFreeFireIndia website and its relation to Garena and Free Fire.',
    isPublished: true,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z'),
  },
];

// You can add more mock data functions here if needed
// e.g., mockFetchUserProfile, mockSubmitComment, etc. 