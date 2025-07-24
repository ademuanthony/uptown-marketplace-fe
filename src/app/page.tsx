import HeroSection from '@/components/home/HeroSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import TrendingProducts from '@/components/home/TrendingProducts';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <CategoryGrid />
        <TrendingProducts />
      </div>
    </main>
  );
}
