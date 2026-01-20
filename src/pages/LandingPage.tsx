import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, MessageCircle, ChevronDown, Sparkles, MapPin, Star, Calendar, Users } from 'lucide-react';
import ChatBot from '../components/ChatBot';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-xl shadow-lg shadow-teal-500/10'
          : 'bg-transparent'
      }`}>
        <nav className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center group cursor-pointer">
              <img
                src="/img_3914_(1).png"
                alt="Cox Cargill - Space of Happiness"
                className="h-12 w-auto object-contain brightness-110"
              />
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-300 hover:text-teal-400 transition-all duration-300 font-medium relative group">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#about" className="text-gray-300 hover:text-teal-400 transition-all duration-300 font-medium relative group">
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#properties" className="text-gray-300 hover:text-teal-400 transition-all duration-300 font-medium relative group">
                Properties
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#contact" className="text-gray-300 hover:text-teal-400 transition-all duration-300 font-medium relative group">
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 group-hover:w-full transition-all duration-300"></span>
              </a>

              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-300 hover:text-teal-400 transition-all duration-300 font-medium">
                  <span>Portals</span>
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <div className="absolute right-0 mt-4 w-56 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-teal-500/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:mt-2 transition-all duration-300 border border-teal-500/20 overflow-hidden">
                  <button
                    onClick={() => navigate('/admin/login')}
                    className="block w-full text-left px-6 py-4 text-gray-300 hover:bg-teal-500/10 hover:text-teal-400 transition-all duration-300 border-b border-gray-800/50"
                  >
                    Admin Portal
                  </button>
                  <button
                    onClick={() => navigate('/b2b')}
                    className="block w-full text-left px-6 py-4 text-gray-300 hover:bg-teal-500/10 hover:text-teal-400 transition-all duration-300 border-b border-gray-800/50"
                  >
                    B2B Agent Portal
                  </button>
                  <button
                    onClick={() => navigate('/staff/login')}
                    className="block w-full text-left px-6 py-4 text-gray-300 hover:bg-teal-500/10 hover:text-teal-400 transition-all duration-300"
                  >
                    Staff Portal
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-300 hover:text-teal-400 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden mt-6 pb-6 animate-fade-in">
              <div className="flex flex-col space-y-4 bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-teal-500/20">
                <a href="#home" className="text-gray-300 hover:text-teal-400 transition-colors font-medium">Home</a>
                <a href="#about" className="text-gray-300 hover:text-teal-400 transition-colors font-medium">About</a>
                <a href="#properties" className="text-gray-300 hover:text-teal-400 transition-colors font-medium">Properties</a>
                <a href="#contact" className="text-gray-300 hover:text-teal-400 transition-colors font-medium">Contact</a>
                <div className="pt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => navigate('/admin/login')}
                    className="block w-full text-left py-3 text-gray-300 hover:text-teal-400 transition-colors font-medium"
                  >
                    Admin Portal
                  </button>
                  <button
                    onClick={() => navigate('/b2b')}
                    className="block w-full text-left py-3 text-gray-300 hover:text-teal-400 transition-colors font-medium"
                  >
                    B2B Agent Portal
                  </button>
                  <button
                    onClick={() => navigate('/staff/login')}
                    className="block w-full text-left py-3 text-gray-300 hover:text-teal-400 transition-colors font-medium"
                  >
                    Staff Portal
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-teal-900/40 to-black/70 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
          <img
            src="/whatsapp_image_2026-01-20_at_04.01.34_(1).jpeg"
            alt="Coxcargill Glamps"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-black/30 z-10"></div>
        </div>

        <div className="absolute top-0 left-0 right-0 bottom-0 z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-20 text-center px-6 max-w-6xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 backdrop-blur-sm border border-teal-400/30 rounded-full mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-teal-400" />
            <span className="text-teal-300 text-sm font-medium">Premium Glamping Experience</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight animate-fade-in-up">
            <span className="block text-white mb-2">Escape to Nature's</span>
            <span className="block bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Luxury Haven
            </span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Experience the perfect blend of adventure and comfort in our premium glamping tents,
            nestled in the breathtaking mountains
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => setIsChatOpen(true)}
              className="group relative px-10 py-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-semibold overflow-hidden shadow-lg shadow-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/60 transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Check Availability
              </span>
            </button>

            <a
              href="#properties"
              className="group px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-full font-semibold hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <span>Explore Properties</span>
              <ChevronDown className="w-5 h-5 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-20 max-w-4xl mx-auto">
            {[
              { icon: MapPin, label: 'Mountain Views' },
              { icon: Star, label: 'Luxury Comfort' },
              { icon: Users, label: 'Family Friendly' },
              { icon: Sparkles, label: 'Premium Service' }
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-3 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-teal-400/50 transition-all duration-300"
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <feature.icon className="w-8 h-8 text-teal-400" />
                <span className="text-gray-300 text-sm font-medium text-center">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20">
          <a href="#about" className="text-teal-400 animate-bounce hover:text-teal-300 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium">Discover More</span>
              <ChevronDown className="w-8 h-8" />
            </div>
          </a>
        </div>
      </section>

      <section id="about" className="relative py-32 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-teal-500/10 backdrop-blur-sm border border-teal-400/30 rounded-full text-teal-400 text-sm font-medium mb-6">
                About Us
              </span>
              <h2 className="text-4xl md:text-6xl font-bold mb-8">
                <span className="block text-white mb-2">Welcome to</span>
                <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  COX CARGILL
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <p className="text-lg text-gray-300 leading-relaxed">
                  Nestled in the majestic mountains, COX CARGILL offers an extraordinary escape
                  where luxury meets nature. Our premium glamping experience redefines outdoor adventure
                  with modern comfort and breathtaking views.
                </p>
                <p className="text-lg text-gray-300 leading-relaxed">
                  Whether you're seeking a romantic getaway, a family adventure, or a peaceful retreat,
                  our meticulously designed tents provide the perfect sanctuary. Wake up to stunning
                  mountain vistas and fall asleep under a blanket of stars.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  {['Mountain Views', 'Premium Comfort', '5-Star Service', 'Nature Immersion'].map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-teal-500/10 border border-teal-400/30 rounded-full text-teal-400 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl border border-teal-500/20 shadow-2xl">
                  <div className="space-y-6">
                    {[
                      { number: '2500+', label: 'Happy Guests' },
                      { number: '100%', label: 'Satisfaction Rate' },
                      { number: '24/7', label: 'Customer Support' }
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300">
                        <div className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                          {stat.number}
                        </div>
                        <div className="text-gray-300 font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="properties" className="relative py-32 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 bg-teal-500/10 backdrop-blur-sm border border-teal-400/30 rounded-full text-teal-400 text-sm font-medium mb-6">
              Our Properties
            </span>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Luxury Accommodations
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose from our carefully curated selection of premium glamping experiences
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                image: '/whatsapp_image_2026-01-20_at_04.01.40_(1).jpeg',
                title: 'Attic Frame Standard',
                description: 'Modern A-frame structures with panoramic glass facades and mountain views',
                features: ['King Bed', 'Glass Facade', 'Mountain View']
              },
              {
                image: '/whatsapp_image_2026-01-20_at_04.01.40.jpeg',
                title: 'Attic Frame Premium',
                description: 'Luxury A-frame with forest immersion and premium interiors',
                features: ['Queen Bed', 'Forest View', 'Premium Decor']
              },
              {
                image: '/whatsapp_image_2026-01-20_at_04.22.59.jpeg',
                title: 'Cocoon Glamp',
                description: 'Unique cocoon-style glamping with stunning panoramic windows',
                features: ['King Bed', 'Panoramic View', 'Unique Design']
              }
            ].map((property, index) => (
              <div
                key={index}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-800 hover:border-teal-500/50 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-teal-500/20">
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div className="absolute top-4 right-4 bg-teal-500/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4 fill-white" />
                      <span>Premium</span>
                    </div>
                  </div>

                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">
                      {property.title}
                    </h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      {property.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {property.features.map((feature, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-teal-500/10 border border-teal-400/30 rounded-full text-teal-400 text-xs font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <button className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300 transform group-hover:scale-105">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative py-32 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-2 bg-teal-500/10 backdrop-blur-sm border border-teal-400/30 rounded-full text-teal-400 text-sm font-medium mb-6">
              Get in Touch
            </span>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Start Your Journey
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Have questions? Our team is here to help make your glamping experience unforgettable
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <a
                href="tel:+919496960809"
                className="group px-10 py-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-semibold shadow-lg shadow-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/60 transition-all duration-300 transform hover:scale-105"
              >
                Call Us Now
              </a>
              <a
                href="mailto:coxcragill@gmail.com"
                className="px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-full font-semibold hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105"
              >
                Email Us
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              {[
                { icon: MapPin, title: 'Location', value: 'Thalavanji, Koviloor - Top Station Rd, Vattavada, Kerala 685615' },
                { icon: MessageCircle, title: 'Phone', value: '+91 9496960809' },
                { icon: Star, title: 'Email', value: 'coxcragill@gmail.com' }
              ].map((contact, index) => (
                <div
                  key={index}
                  className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-teal-400/50 transition-all duration-300"
                >
                  <contact.icon className="w-8 h-8 text-teal-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">{contact.title}</h3>
                  <p className="text-gray-400 text-sm">{contact.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative bg-black border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img
                src="/img_3914_(1).png"
                alt="Cox Cargill - Space of Happiness"
                className="h-10 w-auto object-contain brightness-110"
              />
            </div>

            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>&copy; 2026 COX CARGILL. All rights reserved.</p>
              <p className="mt-1">Crafted with luxury and nature in mind</p>
            </div>
          </div>
        </div>
      </footer>

      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 p-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full shadow-2xl shadow-teal-500/50 hover:shadow-teal-500/70 transition-all duration-300 transform hover:scale-110 z-40 group"
      >
        <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
      </button>

      {isChatOpen && <ChatBot onClose={() => setIsChatOpen(false)} />}
    </div>
  );
}
