'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import RootTemplate from './components/RootTemplate';
import Hero from './components/home/Hero';
import FeaturedBlogs from './components/home/FeaturedBlogs';
import RedeemCodeSection from './components/home/RedeemCodeSection';
import CraftlandHighlights from './components/home/CraftlandHighlights';

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const referralSuccess = searchParams.get('referral_success');

    if (referralSuccess === 'true') {
      // TODO: Replace with actual reward amount if dynamic (fetch from settings/context)
      const rewardAmount = 1; 
      toast.success(`Welcome! You received ${rewardAmount} coin${rewardAmount !== 1 ? 's' : ''} for joining via referral!`);

      // Clean the URL by removing the query parameter, replacing current history entry
      router.replace('/', { scroll: false }); 
    }
    // Add dependencies for the effect
  }, [searchParams, router]); 

  return (
    <RootTemplate>
      <Hero />
      <RedeemCodeSection />
      <FeaturedBlogs />
      <CraftlandHighlights />
    </RootTemplate>
  );
} 