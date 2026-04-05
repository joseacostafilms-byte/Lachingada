/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  Search,
  UtensilsCrossed,
  Beer,
  Pizza,
  Flame,
  Info,
  MessageCircle,
  Hash,
  ChevronLeft,
  User,
  Phone
} from 'lucide-react';
import { MENU_DATA, CATEGORIES, MenuItem, RESTAURANT_WHATSAPP, PROMOS } from './constants';
import { cn } from './lib/utils';

interface CartItem extends MenuItem {
  quantity: number;
}

const ITEM_COLORS = [
  'bg-mexican-green',
  'bg-mexican-pink',
  'bg-mexican-blue',
  'bg-mexican-teal',
  'bg-mexican-orange',
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ name: '', phone: '' });
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [showTableError, setShowTableError] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
  const [recommendations, setRecommendations] = useState<MenuItem[]>([]);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const promoScrollRef = useRef<HTMLDivElement>(null);

  // Background slider for Welcome Screen - Random
  useEffect(() => {
    if (!isLoggedIn) {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * 4);
        setCurrentBgIndex(randomIndex);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Auto-slide promos randomly every 4 seconds
  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * PROMOS.length);
        setCurrentPromoIndex(randomIndex);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (promoScrollRef.current) {
      const scrollAmount = promoScrollRef.current.offsetWidth * currentPromoIndex;
      promoScrollRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [currentPromoIndex]);

  const filteredMenu = useMemo(() => {
    return MENU_DATA.filter(item => {
      const matchesCategory = searchQuery ? true : item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Tragos': return <Beer className="w-5 h-5" />;
      case 'Pizzas': return <Pizza className="w-5 h-5" />;
      case 'Parrillas': return <Flame className="w-5 h-5" />;
      default: return <UtensilsCrossed className="w-5 h-5" />;
    }
  };

  const getRecommendations = (currentCart: CartItem[]) => {
    const hasDrinks = currentCart.some(item => item.category === 'Tragos');
    const recs: MenuItem[] = [];
    
    if (!hasDrinks) {
      const drinks = MENU_DATA.filter(item => item.category === 'Tragos');
      // Get 2 random drinks
      const shuffled = [...drinks].sort(() => 0.5 - Math.random());
      recs.push(...shuffled.slice(0, 2));
    }
    
    // Also add a popular item from another category if we need more
    if (recs.length < 3) {
      const popular = MENU_DATA.filter(item => item.category === 'Hamburguesas' || item.category === 'Pizzas');
      const shuffled = [...popular].sort(() => 0.5 - Math.random());
      recs.push(...shuffled.slice(0, 3 - recs.length));
    }
    
    return recs;
  };

  const sendToWhatsApp = () => {
    if (!tableNumber) {
      setShowTableError(true);
      const input = document.getElementById('table-input');
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const orderDetails = cart.map(item => 
      `• ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})`
    ).join('\n');

    const message = 
      `*NUEVO PEDIDO - LA CHINGADA*\n\n` +
      `👤 *Cliente:* ${userData.name}\n` +
      `📞 *Teléfono:* ${userData.phone}\n` +
      `📍 *Mesa:* ${tableNumber}\n\n` +
      `*Detalle del pedido:*\n${orderDetails}\n\n` +
      `💰 *Total a pagar:* $${cartTotal.toFixed(2)}\n\n` +
      `_Pedido enviado desde el Menú Digital_`;

    const whatsappUrl = `https://wa.me/${RESTAURANT_WHATSAPP}?text=${encodeURIComponent(message)}`;
    
    // Calculate recommendations before clearing cart
    const recs = getRecommendations(cart);
    setRecommendations(recs);

    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setCart([]);
    setIsCartOpen(false);
    setShowThankYou(true);
  };

  useEffect(() => {
    if (categoryScrollRef.current) {
      const activeBtn = categoryScrollRef.current.querySelector(`[data-category="${activeCategory}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeCategory]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Background Slider */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBgIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <img 
                src={`https://picsum.photos/seed/bg${currentBgIndex}/1080/1920`}
                className="w-full h-full object-cover"
                alt="background"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/70 z-10" />
        </div>

        {/* Welcome Form */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-20 w-full max-w-md px-8 text-center"
        >
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2 italic">
            LA <span className="text-mexican-green">CHINGADA</span>
          </h1>
          <p className="text-mexican-pink font-bold uppercase tracking-widest text-xs mb-12">Bienvenido a la experiencia</p>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mexican-blue" />
              <input 
                type="text" 
                placeholder="Tu Nombre"
                value={userData.name}
                onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-mexican-blue transition-all"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mexican-green" />
              <input 
                type="tel" 
                placeholder="Tu Teléfono"
                value={userData.phone}
                onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-mexican-green transition-all"
              />
            </div>
            <button 
              onClick={() => userData.name && userData.phone && setIsLoggedIn(true)}
              disabled={!userData.name || !userData.phone}
              className="w-full bg-mexican-pink text-white font-black py-5 rounded-2xl shadow-2xl shadow-mexican-pink/30 text-xl mt-8 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
            >
              Entrar al Menú
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="p-6 pt-8 flex flex-col gap-4 sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-zinc-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-mexican-pink leading-none">
              LA <span className="text-mexican-green">CHINGADA</span>
            </h1>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">Sabor auténtico mexicano</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-mexican-pink transition-colors shadow-sm"
          >
            <ShoppingCart className="w-6 h-6 text-zinc-800" />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-mexican-pink text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Busca tu plato favorito..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-mexican-pink transition-colors text-zinc-800"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {/* Promo Banner */}
        {!searchQuery && (
          <div className="mb-8">
            <div 
              ref={promoScrollRef}
              className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory"
            >
              {PROMOS.map((promo) => (
                <div 
                  key={promo.id}
                  className="min-w-full snap-center relative aspect-[16/12] overflow-hidden"
                >
                  <img 
                    src={promo.image} 
                    alt={promo.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={promo.id}
                    >
                      <span className="bg-mexican-pink text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                        Promoción Especial
                      </span>
                      <h3 className="text-white font-black text-3xl leading-tight tracking-tighter uppercase italic">{promo.title}</h3>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {PROMOS.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    currentPromoIndex === i ? "bg-mexican-pink w-6" : "bg-zinc-200"
                  )} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {!searchQuery && (
          <div 
            ref={categoryScrollRef}
            className="px-6 mb-8 overflow-x-auto no-scrollbar flex gap-4 pb-2"
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                data-category={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "flex flex-col items-center gap-2 min-w-[70px] transition-all duration-300",
                  activeCategory === cat ? "scale-105" : "opacity-40"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                  activeCategory === cat 
                    ? "bg-mexican-pink text-white" 
                    : "bg-zinc-50 text-zinc-500 border border-zinc-100"
                )}>
                  {getCategoryIcon(cat)}
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-tighter text-center leading-none",
                  activeCategory === cat ? "text-mexican-pink" : "text-zinc-400"
                )}>
                  {cat}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Menu Items - Standard List Style */}
        <div className="px-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredMenu.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={item.id}
                className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-zinc-100 shadow-sm group active:scale-[0.98] transition-all"
              >
                {/* Image */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden relative flex-shrink-0">
                  <img 
                    src={`https://picsum.photos/seed/${item.id}/300/300`}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => setSelectedItem(item)}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Info className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-zinc-900 leading-tight uppercase tracking-tighter truncate">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-[10px] font-bold leading-tight mb-3 line-clamp-2">
                    {item.description || "Receta tradicional con el toque secreto de La Chingada."}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black tracking-tighter text-mexican-pink">
                      ${item.price.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-zinc-900 text-white p-2 rounded-xl shadow-lg active:scale-90 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[48px] z-50 p-8 pt-4 shadow-2xl flex flex-col"
            >
              <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Tu Pedido</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-3 bg-zinc-50 rounded-2xl">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="mb-8">
                <label className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2 block">Número de Mesa</label>
                <div className="relative">
                  <Hash className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    showTableError ? "text-red-500" : "text-mexican-pink"
                  )} />
                  <input 
                    id="table-input"
                    type="number" 
                    placeholder="Ej: 5"
                    value={tableNumber}
                    onChange={(e) => {
                      setTableNumber(e.target.value);
                      if (e.target.value) setShowTableError(false);
                    }}
                    className={cn(
                      "w-full bg-zinc-50 border rounded-2xl py-4 pl-11 pr-4 text-lg font-black text-zinc-900 focus:outline-none transition-all",
                      showTableError ? "border-red-500 bg-red-50" : "border-zinc-100 focus:border-mexican-pink"
                    )}
                  />
                </div>
                {showTableError && (
                  <p className="text-red-500 text-[10px] font-bold mt-2 uppercase tracking-wider">Por favor indica tu mesa para procesar el pedido</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto mb-8 pr-2 custom-scrollbar min-h-[150px]">
                {cart.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Vacío</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-extrabold text-zinc-900 leading-tight">{item.name}</h4>
                          <p className="text-mexican-pink font-black text-sm mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-4 bg-zinc-50 p-1.5 rounded-2xl">
                          <button onClick={() => removeFromCart(item.id)} className="p-2"><Minus className="w-4 h-4 text-zinc-400" /></button>
                          <span className="font-black text-zinc-900 min-w-[24px] text-center">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="p-2"><Plus className="w-4 h-4 text-mexican-pink" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pt-6 border-t border-zinc-100">
                    <span className="text-zinc-400 font-black uppercase tracking-widest text-xs">Total</span>
                    <span className="text-4xl font-black text-zinc-900 tracking-tighter">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={sendToWhatsApp}
                    className="w-full bg-mexican-pink text-white font-black py-5 rounded-3xl shadow-xl shadow-mexican-pink/30 flex items-center justify-center gap-3 text-xl"
                  >
                    <MessageCircle className="w-6 h-6 fill-current" />
                    Pedir por WhatsApp
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      {cartCount > 0 && !isCartOpen && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-30"
        >
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-mexican-pink text-white font-black py-5 rounded-3xl shadow-2xl flex justify-between items-center px-8"
          >
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-6 h-6" />
              <span className="text-lg tracking-tighter">Ver Pedido</span>
            </div>
            <span className="bg-white/20 px-4 py-1.5 rounded-xl text-lg font-black tracking-tighter">${cartTotal.toFixed(2)}</span>
          </button>
        </motion.div>
      )}

      {/* Item Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none"
            >
              <div className="bg-white rounded-[48px] w-full max-w-sm overflow-hidden shadow-2xl pointer-events-auto">
                <div className="relative h-64">
                  <img 
                    src={`https://picsum.photos/seed/${selectedItem.id}/600/800`}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{selectedItem.name}</h2>
                    <span className="text-2xl font-black text-mexican-pink tracking-tighter">${selectedItem.price.toFixed(2)}</span>
                  </div>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
                    {selectedItem.description || "Nuestra receta especial preparada con los ingredientes más frescos y el auténtico sabor de México."}
                  </p>
                  <button 
                    onClick={() => {
                      addToCart(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="w-full bg-zinc-900 text-white font-black py-5 rounded-3xl shadow-xl flex items-center justify-center gap-3 text-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Agregar al Pedido
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Thank You Modal with Recommendations */}
      <AnimatePresence>
        {showThankYou && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-mexican-blue/90 backdrop-blur-xl z-[100]"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-[48px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-8 text-center border-b border-zinc-100">
                  <div className="w-20 h-20 bg-mexican-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-5xl">😊</span>
                  </div>
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2 italic">
                    ¡GRACIAS, <span className="text-mexican-pink uppercase">{userData.name}</span>!
                  </h2>
                  <p className="text-zinc-500 font-bold text-sm leading-tight">
                    Tu pedido ha sido enviado a cocina. ¡En breve estará en tu mesa!
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                  <h3 className="text-mexican-blue font-black uppercase tracking-widest text-[10px] mb-6 text-center">
                    ¿Te provoca algo más?
                  </h3>
                  
                  <div className="space-y-4">
                    {recommendations.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-3xl border border-zinc-100">
                        <img 
                          src={`https://picsum.photos/seed/${item.id}/100/100`}
                          className="w-16 h-16 rounded-2xl object-cover"
                          alt={item.name}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-zinc-900 text-xs uppercase truncate">{item.name}</h4>
                          <p className="text-mexican-pink font-black text-sm">${item.price.toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => {
                            addToCart(item);
                            setShowThankYou(false);
                            setIsCartOpen(true);
                          }}
                          className="bg-zinc-900 text-white p-2 rounded-xl"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-mexican-pink/10 rounded-3xl border border-mexican-pink/20">
                    <p className="text-mexican-pink font-black text-[10px] uppercase tracking-widest text-center mb-2">🔥 No te pierdas</p>
                    <p className="text-zinc-900 font-bold text-xs text-center">¡Pregunta por nuestras promociones del día!</p>
                  </div>
                </div>

                <div className="p-8 pt-0">
                  <button 
                    onClick={() => setShowThankYou(false)}
                    className="w-full bg-zinc-900 text-white font-black py-5 rounded-3xl shadow-xl text-lg"
                  >
                    Seguir Navegando
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
