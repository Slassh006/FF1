export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white font-orbitron mb-8 text-center">
          About TheFreeFireIndia
        </h1>
        
        <div className="bg-secondary rounded-lg p-6 mb-8 border border-primary/20">
          <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-white/80 mb-4">
            TheFreeFireIndia is dedicated to providing the ultimate hub for Free Fire enthusiasts across India. We strive to create a community where players can find the latest updates, resources, and content to enhance their gaming experience.
          </p>
          <p className="text-white/80">
            Our mission is to connect Free Fire players, share valuable gaming resources, and foster a supportive community that celebrates this popular battle royale game.
          </p>
        </div>
        
        <div className="bg-secondary rounded-lg p-6 mb-8 border border-primary/20">
          <h2 className="text-xl font-bold text-white mb-4">What We Offer</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-primary">Latest Updates</h3>
              <p className="text-white/80">
                Stay informed about game updates, events, and news through our regularly updated blog section.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-primary">Wallpaper Gallery</h3>
              <p className="text-white/80">
                Download high-quality Free Fire wallpapers for your devices, featuring characters, weapons, and maps.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-primary">Redeem Codes</h3>
              <p className="text-white/80">
                Access the latest redeem codes for exclusive in-game rewards, with verification and expiration tracking.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-primary">Craftland Codes</h3>
              <p className="text-white/80">
                Discover community-created maps and custom game modes through our curated collection of Craftland codes.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-secondary rounded-lg p-6 mb-8 border border-primary/20">
          <h2 className="text-xl font-bold text-white mb-4">Our Team</h2>
          <p className="text-white/80 mb-4">
            TheFreeFireIndia is run by a small team of passionate Free Fire players who wanted to create a dedicated resource for the Indian Free Fire community.
          </p>
          <p className="text-white/80">
            We're constantly working to improve the site and add new features to better serve our community. If you have suggestions or feedback, we'd love to hear from you!
          </p>
        </div>
        
        <div className="bg-secondary rounded-lg p-6 border border-primary/20">
          <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
          <p className="text-white/80 mb-4">
            Have questions, suggestions, or want to contribute? We'd love to hear from you!
          </p>
          <div className="space-y-2 text-white/80">
            <p>📧 Email: <a href="mailto:contact@thefreefire.in" className="text-primary hover:underline">contact@thefreefire.in</a></p>
            <p>🎮 Discord: <a href="https://discord.gg/thefreefire" className="text-primary hover:underline">discord.gg/thefreefire</a></p>
            <p>📱 Instagram: <a href="https://instagram.com/thefreefireindia" className="text-primary hover:underline">@thefreefireindia</a></p>
          </div>
        </div>
      </div>
    </div>
  );
} 