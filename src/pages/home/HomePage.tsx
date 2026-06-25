// app/page.tsx  (or pages/index.tsx)
// ─────────────────────────────────────────────
// Basit Mobile Zone — Home Page
// Built entirely from the reusable BMZ UI component library
// ─────────────────────────────────────────────

import { useState } from "react";
import {
  Button,
  Badge,
  Card,
  ProductCard,
  StatCard,
  Section,
  SectionHeader,
  AnimateIn,
  Tabs,
  PageBackground,
} from "../../components/ui/index";
import {
  ArrowRight,
  Phone,
  Wrench,
  Battery,
  Droplets,
  Lock,
  Smile,
  Smartphone,
  Star,
  Target,
  CheckCircle,
  Tag,
  Zap,
  RefreshCw,
  MapPin,
  Clock,
  MessageCircle,
  Cpu,
} from "lucide-react";

import { Layout } from "../../layout";
import { useAppSelector } from "../../app/index";

// ── Data ─────────────────────────────────────
const PHONES = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: "PKR 459,999",
    oldPrice: "PKR 499,999",
    description: "Titanium. So strong. So light. So Pro.",
    icon: Smartphone,
    badge: { label: "Best Seller", variant: "yellow" as const },
    gradient: "from-purple-600 to-blue-600",
    rating: 5,
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: "PKR 389,999",
    description: "AI-powered. Galaxy's most powerful phone.",
    icon: Cpu,
    badge: { label: "New", variant: "blue" as const },
    gradient: "from-blue-600 to-purple-600",
    rating: 5,
  },
  {
    id: 3,
    name: "OnePlus 12",
    price: "PKR 179,999",
    description: "Hasselblad camera. 100W fast charge.",
    icon: Zap,
    badge: { label: "Hot Deal", variant: "orange" as const },
    gradient: "from-purple-700 to-yellow-500",
    rating: 4,
  },
  {
    id: 4,
    name: "Xiaomi 14 Ultra",
    price: "PKR 249,999",
    description: "Leica optics. Photography redefined.",
    icon: Smartphone,
    badge: { label: "Popular", variant: "purple" as const },
    gradient: "from-yellow-500 to-purple-600",
    rating: 4,
  },
];

const PHONE_TABS = [
  { key: "all", label: "All", count: 200 },
  { key: "apple", label: "Apple", count: 48 },
  { key: "samsung", label: "Samsung", count: 62 },
  { key: "oneplus", label: "OnePlus", count: 31 },
  { key: "xiaomi", label: "Xiaomi", count: 39 },
];

const SERVICES = [
  {
    icon: Wrench,
    iconColor: "text-blue-400",
    title: "Screen Repair",
    desc: "Cracked screen? Fixed same day.",
  },
  {
    icon: Battery,
    iconColor: "text-green-400",
    title: "Battery Replace",
    desc: "Restore your phone's life in 30 mins.",
  },
  {
    icon: Droplets,
    iconColor: "text-cyan-400",
    title: "Water Damage",
    desc: "Expert liquid damage restoration.",
  },
  {
    icon: Lock,
    iconColor: "text-purple-400",
    title: "Network Unlock",
    desc: "Unlock any carrier, any phone.",
  },
];

const BRANDS = [
  "Apple",
  "Samsung",
  "OnePlus",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "Realme",
  "Google",
];

const STATS = [
  {
    number: "10K+",
    label: "Happy Customers",
    icon: Smile,
    accent: "yellow" as const,
  },
  {
    number: "5K+",
    label: "Phones Sold",
    icon: Smartphone,
    accent: "purple" as const,
  },
  {
    number: "8+",
    label: "Years Experience",
    icon: Star,
    accent: "blue" as const,
  },
  { number: "24/7", label: "Support", icon: Target, accent: "green" as const },
];

const WHY_US = [
  { icon: CheckCircle, text: "100% Genuine Products with Official Warranty" },
  { icon: Tag, text: "Best Prices Guaranteed — We Beat Any Quote" },
  { icon: Zap, text: "Same-Day Repairs by Certified Technicians" },
  { icon: RefreshCw, text: "Easy Exchange & Upgrade Program" },
];

// ── Component ─────────────────────────────────

export default function HomePage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  console.log("🔍 HomePage - Auth State:", { isAuthenticated, user });

  const [activeTab, setActiveTab] = useState("all");

  // Filter phones (demo — real app would filter from API)
  const visiblePhones = activeTab === "all" ? PHONES : PHONES.slice(0, 2);

  return (
    <PageBackground>
      <Layout title="Home - Mobile Shop" navbar footer>
        {/* ── Hero ── */}
        <section className="relative min-h-screen flex items-center pt-24 pb-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              {/* Left */}
              <div className="space-y-7 animate-hero-fade">
                <Badge variant="yellow" dot>
                  Islamabad's #1 Mobile Shop
                </Badge>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                  <span className="block text-white">Your Dream</span>
                  <span className="block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                    Phone
                  </span>
                  <span className="block text-white">Awaits.</span>
                </h1>

                <p className="text-gray-400 text-lg sm:text-xl leading-relaxed max-w-lg">
                  Latest smartphones, accessories & expert repairs — all under
                  one roof. Visit{" "}
                  <span className="text-yellow-400 font-semibold">
                    Mobile Shop
                  </span>{" "}
                  today.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight size={15} />}
                  >
                    Browse Phones
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    iconLeft={<Phone className="text-green-500" size={15} />}
                  >
                    Call Us Now
                  </Button>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-5 pt-2">
                  <div className="flex -space-x-2">
                    {["🧑", "👩", "👨", "🧕"].map((e, i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full bg-linear-to-br from-purple-600 to-blue-600 border-2 border-[#0b0614] flex items-center justify-center text-sm"
                      >
                        {e}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex text-yellow-400 text-sm gap-0.5">
                      ★★★★★
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      10,000+ happy customers
                    </p>
                  </div>
                </div>
              </div>

              {/* Right — Featured Phone Card */}
              <div className="flex justify-center animate-hero-float">
                <div className="relative w-full max-w-sm">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-400/15 via-purple-600/15 to-blue-600/15 blur-2xl scale-110" />
                  <Card padding="lg" className="relative">
                    <div className="text-6xl text-center mb-4 drop-shadow-2xl">
                      <Smartphone size={64} className="mx-auto text-yellow-400" />
                    </div>
                    <Card.Header>
                      <div className="text-center space-y-1">
                        <Badge variant="yellow" className="mb-2">
                          FEATURED
                        </Badge>
                        <h3 className="text-white font-black text-xl">
                          iPhone 15 Pro Max
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Natural Titanium · 256GB
                        </p>
                      </div>
                    </Card.Header>
                    <Card.Footer>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-500 text-xs">Starting from</p>
                          <p className="text-yellow-400 font-black text-2xl">
                            PKR 459,999
                          </p>
                        </div>
                        <Button variant="secondary" size="sm">
                          Buy Now
                        </Button>
                      </div>
                    </Card.Footer>

                    {/* In-stock badge */}
                    <div className="absolute -top-3 -right-3">
                      <Badge variant="green" dot>
                        In Stock
                      </Badge>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">
              Scroll
            </span>
            <div className="w-px h-8 bg-gradient-to-b from-gray-500 to-transparent" />
          </div>
        </section>

        {/* ── Stats ── */}
        <Section py="sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {STATS.map((s, i) => {
              const IconComponent = s.icon;
              return (
                <AnimateIn key={s.label} delay={i * 100}>
                  <StatCard
                    label={s.label}
                    value={s.number}
                    icon={<IconComponent size={24} className="text-yellow-400" />}
                    accent={s.accent}
                  />
                </AnimateIn>
              );
            })}
          </div>
        </Section>

        {/* ── Featured Phones ── */}
        <Section id="phones">
          <SectionHeader
            eyebrow="Our Collection"
            title="Featured Phones"
            subtitle="Hand-picked, best-priced, always in stock"
          />

          <AnimateIn className="flex justify-center mb-10">
            <Tabs
              tabs={PHONE_TABS}
              active={activeTab}
              onChange={setActiveTab}
            />
          </AnimateIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visiblePhones.map((phone, i) => (
              <AnimateIn key={phone.id} delay={i * 120}>
                <ProductCard
                  name={phone.name}
                  price={phone.price}
                  oldPrice={phone.oldPrice}
                  description={phone.description}
                  icon={phone.icon}
                  badge={phone.badge}
                  gradient={phone.gradient}
                  rating={phone.rating}
                  onBuy={() => alert(`Buying ${phone.name}`)}
                  onWishlist={() => {}}
                />
              </AnimateIn>
            ))}
          </div>

          <AnimateIn className="text-center mt-10">
            <Button variant="outline" size="lg" icon="→">
              View All 200+ Phones
            </Button>
          </AnimateIn>
        </Section>

        {/* ── Services ── */}
        <Section id="services" tinted>
          <SectionHeader
            eyebrow="Expert Care"
            title="Repair Services"
            subtitle="Professional repairs by certified technicians"
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => {
              const IconComponent = s.icon;
              return (
                <AnimateIn key={s.title} delay={i * 100}>
                  <Card hoverable glowColor="yellow" className="group">
                    <div className={`${s.iconColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent size={36} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-white font-bold text-base mb-2">
                      {s.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {s.desc}
                    </p>
                    <div className="mt-4">
                      <Button variant="ghost" size="sm" icon="→">
                        Learn more
                      </Button>
                    </div>
                  </Card>
                </AnimateIn>
              );
            })}
          </div>
        </Section>

        {/* ── Brands ── */}
        <Section id="brands">
          <SectionHeader
            eyebrow="Official Dealers"
            title="Top Brands"
            subtitle="Authorized reseller for all major brands"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BRANDS.map((brand, i) => (
              <AnimateIn key={brand} delay={i * 80}>
                <Card hoverable glowColor="purple" padding="sm">
                  <div className="flex items-center justify-center py-3">
                    <span className="text-gray-300 group-hover:text-white font-bold text-lg transition-colors">
                      {brand}
                    </span>
                  </div>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </Section>

        {/* ── Why Us ── */}
        <Section tinted>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <AnimateIn className="space-y-6">
              <span className="text-yellow-400 text-sm font-bold tracking-widest uppercase">
                Why Choose Us
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                The Best Mobile{" "}
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Experience
                </span>{" "}
                in Islamabad
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                With 8+ years in the business, Mobile Shop offers
                unbeatable prices, genuine products, and expert after-sales
                support.
              </p>
              <div className="space-y-4 pt-2">
                {WHY_US.map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-4 group">
                      <IconComponent
                        size={20}
                        className="text-yellow-400 group-hover:scale-125 transition-transform flex-shrink-0"
                      />
                      <span className="text-gray-300 group-hover:text-white transition-colors">
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </AnimateIn>

            {/* Right — Store card */}
            <AnimateIn delay={200}>
              <Card padding="lg">
                <div className="space-y-5">
                  <div className="text-4xl text-red-400">
                    <MapPin size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-1">
                      Find Us In Islamabad
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Shop #B-14, Blue Area Commercial Market, Jinnah Avenue,
                      Islamabad
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card padding="sm" className="bg-white/5">
                      <p className="text-yellow-400 font-bold text-sm flex items-center gap-2">
                        <Clock size={14} />
                        Hours
                      </p>
                      <p className="text-gray-300 text-sm mt-1">
                        9 AM – 9 PM Daily
                      </p>
                    </Card>
                    <Card padding="sm" className="bg-white/5">
                      <p className="text-blue-400 font-bold text-sm flex items-center gap-2">
                        <Phone size={14} />
                        Call
                      </p>
                      <p className="text-gray-300 text-sm mt-1">0300-1234567</p>
                    </Card>
                  </div>
                  <Button variant="primary" size="md" fullWidth icon="→">
                    Get Directions on Maps
                  </Button>
                </div>
              </Card>
            </AnimateIn>
          </div>
        </Section>

        {/* ── CTA Banner ── */}
        <Section id="contact">
          <AnimateIn>
            <div className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-blue-700 to-purple-800" />
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, #facc15 0%, transparent 50%), radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 50%)",
                }}
              />
              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  Ready for Your{" "}
                  <span className="text-yellow-400">New Phone?</span>
                </h2>
                <p className="text-purple-200 text-lg max-w-xl mx-auto">
                  Visit us today or WhatsApp us — exclusive deals & EMI plans
                  available!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    iconLeft={<MessageCircle size={18} />}
                  >
                    WhatsApp Now
                  </Button>
                  <Button variant="dark" size="lg">
                    View Deals
                  </Button>
                </div>
              </div>
            </div>
          </AnimateIn>
        </Section>

        {/* Hero animations */}
        <style>{`
        @keyframes hero-fade  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hero-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .animate-hero-fade  { animation: hero-fade 0.9s cubic-bezier(.22,1,.36,1) forwards }
        .animate-hero-float { animation: hero-fade 0.9s 0.2s cubic-bezier(.22,1,.36,1) forwards,
                                         hero-float 5s 1.2s ease-in-out infinite }
      `}</style>
      </Layout>
    </PageBackground>
  );
}
