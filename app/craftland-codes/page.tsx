'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaCopy, FaCheck, FaPlay, FaFilter, FaThumbsUp, FaThumbsDown, FaHeart, FaShieldAlt, FaUsers, FaClock, FaStar, FaDownload, FaFlag, FaList } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import LoadingSpinner from '../components/LoadingSpinner';
import CraftlandCodeForm from '../components/CraftlandCodeForm';
import Link from 'next/link';
import ReportDialog from '../components/ReportDialog';

interface Creator {
  _id?: string; // Add optional _id to match likely populated data
  name: string;
  image?: string;
}

interface CraftlandCode {
  _id: string;
  title: string;
  description: string;
  code: string;
  category: string;
  difficulty?: string;
  creator?: {
    _id?: string;
    name: string;
    image?: string;
  };
  submittedBy?: string;
  createdAt: string;
  downloadCount: number;
  videoUrl?: string;
  features?: string[];
  upvotes: string[];
  downvotes: string[];
  favorites: string[];
  isVerified: boolean;
  region: string;
  isFavorite?: boolean;
  coverImage?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface VoteHistory {
  codeId: string;
  voteType: 'up' | 'down';
  timestamp: number;
}

const regions = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MENA', name: 'Middle East', flag: '🌍' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'SA', name: 'South America', flag: '🌎' },
  { code: 'NA', name: 'North America', flag: '🌎' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'GLOBAL', name: 'Global', flag: '🌐' }
];

export default function CraftlandCodesPage({ params: { id } }: { params: { id: string } }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [craftlandCodes, setCraftlandCodes] = useState<CraftlandCode[]>([]);
  const [verifiedCodes, setVerifiedCodes] = useState<CraftlandCode[]>([]);
  const [communityCodes, setCommunityCodes] = useState<CraftlandCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [interactingCodeId, setInteractingCodeId] = useState<string | null>(null);
  const [favoriteCodeIds, setFavoriteCodeIds] = useState<Set<string>>(new Set());
  const [voteHistory, setVoteHistory] = useState<VoteHistory[]>([]);
  const [lastVoteTime, setLastVoteTime] = useState<number>(0);
  const VOTE_COOLDOWN = 30000; // 30 seconds cooldown
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedCodeForReport, setSelectedCodeForReport] = useState<{ id: string; title: string } | null>(null);

  // Fetch User's Favorite Codes (if logged in)
  useEffect(() => {
    const fetchFavorites = async () => {
      if (session?.user?.id) {
        try {
          // Fetch initial favorite state
          const response = await fetch('/api/user/favorites?type=craftland');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
               setFavoriteCodeIds(new Set(data.favorites || []));
            }
          } else {
             console.error("Failed to fetch user favorites status:", response.statusText);
          }
        } catch (err) {
          console.error("Error fetching user favorites:", err);
        }
      }
    };
    fetchFavorites();
  }, [session]); // Depend on session

  const fetchCraftlandCodes = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/craftland-codes', window.location.origin);
      
      if (searchTerm) url.searchParams.append('search', searchTerm);
      if (selectedRegion) url.searchParams.append('region', selectedRegion);
      if (selectedSort) url.searchParams.append('sort', selectedSort);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch craftland codes');
      }
      
      const data = await response.json();
      
      if (data.success) {
        const codes = data.craftlandCodes || [];
        // Standardize the data structure
        const transformedCodes = codes.map((code: any) => ({
          _id: code._id,
          title: code.title,
          description: code.description,
          code: code.code,
          category: code.category,
          difficulty: code.difficulty || 'medium',
          creator: {
            _id: code.creator?._id,
            name: code.creator?.name || 'Unknown',
            image: code.creator?.image
          },
          submittedBy: code.submittedBy,
          createdAt: code.createdAt,
          videoUrl: code.videoUrl,
          upvotes: code.upvotes || [],
          downvotes: code.downvotes || [],
          favorites: code.favorites || [],
          isVerified: code.isVerified || false,
          region: code.region,
          isFavorite: code.isFavorite || false,
          coverImage: code.coverImage,
          status: code.status || 'pending'
        }));
        
        setCraftlandCodes(transformedCodes);
        setVerifiedCodes(transformedCodes.filter((code: CraftlandCode) => code.isVerified));
        setCommunityCodes(transformedCodes.filter((code: CraftlandCode) => !code.isVerified));
        setError('');
      } else {
        throw new Error(data.error || 'Failed to fetch craftland codes');
      }
    } catch (err: any) {
      console.error('Error fetching craftland codes:', err);
      setError(err.message || 'Failed to fetch craftland codes');
      setCraftlandCodes([]);
      setVerifiedCodes([]);
      setCommunityCodes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, selectedSort, searchTerm]);

  useEffect(() => {
    fetchCraftlandCodes();
  }, [fetchCraftlandCodes]);

  // Add useEffect to filter codes whenever craftlandCodes changes
  useEffect(() => {
    setVerifiedCodes(craftlandCodes.filter(code => code.isVerified));
    setCommunityCodes(craftlandCodes.filter(code => !code.isVerified));
  }, [craftlandCodes]); // Dependency array ensures this runs when craftlandCodes updates

  // Add polling for real-time updates
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await fetch('/api/craftland-codes');
        const data = await response.json();
        if (data && Array.isArray(data.codes)) {
          setCraftlandCodes(data.codes);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCodes();
    const interval = setInterval(fetchCodes, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const getTimeRemaining = (date: string) => {
    const now = new Date();
    const expiry = new Date(date);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const handleVote = async (codeId: string, voteType: 'up' | 'down') => {
    if (!userId) {
      toast.error('Please log in to vote.');
      return;
    }

    const codeToUpdate = craftlandCodes.find(c => c._id === codeId);
    if (codeToUpdate?.submittedBy === userId) {
       toast.error("You cannot vote on your own submission.");
       return;
    }

    // Check cooldown period (30 seconds)
    const now = Date.now();
    if (now - lastVoteTime < VOTE_COOLDOWN) {
      const remainingSeconds = Math.ceil((VOTE_COOLDOWN - (now - lastVoteTime)) / 1000);
      toast.error(`Please wait ${remainingSeconds} seconds before voting again.`);
      return;
    }

    // Check if user has already voted
    const hasUpvoted = codeToUpdate?.upvotes?.includes(userId);
    const hasDownvoted = codeToUpdate?.downvotes?.includes(userId);
    
    if (voteType === 'up' && hasUpvoted) {
      toast.error("You have already upvoted this code.");
      return;
    }
    if (voteType === 'down' && hasDownvoted) {
      toast.error("You have already downvoted this code.");
      return;
    }

    setInteractingCodeId(codeId);
    try {
      const response = await fetch(`/api/craftland-codes/${codeId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: voteType }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${voteType}vote`);
      }

      // Update vote history
      setVoteHistory(prev => [...prev, { codeId, voteType, timestamp: now }]);
      setLastVoteTime(now);

      setCraftlandCodes(prevCodes =>
        prevCodes.map(code => {
          if (code._id === codeId) {
            return {
              ...code,
              upvotes: data.upvotes,
              downvotes: data.downvotes,
              isVerified: data.isVerified
            };
          }
          return code;
        })
      );

      // Fetch latest codes for real-time update
      await fetchCraftlandCodes();

      // Animate vote button
      const button = document.getElementById(`vote-${voteType}-${codeId}`);
      if (button) {
        button.classList.add('animate-vote');
        setTimeout(() => button.classList.remove('animate-vote'), 500);
      }

      toast.success(`Vote registered! ${voteType === 'up' ? '👍' : '👎'}`);

    } catch (err: any) {
      console.error('Vote error:', err);
      toast.error(err.message || 'Failed to register vote.');
    } finally {
      setInteractingCodeId(null);
    }
  };

  const handleLike = async (codeId: string) => {
    if (!userId) {
      toast.error('Please log in to like.');
      return;
    }

    setInteractingCodeId(codeId);
    try {
      const response = await fetch(`/api/craftland-codes/${codeId}/like`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle like');
      }

      setCraftlandCodes(prevCodes =>
         prevCodes.map(code => {
           if (code._id === codeId) {
             const newLikes = data.liked
                ? [...(code.favorites || []), userId]
                : (code.favorites || []).filter(id => id !== userId);
             return { ...code, favorites: newLikes };
           }
           return code;
         })
       );

      toast.success(data.liked ? 'Code liked!' : 'Like removed.');

    } catch (err: any) {
      console.error('Like error:', err);
      toast.error(err.message || 'Failed to toggle like.');
    } finally {
      setInteractingCodeId(null);
    }
  };

  const handleFavorite = async (codeId: string) => {
    if (!userId) {
      toast.error('Please log in to favorite.');
      return;
    }

    setInteractingCodeId(codeId);
    try {
      const response = await fetch(`/api/craftland-codes/${codeId}/favorite`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle favorite');
      }

      setCraftlandCodes(prevCodes =>
        prevCodes.map(code => {
          if (code._id === codeId) {
            return {
              ...code,
              favorites: data.favorites,
              isFavorite: data.isFavorite
            };
          }
          return code;
        })
      );

      toast.success(data.isFavorite ? 'Added to favorites!' : 'Removed from favorites.');

    } catch (err: any) {
      console.error('Favorite error:', err);
      toast.error(err.message || 'Failed to toggle favorite.');
    } finally {
      setInteractingCodeId(null);
    }
  };

  const getImageSrc = (url?: string) => {
    if (!url) return '/images/placeholder-craftland.png';
    if (url.startsWith('http')) return url;
    // Assuming API returns relative paths like /api/files/...
    return url.startsWith('/') ? url : `/${url}`;
  };

  const renderCodeCard = (code: CraftlandCode, isCommunity: boolean = false) => {
    const isLoadingInteraction = interactingCodeId === code._id;
    const userHasUpvoted = userId && code.upvotes?.includes(userId);
    const userHasDownvoted = userId && code.downvotes?.includes(userId);
    const isFavorite = userId && code.favorites?.includes(userId);
    const currentRegion = regions.find(r => r.code === code.region);
    const voteRatio = code.upvotes?.length || 0;
    const totalVotes = (code.upvotes?.length || 0) + (code.downvotes?.length || 0);
    const votePercentage = totalVotes > 0 ? Math.round((voteRatio / totalVotes) * 100) : 0;

    // Standardize creator information
    const creatorName = code.creator?.name || 'Unknown';
    const creatorImage = code.creator?.image;
    const creatorInitial = creatorName[0]?.toUpperCase() || '?';
    const creatorDisplayText = isCommunity ? `By ${creatorName}` : creatorName;
    const creatorTitleText = creatorName === 'Unknown' ? 'Unknown Creator' : creatorName;

    return (
      <div key={code._id} className="bg-secondary rounded-lg shadow-md overflow-hidden border border-primary/10 flex flex-col relative group">
        {/* Status Badge and Region Flag */}
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
          {currentRegion && (
            <span 
              className="bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1" 
              title={currentRegion.name}
            >
              {currentRegion.flag}
              <span className="hidden sm:inline">{currentRegion.code}</span>
            </span>
          )}
          {code.status && code.status !== 'approved' && (
            <span className={`px-2 py-1 rounded-full text-[10px] ${
              code.status === 'pending' 
                ? 'bg-yellow-500/20 text-yellow-300' 
                : 'bg-red-500/20 text-red-300'
            }`}>
              {code.status.charAt(0).toUpperCase() + code.status.slice(1)}
            </span>
          )}
        </div>

        {/* Favorite Button - Single instance */}
        {userId && (
          <button
            onClick={() => handleFavorite(code._id)}
            disabled={isLoadingInteraction}
            className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-colors disabled:opacity-50 ${
              isFavorite ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark/60 text-white/70 hover:bg-primary/10 hover:text-primary'
            } flex items-center justify-center w-6 h-6`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isLoadingInteraction ? <LoadingSpinner size="small" /> : <FaStar size={14}/>}
          </button>
        )}
        
        {/* Cover Image */}
        <div className="relative h-48 w-full group overflow-hidden">
          <Image
            src={getImageSrc(code.coverImage)}
            alt={code.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="space-y-2">
              {/* Category Badge */}
              <span className="inline-block bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
                {code.category}
              </span>
              {/* Difficulty (if available) */}
              {code.difficulty && (
                <span className="inline-block bg-white/10 text-white px-2 py-1 rounded-full text-xs ml-2">
                  {code.difficulty}
                </span>
              )}
              {/* Video Link (if available) */}
              {code.videoUrl && (
                <a
                  href={code.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-white/80 text-xs hover:text-primary transition-colors"
                >
                  <FaPlay className="mr-1" />
                  Watch Gameplay
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-3 flex-grow flex flex-col">
          {/* Creator & Verification */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-grow min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 border border-primary/10">
                {typeof code.creator?.image === 'string' && code.creator.image ? (
                  <img
                    src={code.creator.image || ''}
                    alt={code.creator.name || 'Unknown'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] uppercase text-primary">{(code.creator?.name && code.creator.name[0]?.toUpperCase()) || '?'}</span>
                )}
              </div>
              <span className="text-white/60 truncate text-xs" title={code.creator?.name === 'Unknown' ? 'Unknown Creator' : (code.creator?.name || 'Unknown')}>
                {code.creator?.name || 'Unknown'}
              </span>
            </div>
            {code.isVerified ? (
              <span className="text-[10px] bg-green-500/15 text-green-300 px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                <FaShieldAlt className="w-2.5 h-2.5" />
                Verified
              </span>
            ) : (
              <span className="text-[10px] bg-yellow-500/15 text-yellow-300 px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                <FaUsers className="w-2.5 h-2.5" />
                Community
              </span>
            )}
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-white mb-1.5 text-base truncate" title={code.title}>
            {code.title}
          </h3>

          {/* Code & Copy Button */}
          <div className="bg-dark/40 p-1.5 rounded-md flex items-center justify-between mb-2">
            <span className="font-mono text-white truncate flex-grow mr-2 text-xs" title={code.code}>
              {code.code}
            </span>
            <button
              onClick={() => copyToClipboard(code.code)}
              className="p-1 hover:bg-primary/10 rounded-full transition-colors flex-shrink-0"
              title="Copy Code"
              aria-label="Copy Craftland Code"
            >
              {copiedCode === code.code ? (
                <FaCheck className="text-green-400 w-3.5 h-3.5" />
              ) : (
                <FaCopy className="text-white/60 w-3.5 h-3.5" />
              )}
            </button>
          </div>
          
          {/* Description */}
          <p className="text-white/60 text-xs mb-3 line-clamp-3 flex-grow" title={code.description || 'No description'}>
            {code.description || 'No description provided.'}
          </p>

          {/* Vote Buttons with Enhanced UI */}
          {!code.isVerified && (
            <div className="p-2 border-t border-primary/10 mt-auto flex justify-between items-center gap-1 bg-dark/20">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <button
                    id={`vote-up-${code._id}`}
                    onClick={() => handleVote(code._id, 'up')}
                    disabled={!userId || isLoadingInteraction || Boolean(userHasUpvoted)}
                    className={`flex items-center justify-center gap-0.5 p-1 rounded transition-all duration-300 disabled:opacity-50 ${
                      userHasUpvoted 
                        ? 'text-green-300 bg-green-500/10 scale-110' 
                        : 'text-white/60 hover:bg-white/10 hover:scale-105'
                    } min-w-[40px] h-6`}
                    title={userHasUpvoted 
                      ? "You've already upvoted this code" 
                      : `Upvote this code (${code.upvotes?.length || 0} upvotes)`}
                    aria-label={userHasUpvoted ? "Already upvoted" : "Upvote"}
                  >
                    {isLoadingInteraction ? <LoadingSpinner size="small"/> : <FaThumbsUp size={12} />}
                    <span className="text-[10px] font-medium">{code.upvotes?.length || 0}</span>
                  </button>
                  <button
                    id={`vote-down-${code._id}`}
                    onClick={() => handleVote(code._id, 'down')}
                    disabled={!userId || isLoadingInteraction || Boolean(userHasDownvoted)}
                    className={`flex items-center justify-center gap-0.5 p-1 rounded transition-all duration-300 disabled:opacity-50 ${
                      userHasDownvoted 
                        ? 'text-red-400 bg-red-500/10 scale-110' 
                        : 'text-white/60 hover:bg-white/10 hover:scale-105'
                    } min-w-[40px] h-6`}
                    title={userHasDownvoted 
                      ? "You've already downvoted this code" 
                      : `Downvote this code (${code.downvotes?.length || 0} downvotes)`}
                    aria-label={userHasDownvoted ? "Already downvoted" : "Downvote"}
                  >
                    {isLoadingInteraction ? <LoadingSpinner size="small"/> : <FaThumbsDown size={12} />}
                    <span className="text-[10px] font-medium">{code.downvotes?.length || 0}</span>
                  </button>
                </div>
                
                {/* Enhanced Vote Ratio Display */}
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-white/60">
                    {voteRatio}:{code.downvotes?.length || 0}
                  </div>
                  {totalVotes > 0 && (
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                        style={{ width: `${votePercentage}%` }}
                        title={`${votePercentage}% positive votes`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!code.isVerified && (
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={() => handleReport(code._id, code.title)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg transition-colors bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/40"
                title="Report this code"
                aria-label="Report this code"
              >
                <FaFlag />
                <span className="hidden sm:inline">Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleReport = (codeId: string, codeTitle: string) => {
    setSelectedCodeForReport({ id: codeId, title: codeTitle });
    setReportDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white font-orbitron mb-8 text-center">
        Free Fire Craftland Codes
      </h1>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-secondary rounded-lg p-4 mb-8 border border-primary/20 shadow-md">
         <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-grow w-full md:w-auto">
             <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
             <input
               type="text"
               placeholder="Search by code, description, creator..."
               className="w-full bg-dark text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex-shrink-0 flex md:flex-row flex-col gap-2 w-full md:w-auto">
             <select
               className="bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto"
               value={selectedRegion}
               onChange={(e) => setSelectedRegion(e.target.value)}
             >
               <option value="">All Regions</option>
               {regions.map(region => (
                 <option key={region.code} value={region.code}>
                   {region.flag} {region.name}
                 </option>
               ))}
             </select>
             <select
               className="bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto"
               value={selectedSort}
               onChange={(e) => setSelectedSort(e.target.value)}
             >
               <option value="recent">Most Recent</option>
               <option value="votes">Most Votes</option>
               <option value="likes">Most Liked</option>
             </select>
             <button
               onClick={fetchCraftlandCodes}
               className="bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:bg-primary/80 transition-colors w-full md:w-auto"
             >
               Search
             </button>
           </div>
         </div>
       </div>

      <div className="bg-secondary rounded-lg p-6 mb-8 border border-primary/20">
        <h2 className="text-xl font-bold text-white mb-4">How to Use Craftland Codes</h2>
        <ol className="list-decimal list-inside space-y-2 text-white/80">
          <li>Open Free Fire and go to the Craftland section</li>
          <li>Click on "Enter Code" or "Download Map"</li>
          <li>Copy a code from below and paste it into the text field</li>
          <li>Click 'Confirm' to import the map</li>
          <li>Enjoy playing the custom map!</li>
        </ol>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
         <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-center">
           Error: {error}
         </div>
      ) : (
        <>
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaShieldAlt className="text-green-400" />
                Verified Codes
              </h2>
              <span className="text-sm text-white/60">
                {verifiedCodes.length} codes
              </span>
            </div>
            {verifiedCodes.length > 0 ? (
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                {verifiedCodes.map(code => renderCodeCard(code, false))}
              </div>
            ) : (
              <div className="text-center text-white/60 py-8">
                <FaShieldAlt className="mx-auto text-4xl text-green-400 mb-2" />
                <p className="text-lg">No verified codes available yet.<br />Check back soon!</p>
              </div>
            )}
          </div>

          {communityCodes.length > 0 && (
            <div className="mb-12">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                   <FaUsers className="text-yellow-400" />
                   Community Submissions
                 </h2>
                 <span className="text-sm text-white/60">
                   {communityCodes.length} codes
                 </span>
               </div>
               <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                  {communityCodes.map(code => renderCodeCard(code, true))}
               </div>
            </div>
          )}

           {verifiedCodes.length === 0 && communityCodes.length === 0 && !loading && (
             <div className="text-center text-white/70 py-16">
               <p className="text-xl mb-2">No Craftland codes found.</p>
               <p>Try adjusting your search or filters, or check back later!</p>
             </div>
           )}

           {/* Go to Submissions Button - Only for logged-in users, centered and responsive */}
           {session?.user && (
             <div className="flex justify-center mt-12 mb-8 w-full">
               <Link 
                 href="/profile/submissions" 
                 className="inline-flex items-center px-6 py-3 bg-primary text-black font-semibold rounded-lg shadow hover:bg-primary/80 transition-colors text-base md:text-lg"
               >
                 Go to Submissions
               </Link>
             </div>
           )}
        </>
      )}

      {selectedCodeForReport && (
        <ReportDialog
          isOpen={reportDialogOpen}
          onClose={() => {
            setReportDialogOpen(false);
            setSelectedCodeForReport(null);
          }}
          codeId={selectedCodeForReport.id}
          codeTitle={selectedCodeForReport.title}
        />
      )}
    </div>
  );
}

// Add these styles to your global CSS
const styles = `
  @keyframes vote {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  .animate-vote {
    animation: vote 0.5s ease-in-out;
  }
`; 