/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  Phone,
  Mail,
  History,
  CreditCard,
  Shield,
  Lock,
  AlertCircle,
  Settings,
  TrendingUp,
  Users,
  Image as ImageIcon,
  FileText,
  LogOut,
  PlusCircle,
  Trash2,
  Save,
  Eye,
  Upload,
  Video,
  Bell,
  Check,
  XCircle
} from 'lucide-react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc,
  arrayUnion, 
  increment,
  getDocFromServer,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { MENU_DATA, CATEGORIES, MenuItem, PROMOS } from './constants';
import { cn } from './lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface CartItem extends MenuItem {
  quantity: number;
}

const ITEM_COLORS = [
  'bg-mexican-green',
  'bg-mexican-pink',
  'bg-mexican-blue',
  'bg-mexican-orange',
  'bg-mexican-yellow',
  'bg-mexican-red',
  'bg-mexican-purple',
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [userData, setUserData] = useState({ name: '', phone: '', email: '' });
  const [dailyTotal, setDailyTotal] = useState(0);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUser, setAdminUser] = useState<{ username: string; level: number; name?: string } | null>(null);
  const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });
  const [adminError, setAdminError] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<'sales' | 'menu' | 'accounts' | 'admins' | 'promos' | 'kitchen'>('sales');
  const [kitchenNotification, setKitchenNotification] = useState<string | null>(null);
  const [euroRate, setEuroRate] = useState<number>(0.92); // Tasa referencial inicial
  const [vesRate, setVesRate] = useState<number>(40.00); // Tasa referencial inicial VES per EUR
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const INSPIRATIONAL_PHRASES = [
    "Â¡El Ã©xito es la suma de pequeÃ±os esfuerzos repetidos dÃ­a tras dÃ­a!",
    "Â¡Cree en ti y todo serÃ¡ posible!",
    "Â¡Cada dÃ­a es una nueva oportunidad para brillar!",
    "Â¡La perseverancia es la clave del Ã©xito!",
    "Â¡Haz de hoy un dÃ­a increÃ­ble!",
    "Â¡Tu Ãºnico lÃ­mite es tu mente!",
    "Â¡La felicidad es una direcciÃ³n, no un lugar!",
    "Â¡SueÃ±a en grande y atrÃ©vete a fallar!",
    "Â¡La mejor forma de predecir el futuro es creÃ¡ndolo!",
    "Â¡Si puedes soÃ±arlo, puedes hacerlo!"
  ];

  const getRandomPhrase = () => {
    return INSPIRATIONAL_PHRASES[Math.floor(Math.random() * INSPIRATIONAL_PHRASES.length)];
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates.VES) {
          // Usamos la tasa de Euro del dÃ­a (aproximada como VES/EUR si no hay directa)
          // El usuario pide "monto en dolares por la tasa de euro del dia"
          // Obtenemos la tasa VES/EUR
          const vesPerEur = data.rates.VES / (data.rates.EUR || 0.92);
          setVesRate(vesPerEur);
        }
      } catch (error) {
        console.error("Error fetching rates:", error);
      }
    };
    fetchRates();
  }, []);

  // Admin Data States
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allDailyAccounts, setAllDailyAccounts] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [editingMenu, setEditingMenu] = useState<MenuItem[]>(MENU_DATA);
  const [editingPromos, setEditingPromos] = useState(PROMOS);
  const [newAdminData, setNewAdminData] = useState({ username: '', password: '', level: 2, name: '', masterKey: '' });
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  const playSound = (type: 'system' | 'bell') => {
    const bellSound = 'https://assets.mixkit.co/active_storage/sfx/2216/2216-preview.mp3';
    const systemSound = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    const audio = new Audio(type === 'bell' ? bellSound : systemSound);
    audio.play().catch(e => console.error("Error playing sound:", e));
  };

  const notifiedOrders = useRef<Set<string>>(new Set());
  const lastUserOrderStatus = useRef<Record<string, string>>({});

  useEffect(() => {
    if (isLoggedIn && userOrders.length > 0) {
      userOrders.forEach(order => {
        const lastStatus = lastUserOrderStatus.current[order.id];
        if (lastStatus && lastStatus !== order.status) {
          playSound('system');
        }
        lastUserOrderStatus.current[order.id] = order.status;
      });
    }
  }, [userOrders, isLoggedIn]);

  useEffect(() => {
    if (adminUser) {
      if (adminUser.level === 4) {
        const confirmedOrders = allOrders.filter(o => o.status === 'confirmed');
        if (confirmedOrders.length > 0) {
          const latestOrder = confirmedOrders.sort((a, b) => b.startTime?.seconds - a.startTime?.seconds)[0];
          const orderTime = latestOrder.startTime?.seconds || 0;
          const now = Math.floor(Date.now() / 1000);
          
          if (now - orderTime < 10 && !notifiedOrders.current.has(latestOrder.id + '_confirmed')) {
            setKitchenNotification(`Â¡Nuevo pedido confirmado para la Mesa ${latestOrder.tableNumber}!`);
            playSound('system');
            notifiedOrders.current.add(latestOrder.id + '_confirmed');
            setTimeout(() => setKitchenNotification(null), 5000);
          }
        }
      } else if (adminUser.level === 3) {
        const readyOrders = allOrders.filter(o => o.status === 'ready');
        if (readyOrders.length > 0) {
          const latestOrder = readyOrders.sort((a, b) => b.readyTime?.seconds - a.readyTime?.seconds)[0];
          const readyTime = latestOrder.readyTime?.seconds || 0;
          const now = Math.floor(Date.now() / 1000);
          
          if (now - readyTime < 10 && !notifiedOrders.current.has(latestOrder.id + '_ready')) {
            setKitchenNotification(`Â¡Pedido Listo para la Mesa ${latestOrder.tableNumber}!`);
            playSound('bell');
            notifiedOrders.current.add(latestOrder.id + '_ready');
            setTimeout(() => setKitchenNotification(null), 5000);
          }
        }
      }
    }
  }, [allOrders, adminUser]);

  useEffect(() => {
    if (isLoggedIn && userData.phone) {
      const q = query(
        collection(db, 'orders'),
        where('customerPhone', '==', userData.phone),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserOrders(orders);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
      });
      return () => unsubscribe();
    }
  }, [isLoggedIn, userData.phone]);

  const formatPrice = (price: number) => {
    const vesPrice = price * vesRate;
    return (
      <div className="flex flex-col items-end">
        <span className="text-xl font-black tracking-tighter text-mexican-pink">${price.toFixed(2)}</span>
        <span className="text-[9px] font-black text-mexican-blue uppercase tracking-widest leading-none mt-0.5">Bs. {vesPrice.toFixed(2)}</span>
      </div>
    );
  };

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);
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
        const randomIndex = Math.floor(Math.random() * editingPromos.length);
        setCurrentPromoIndex(randomIndex);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, editingPromos.length]);

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
    return editingMenu.filter(item => item.category === activeCategory);
  }, [activeCategory, editingMenu]);

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
      const drinks = editingMenu.filter(item => item.category === 'Tragos');
      // Get 2 random drinks
      const shuffled = [...drinks].sort(() => 0.5 - Math.random());
      recs.push(...shuffled.slice(0, 2));
    }
    
    // Also add a popular item from another category if we need more
    if (recs.length < 3) {
      const popular = editingMenu.filter(item => item.category === 'Hamburguesas' || item.category === 'Pizzas');
      const shuffled = [...popular].sort(() => 0.5 - Math.random());
      recs.push(...shuffled.slice(0, 3 - recs.length));
    }
    
    return recs;
  };

  const handleAdminLogin = async () => {
    if (!adminLoginData.username || !adminLoginData.password) return;
    setAdminError('');
    
    // Level 1 Master Check
    if (adminLoginData.username === 'admin' && adminLoginData.password === 'Lachingadadesarrollo') {
      setAdminUser({ username: 'admin', level: 1, name: 'Super Admin' });
      fetchAdminData(1);
      return;
    }

    try {
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('username', '==', adminLoginData.username), where('password', '==', adminLoginData.password));
      const querySnapshot = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, 'admins'));

      if (querySnapshot && !querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0].data();
        setAdminUser({ username: adminDoc.username, level: adminDoc.level, name: adminDoc.name });
        fetchAdminData(adminDoc.level);
      } else {
        setAdminError('Usuario o contraseÃ±a incorrectos');
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setAdminError('Error al conectar con el servidor');
    }
  };

  const fetchAdminData = async (level: number) => {
    try {
      if (level <= 3) {
        // Level 3+: Can see active accounts (daily totals) and orders
        const accountsRef = collection(db, 'dailyAccounts');
        const accountsSnap = await getDocs(accountsRef).catch(e => handleFirestoreError(e, OperationType.LIST, 'dailyAccounts'));
        if (accountsSnap) setAllDailyAccounts(accountsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const customersRef = collection(db, 'customers');
        const customersSnap = await getDocs(customersRef).catch(e => handleFirestoreError(e, OperationType.LIST, 'customers'));
        if (customersSnap) setAllCustomers(customersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const ordersRef = collection(db, 'orders');
        const ordersSnap = await getDocs(ordersRef).catch(e => handleFirestoreError(e, OperationType.LIST, 'orders'));
        if (ordersSnap) setAllOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      
      if (level <= 1) {
        // Level 1: Can manage admins
        const adminsRef = collection(db, 'admins');
        const adminsSnap = await getDocs(adminsRef).catch(e => handleFirestoreError(e, OperationType.LIST, 'admins'));
        if (adminsSnap) setAllAdmins(adminsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();
    
    doc.setFontSize(20);
    doc.text('REPORTE DETALLADO DE VENTAS - LA CHINGADA', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${now}`, 14, 30);

    // Sales Summary
    const totalSales = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    doc.setFontSize(12);
    doc.text(`Total de Ventas: $${totalSales.toFixed(2)}`, 14, 45);
    doc.text(`Total en Bs: ${(totalSales * vesRate).toFixed(2)}`, 14, 52);
    doc.text(`Total de Clientes: ${allCustomers.length}`, 14, 59);

    // Orders Table
    const ordersData = allOrders.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map(o => [
      o.timestamp ? new Date(o.timestamp.seconds * 1000).toLocaleDateString() : '---',
      `Mesa ${o.tableNumber || '?'}`,
      (o.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'Sin items',
      `$${(o.totalAmount || 0).toFixed(2)}`,
      (o.status || 'PENDIENTE').toUpperCase()
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Fecha', 'Mesa', 'Items', 'Total', 'Estado']],
      body: ordersData,
      theme: 'striped',
      headStyles: { fillColor: [233, 30, 99] } // Mexican Pink
    });

    doc.save(`Reporte_LaChingada_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleAddCategory = () => {
    if (newCategoryName && !categories.includes(newCategoryName)) {
      setCategories(prev => [...prev, newCategoryName]);
      setNewCategoryName('');
    }
  };
  const handleCreateAdmin = async () => {
    if (newAdminData.masterKey !== 'Lachingadadesarrollo') {
      alert('Clave de Nivel 1 incorrecta');
      return;
    }
    if (!newAdminData.username || !newAdminData.password) return;

    try {
      const newAdminRef = doc(collection(db, 'admins'));
      await setDoc(newAdminRef, {
        username: newAdminData.username,
        password: newAdminData.password,
        level: Number(newAdminData.level),
        name: newAdminData.name,
        createdAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'admins'));
      alert('Admin creado con Ã©xito');
      setNewAdminData({ username: '', password: '', level: 2, name: '', masterKey: '' });
      fetchAdminData(1);
    } catch (error) {
      console.error("Error creating admin:", error);
    }
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setEditingMenu(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const updatePromoItem = (id: string, updates: Partial<typeof PROMOS[0]>) => {
    setEditingPromos(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleLocalImageUpload = (e: ChangeEvent<HTMLInputElement>, type: 'menu' | 'promo', id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      // Validate dimensions
      const img = new Image();
      img.onload = () => {
        const requiredWidth = type === 'menu' ? 500 : 1200;
        const requiredHeight = type === 'menu' ? 500 : 600;
        
        if (img.width !== requiredWidth || img.height !== requiredHeight) {
          setValidationError(`lee bien la medida es: ${requiredWidth}x${requiredHeight} â˜¹ï¸`);
          setTimeout(() => setValidationError(null), 5000);
          return;
        }

        if (type === 'menu') {
          updateMenuItem(id, { image: base64String });
        } else {
          updatePromoItem(id, { image: base64String });
        }
      };
      img.src = base64String;
    };
    reader.readAsDataURL(file);
  };

  const handleLocalVideoUpload = (e: ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateMenuItem(id, { video: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleLogin = async () => {
    if (!userData.phone) return;

    // Phone validation
    const phoneRegex = /^(0414|0412|0422|0426|0416|0424)\d{7}$/;
    if (!phoneRegex.test(userData.phone)) {
      setValidationError("NÃºmero de telÃ©fono invÃ¡lido. Debe comenzar con 0414, 0412, 0422, 0426, 0416 o 0424 y tener 11 dÃ­gitos â˜¹ï¸");
      setTimeout(() => setValidationError(null), 5000);
      return;
    }

    setIsLoggingIn(true);
    try {
      // Search for customer by phone
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('phone', '==', userData.phone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Customer exists
        const customerDoc = querySnapshot.docs[0];
        const data = customerDoc.data();
        setUserData({
          name: data.name,
          phone: data.phone,
          email: data.email || ''
        });
        
        // Check for daily total
        const today = new Date().toISOString().split('T')[0];
        const accountId = `${customerDoc.id}_${today}`;
        const accountDoc = await getDoc(doc(db, 'dailyAccounts', accountId));
        if (accountDoc.exists()) {
          setDailyTotal(accountDoc.data().totalAmount);
        }
      } else if (userData.name && userData.email) {
        // New customer registration
        const newCustomerRef = doc(collection(db, 'customers'));
        await setDoc(newCustomerRef, {
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          createdAt: serverTimestamp()
        });
      } else {
        // Need more info for new customer
        setIsLoggingIn(false);
        return;
      }
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const saveOrderToFirestore = async (orderTotal: number, items: CartItem[]) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, where('phone', '==', userData.phone));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return;
      const customerUid = querySnapshot.docs[0].id;

      // 1. Create Order
      const newOrderRef = doc(collection(db, 'orders'));
      const orderData = {
        customerUid,
        customerPhone: userData.phone,
        customerName: userData.name,
        tableNumber,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        totalAmount: orderTotal,
        timestamp: serverTimestamp(),
        date: today,
        status: 'pending' // Initial status for diner confirmation
      };
      await setDoc(newOrderRef, orderData);

      return newOrderRef.id;
    } catch (error) {
      console.error("Error saving order:", error);
      return null;
    }
  };

  const placeOrder = async () => {
    if (!tableNumber) {
      setShowTableError(true);
      const input = document.getElementById('table-input');
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Save to Firestore
    const orderId = await saveOrderToFirestore(cartTotal, cart);

    if (orderId) {
      playSound('system');
      // Calculate recommendations before clearing cart
      const recs = getRecommendations(cart);
      setRecommendations(recs);

      setCart([]);
      setIsCartOpen(false);
      setShowThankYou(true);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'confirmed' | 'rejected' | 'ready' | 'delivered') => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) return;
      const orderData = orderSnap.data();

      const updateData: any = { status };
      if (status === 'confirmed') updateData.startTime = serverTimestamp();
      if (status === 'ready') updateData.readyTime = serverTimestamp();
      if (status === 'delivered') updateData.deliveredTime = serverTimestamp();

      await updateDoc(orderRef, updateData);

      // If confirmed, update daily account if not already updated
      if (status === 'confirmed') {
        const today = orderData.date || new Date().toISOString().split('T')[0];
        const accountId = `${orderData.customerUid}_${today}`;
        const accountRef = doc(db, 'dailyAccounts', accountId);
        const accountDoc = await getDoc(accountRef);

        if (accountDoc.exists()) {
          // Check if order is already in the account to avoid double counting
          const currentOrderIds = accountDoc.data().orderIds || [];
          if (!currentOrderIds.includes(orderId)) {
            await updateDoc(accountRef, {
              totalAmount: increment(orderData.totalAmount),
              orderIds: arrayUnion(orderId)
            });
            if (userData.phone === orderData.customerPhone) {
              setDailyTotal(prev => prev + orderData.totalAmount);
            }
          }
        } else {
          await setDoc(accountRef, {
            customerUid: orderData.customerUid,
            date: today,
            totalAmount: orderData.totalAmount,
            orderIds: [orderId]
          });
          if (userData.phone === orderData.customerPhone) {
            setDailyTotal(orderData.totalAmount);
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
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
          <div className="flex justify-center mb-6">
            <img 
              src="https://ais-dev-ujzhogslsmmsjskuqps5c6-219087355622.us-east1.run.app/logo.png" 
              alt="La Chingada Logo" 
              className="w-48 h-48 object-contain drop-shadow-2xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to text if image not found
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const h1 = document.createElement('h1');
                  h1.className = "text-5xl font-black text-white tracking-tighter italic";
                  h1.innerHTML = 'LA <span class="text-mexican-green">CHINGADA</span>';
                  parent.appendChild(h1);
                }
              }}
            />
          </div>
          <p className="text-mexican-pink font-bold uppercase tracking-widest text-xs mb-12">Bienvenido a la experiencia</p>

          <div className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mexican-green" />
              <input 
                type="tel" 
                placeholder="Tu TelÃ©fono (Para entrar)"
                value={userData.phone}
                onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-mexican-green transition-all"
              />
            </div>

            <AnimatePresence>
              {userData.phone && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mexican-blue" />
                    <input 
                      type="text" 
                      placeholder="Tu Nombre (Si es tu 1ra vez)"
                      value={userData.name}
                      onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-mexican-blue transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mexican-pink" />
                    <input 
                      type="email" 
                      placeholder="Tu Email (Si es tu 1ra vez)"
                      value={userData.email}
                      onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-mexican-pink transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={handleLogin}
              disabled={!userData.phone || isLoggingIn}
              className="w-full bg-mexican-pink text-white font-black py-5 rounded-2xl shadow-2xl shadow-mexican-pink/30 text-xl mt-8 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Entrar al MenÃº'
              )}
            </button>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-4">
              Si ya has pedido antes, solo ingresa tu telÃ©fono
            </p>
            
            <button 
              onClick={() => setIsAdminMode(true)}
              className="mt-12 flex items-center gap-2 text-white/20 hover:text-white/60 transition-colors mx-auto text-[10px] font-black uppercase tracking-widest"
            >
              <Shield className="w-3 h-3" />
              Acceso Administrativo
            </button>
          </div>
        </motion.div>

        {/* Admin Login Modal */}
        <AnimatePresence>
          {isAdminMode && !adminUser && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
            >
              <div className="w-full max-w-sm bg-zinc-900 rounded-[48px] p-8 border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-mexican-pink/20 rounded-2xl">
                      <Lock className="w-6 h-6 text-mexican-pink" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter italic">Admin Login</h2>
                  </div>
                  <button onClick={() => setIsAdminMode(false)} className="p-2 text-white/40 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Usuario"
                    value={adminLoginData.username}
                    onChange={(e) => setAdminLoginData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-mexican-pink transition-all"
                  />
                  <input 
                    type="password" 
                    placeholder="ContraseÃ±a"
                    value={adminLoginData.password}
                    onChange={(e) => setAdminLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-mexican-pink transition-all"
                  />
                  {adminError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{adminError}</p>}
                  <button 
                    onClick={handleAdminLogin}
                    className="w-full bg-mexican-pink text-white font-black py-4 rounded-2xl shadow-xl shadow-mexican-pink/20 mt-4"
                  >
                    Entrar al Panel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Dashboard */}
        <AnimatePresence>
          {isAdminMode && adminUser && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-0 z-[100] bg-zinc-50 flex flex-col"
            >
              {/* Validation Error Toast for Admin */}
              <AnimatePresence>
                {validationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-6 right-6 z-[120] bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3"
                  >
                    <div className="bg-red-500/20 p-2 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest flex-1">{validationError}</p>
                    <button onClick={() => setValidationError(null)} className="text-zinc-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Admin Header */}
              <header className="bg-white border-b border-zinc-200 p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-900 rounded-2xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 tracking-tighter uppercase italic">Panel de Control</h2>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nivel {adminUser.level} â€¢ {adminUser.name || adminUser.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setAdminUser(null);
                      setIsAdminMode(false);
                    }}
                    className="p-3 bg-zinc-100 rounded-2xl text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </header>

              {/* Admin Tabs */}
              <div className="bg-white border-b border-zinc-200 flex overflow-x-auto no-scrollbar px-6 gap-6">
                {adminUser.level <= 1 && (
                  <button 
                    onClick={() => setAdminActiveTab('sales')}
                    className={cn(
                      "py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0",
                      adminActiveTab === 'sales' ? "border-mexican-pink text-mexican-pink" : "border-transparent text-zinc-400"
                    )}
                  >
                    Ventas
                  </button>
                )}
                {adminUser.level <= 2 && (
                  <button 
                    onClick={() => setAdminActiveTab('menu')}
                    className={cn(
                      "py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0",
                      adminActiveTab === 'menu' ? "border-mexican-pink text-mexican-pink" : "border-transparent text-zinc-400"
                    )}
                  >
                    MenÃº
                  </button>
                )}
                {adminUser.level <= 3 && (
                  <button 
                    onClick={() => setAdminActiveTab('accounts')}
                    className={cn(
                      "py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0",
                      adminActiveTab === 'accounts' ? "border-mexican-pink text-mexican-pink" : "border-transparent text-zinc-400"
                    )}
                  >
                    Cuentas
                  </button>
                )}
                {adminUser.level >= 2 && adminUser.level <= 4 && (
                  <button 
                    onClick={() => setAdminActiveTab('kitchen')}
                    className={cn(
                      "py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0",
                      adminActiveTab === 'kitchen' ? "border-mexican-pink text-mexican-pink" : "border-transparent text-zinc-400"
                    )}
                  >
                    Cocina
                  </button>
                )}
                {adminUser.level <= 2 && (
                  <button 
                    onClick={() => setAdminActiveTab('promos')}
                    className={cn(
                      "py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0",
                      adminActiveTab === 'promos' ? "border-mexican-pink text-mexican-pink" : "border-transparent text-zinc-400"
                    )}
                  >
                    Promos
                  </button>
                )}
                {adminUser.level <= 1 && (
                  <button 
                    onClick={() => setAdminActiveTab('admins')}
                    className={cn(
                      "py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0",
                      adminActiveTab === 'admins' ? "border-mexican-pink text-mexican-pink" : "border-transparent text-zinc-400"
                    )}
                  >
                    Admins
                  </button>
                )}
              </div>

              {/* Admin Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {adminActiveTab === 'sales' && adminUser.level <= 1 && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button 
                        onClick={generatePDFReport}
                        className="bg-mexican-pink text-white font-black py-3 px-6 rounded-2xl shadow-lg shadow-mexican-pink/20 flex items-center gap-2 text-xs uppercase tracking-widest"
                      >
                        <FileText className="w-4 h-4" />
                        Generar Informe PDF
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-sm">
                        <TrendingUp className="w-5 h-5 text-mexican-green mb-2" />
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Ventas</p>
                        <p className="text-2xl font-black text-zinc-900 tracking-tighter">${allOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}</p>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <p className="text-[9px] font-black text-mexican-blue uppercase tracking-widest">Bs. {(allOrders.reduce((sum, o) => sum + o.totalAmount, 0) * vesRate).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-sm">
                        <Users className="w-5 h-5 text-mexican-blue mb-2" />
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Clientes</p>
                        <p className="text-2xl font-black text-zinc-900 tracking-tighter">{allCustomers.length}</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-[32px] border border-zinc-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                        <h3 className="font-black text-zinc-900 uppercase tracking-tighter italic">Ãšltimos Pedidos</h3>
                        <FileText className="w-4 h-4 text-zinc-300" />
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {allOrders.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds).slice(0, 10).map(order => (
                          <div key={order.id} className="p-4 flex justify-between items-center">
                            <div>
                              <p className="font-black text-zinc-900 text-sm">Mesa {order.tableNumber}</p>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(order.timestamp?.seconds * 1000).toLocaleString()}</p>
                              {adminUser.level <= 1 && (
                                <div className="mt-1 space-y-0.5">
                                  {order.startTime && (
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                      Inicio: {new Date(order.startTime.seconds * 1000).toLocaleTimeString()}
                                    </p>
                                  )}
                                  {order.readyTime && (
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                      Listo: {new Date(order.readyTime.seconds * 1000).toLocaleTimeString()}
                                    </p>
                                  )}
                                  {order.deliveredTime && (
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                      Entregado: {new Date(order.deliveredTime.seconds * 1000).toLocaleTimeString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-black text-mexican-pink">${order.totalAmount.toFixed(2)}</p>
                              <div className="flex flex-col items-end gap-0.5">
                                <p className="text-[8px] font-black text-mexican-blue uppercase tracking-widest leading-none">Bs. {(order.totalAmount * vesRate).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminActiveTab === 'menu' && adminUser.level <= 2 && (
                  <div className="space-y-4">
                    <div className="bg-zinc-900 p-6 rounded-[32px] mb-8 shadow-xl">
                      <h3 className="text-white font-black uppercase tracking-tighter italic mb-4 flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-mexican-pink" />
                        Gestionar CategorÃ­as
                      </h3>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Nueva categorÃ­a..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 bg-white/10 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-mexican-pink"
                        />
                        <button 
                          onClick={handleAddCategory}
                          className="bg-mexican-pink text-white font-black px-6 rounded-2xl"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>

                    {adminUser.level === 1 && (
                      <div className="bg-zinc-900 p-6 rounded-[32px] mb-8 shadow-xl">
                        <h3 className="text-white font-black uppercase tracking-tighter italic mb-4 flex items-center gap-2">
                          <PlusCircle className="w-5 h-5 text-mexican-pink" />
                          Agregar Nuevo Plato/Bebida
                        </h3>
                        <div className="space-y-4">
                          <input 
                            type="text" 
                            placeholder="Nombre del plato"
                            className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-mexican-pink"
                            id="new-item-name"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="number" 
                              placeholder="Precio ($)"
                              className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-mexican-pink"
                              id="new-item-price"
                            />
                            <select 
                              className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-mexican-pink appearance-none"
                              id="new-item-category"
                            >
                              {categories.map(cat => <option key={cat} value={cat} className="text-zinc-900">{cat}</option>)}
                            </select>
                          </div>
                          <textarea 
                            placeholder="DescripciÃ³n..."
                            className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:border-mexican-pink h-20 resize-none"
                            id="new-item-desc"
                          />
                          <button 
                            onClick={() => {
                              const name = (document.getElementById('new-item-name') as HTMLInputElement).value;
                              const price = Number((document.getElementById('new-item-price') as HTMLInputElement).value);
                              const category = (document.getElementById('new-item-category') as HTMLSelectElement).value;
                              const description = (document.getElementById('new-item-desc') as HTMLTextAreaElement).value;
                              
                              if (name && price) {
                                const newItem: MenuItem = {
                                  id: `new-${Date.now()}`,
                                  name,
                                  price,
                                  category,
                                  description,
                                  image: `https://picsum.photos/seed/${Date.now()}/500/500`
                                };
                                setEditingMenu(prev => [...prev, newItem]);
                                // Reset fields
                                (document.getElementById('new-item-name') as HTMLInputElement).value = '';
                                (document.getElementById('new-item-price') as HTMLInputElement).value = '';
                                (document.getElementById('new-item-desc') as HTMLTextAreaElement).value = '';
                              }
                            }}
                            className="w-full bg-mexican-pink text-white font-black py-4 rounded-2xl shadow-lg shadow-mexican-pink/20"
                          >
                            Agregar al MenÃº
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="bg-mexican-pink/10 p-4 rounded-2xl mb-4">
                      <p className="text-[10px] font-black text-mexican-pink uppercase tracking-widest">
                        ðŸ’¡ Tip: Usa imÃ¡genes cuadradas (500x500 px) para los platos.
                      </p>
                    </div>
                    {editingMenu.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-3xl border border-zinc-200 flex flex-col gap-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-zinc-100 rounded-2xl overflow-hidden relative group shrink-0">
                            <img src={item.image || `https://picsum.photos/seed/${item.id}/200/200`} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between gap-2">
                              <input 
                                type="text" 
                                value={item.name}
                                disabled={adminUser.level > 1}
                                onChange={(e) => updateMenuItem(item.id, { name: e.target.value })}
                                className="font-black text-zinc-900 uppercase tracking-tighter bg-transparent border-none p-0 focus:ring-0 flex-1"
                              />
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 bg-zinc-50 px-2 rounded-lg">
                                  <span className="text-zinc-400 font-black">$</span>
                                  <input 
                                    type="number" 
                                    value={item.price}
                                    disabled={adminUser.level > 1}
                                    onChange={(e) => updateMenuItem(item.id, { price: Number(e.target.value) })}
                                    className="w-16 font-black text-mexican-pink bg-transparent border-none p-0 focus:ring-0 text-right"
                                  />
                                </div>
                              </div>
                            </div>
                            <textarea 
                              value={item.description}
                              onChange={(e) => updateMenuItem(item.id, { description: e.target.value })}
                              placeholder="DescripciÃ³n del plato..."
                              className="w-full text-[10px] font-bold text-zinc-400 bg-transparent border-none p-0 focus:ring-0 resize-none h-12"
                            />
                          </div>
                        </div>
                        <div className="pt-2 border-t border-zinc-50 flex flex-col gap-2">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Imagen del Plato (500x500 px)</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={item.image || ''}
                              onChange={(e) => updateMenuItem(item.id, { image: e.target.value })}
                              placeholder="URL de la imagen..."
                              className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl py-2 px-4 text-[10px] focus:outline-none focus:border-mexican-pink"
                            />
                            <label className="bg-zinc-900 text-white p-2 rounded-xl cursor-pointer hover:bg-mexican-pink transition-colors flex items-center justify-center">
                              <Upload className="w-4 h-4" />
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleLocalImageUpload(e, 'menu', item.id)}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-zinc-50 flex flex-col gap-2">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Video del Plato (Opcional)</p>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={item.video || ''}
                              onChange={(e) => updateMenuItem(item.id, { video: e.target.value })}
                              placeholder="URL del video (mp4)..."
                              className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl py-2 px-4 text-[10px] focus:outline-none focus:border-mexican-pink"
                            />
                            <label className="bg-zinc-900 text-white p-2 rounded-xl cursor-pointer hover:bg-mexican-pink transition-colors flex items-center justify-center">
                              <Video className="w-4 h-4" />
                              <input 
                                type="file" 
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => handleLocalVideoUpload(e, item.id)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="w-full bg-zinc-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 mt-4">
                      <Save className="w-4 h-4" />
                      Guardar Cambios del MenÃº
                    </button>
                  </div>
                )}

                {adminActiveTab === 'promos' && adminUser.level <= 2 && (
                  <div className="space-y-4">
                    <div className="bg-mexican-blue/10 p-4 rounded-2xl mb-4">
                      <p className="text-[10px] font-black text-mexican-blue uppercase tracking-widest">
                        ðŸ’¡ Tip: Usa imÃ¡genes horizontales (1200x600 px) para el banner principal.
                      </p>
                    </div>
                    {editingPromos.map(promo => (
                      <div key={promo.id} className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-sm space-y-4">
                        <div className="aspect-[2/1] bg-zinc-100 rounded-2xl overflow-hidden">
                          <img src={promo.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">TÃ­tulo de la Promo</p>
                            <input 
                              type="text" 
                              value={promo.title}
                              onChange={(e) => updatePromoItem(promo.id, { title: e.target.value })}
                              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-mexican-blue"
                            />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Imagen de la Promo (1200x600 px)</p>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={promo.image}
                                onChange={(e) => updatePromoItem(promo.id, { image: e.target.value })}
                                placeholder="URL de la imagen..."
                                className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl py-3 px-4 text-[10px] focus:outline-none focus:border-mexican-blue"
                              />
                              <label className="bg-zinc-900 text-white px-4 rounded-xl cursor-pointer hover:bg-mexican-blue transition-colors flex items-center justify-center">
                                <Upload className="w-4 h-4" />
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleLocalImageUpload(e, 'promo', promo.id)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="w-full bg-mexican-blue text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-lg shadow-mexican-blue/20">
                      <Save className="w-4 h-4" />
                      Guardar Cambios de Promos
                    </button>
                  </div>
                )}

                {adminActiveTab === 'accounts' && adminUser.level <= 3 && (
                  <div className="space-y-4">
                    <h3 className="font-black text-zinc-900 uppercase tracking-tighter italic mb-4">Cuentas Activas Hoy</h3>
                    {allDailyAccounts.filter(acc => acc.date === new Date().toISOString().split('T')[0]).map(acc => {
                      const customer = allCustomers.find(c => c.id === acc.customerUid);
                      const accountOrders = allOrders.filter(o => acc.orderIds?.includes(o.id));
                      
                      return (
                        <div key={acc.id} className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-sm flex flex-col gap-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-mexican-blue/10 rounded-2xl flex items-center justify-center">
                                <User className="w-6 h-6 text-mexican-blue" />
                              </div>
                              <div>
                                <p className="font-black text-zinc-900 uppercase tracking-tighter">{customer?.name || 'Cliente'}</p>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{customer?.phone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Hoy</p>
                              <p className="text-xl font-black text-mexican-pink tracking-tighter">${acc.totalAmount.toFixed(2)}</p>
                              <div className="flex flex-col items-end gap-0.5">
                                <p className="text-[8px] font-black text-mexican-blue uppercase tracking-widest leading-none">Bs. {(acc.totalAmount * vesRate).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-zinc-50">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Detalle de Consumo</p>
                            <div className="space-y-4">
                              {accountOrders.map(order => (
                                <div key={order.id} className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black text-mexican-blue uppercase tracking-widest">Pedido #{order.id.slice(-4)} â€¢ Mesa {order.tableNumber}</span>
                                    <span className={cn(
                                      "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                      order.status === 'confirmed' ? "bg-mexican-green/10 text-mexican-green" :
                                      order.status === 'pending' ? "bg-mexican-blue/10 text-mexican-blue" :
                                      order.status === 'ready' ? "bg-mexican-pink/10 text-mexican-pink" :
                                      order.status === 'delivered' ? "bg-zinc-100 text-zinc-500" :
                                      "bg-red-500/10 text-red-500"
                                    )}>
                                      {order.status === 'confirmed' ? 'Confirmado' : 
                                       order.status === 'pending' ? 'Pendiente' : 
                                       order.status === 'ready' ? 'Listo' :
                                       order.status === 'delivered' ? 'Entregado' : 'Rechazado'}
                                    </span>
                                  </div>
                                  <div className="space-y-1 mb-3">
                                    {order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-[10px] font-bold text-zinc-600">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {order.status === 'pending' && (
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
                                      <button 
                                        onClick={async () => {
                                          await updateOrderStatus(order.id, 'rejected');
                                          fetchAdminData(adminUser.level);
                                        }}
                                        className="bg-white border border-red-500 text-red-500 font-black py-2 rounded-xl flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest"
                                      >
                                        <XCircle className="w-3 h-3" />
                                        Rechazar
                                      </button>
                                      <button 
                                        onClick={async () => {
                                          await updateOrderStatus(order.id, 'confirmed');
                                          fetchAdminData(adminUser.level);
                                        }}
                                        className="bg-mexican-green text-white font-black py-2 rounded-xl flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest shadow-sm"
                                      >
                                        <Check className="w-3 h-3" />
                                        Aceptar
                                      </button>
                                    </div>
                                  )}
                                  {order.status === 'ready' && (
                                    <div className="pt-2 border-t border-zinc-100">
                                      <button 
                                        onClick={async () => {
                                          await updateOrderStatus(order.id, 'delivered');
                                          fetchAdminData(adminUser.level);
                                        }}
                                        className="w-full bg-mexican-pink text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-lg shadow-mexican-pink/20"
                                      >
                                        <UtensilsCrossed className="w-4 h-4" />
                                        Entregado a la Mesa
                                      </button>
                                    </div>
                                  )}
                                  {(adminUser.level <= 2) && (
                                    <div className="mt-3 pt-2 border-t border-zinc-100 space-y-1">
                                      {order.startTime && (
                                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                          Inicio: {new Date(order.startTime.seconds * 1000).toLocaleTimeString()}
                                        </p>
                                      )}
                                      {order.readyTime && (
                                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                          Listo: {new Date(order.readyTime.seconds * 1000).toLocaleTimeString()}
                                        </p>
                                      )}
                                      {order.deliveredTime && (
                                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                                          Entregado: {new Date(order.deliveredTime.seconds * 1000).toLocaleTimeString()}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {adminActiveTab === 'kitchen' && adminUser.level <= 4 && (
                  <div className="space-y-4">
                    <h3 className="font-black text-zinc-900 uppercase tracking-tighter italic mb-4">Pedidos en Cocina</h3>
                    {allOrders.filter(o => o.status === 'confirmed' || o.status === 'ready').sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds).map(order => (
                      <div key={order.id} className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pedido #{order.id.slice(-4)}</p>
                            <h4 className="font-black text-zinc-900 uppercase tracking-tighter italic">Mesa {order.tableNumber}</h4>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                            order.status === 'confirmed' ? "bg-mexican-green/10 text-mexican-green" : "bg-mexican-pink/10 text-mexican-pink"
                          )}>
                            {order.status === 'confirmed' ? 'En PreparaciÃ³n' : 'Listo'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs font-bold text-zinc-600">
                              <span>{item.quantity}x {item.name}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-zinc-50 flex justify-between items-center">
                          <div className="flex flex-col gap-1">
                            {order.startTime && (
                              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                Inicio: {new Date(order.startTime.seconds * 1000).toLocaleTimeString()}
                              </p>
                            )}
                            {order.readyTime && (
                              <p className="text-[9px] font-black text-mexican-pink uppercase tracking-widest">
                                Finalizado: {new Date(order.readyTime.seconds * 1000).toLocaleTimeString()}
                              </p>
                            )}
                            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                              Recibido: {new Date(order.timestamp?.seconds * 1000).toLocaleTimeString()}
                            </p>
                          </div>
                          {order.status === 'confirmed' && (
                            <button 
                              onClick={async () => {
                                await updateOrderStatus(order.id, 'ready');
                                fetchAdminData(adminUser.level);
                              }}
                              className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-mexican-pink transition-colors"
                            >
                              Marcar Listo
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {adminActiveTab === 'admins' && adminUser.level <= 1 && (
                  <div className="space-y-8">
                    <div className="bg-zinc-900 p-8 rounded-[40px] shadow-2xl border border-white/5">
                      <h3 className="text-white font-black uppercase tracking-tighter italic mb-6 flex items-center gap-3 text-xl">
                        <div className="p-2 bg-mexican-pink rounded-xl">
                          <PlusCircle className="w-6 h-6 text-white" />
                        </div>
                        GestiÃ³n de Administradores
                      </h3>
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nombre Completo</p>
                            <input 
                              type="text" 
                              placeholder="Ej: Juan Perez"
                              value={newAdminData.name}
                              onChange={(e) => setNewAdminData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-mexican-pink transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nombre de Usuario</p>
                            <input 
                              type="text" 
                              placeholder="Ej: jperez"
                              value={newAdminData.username}
                              onChange={(e) => setNewAdminData(prev => ({ ...prev, username: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-mexican-pink transition-all"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4">ContraseÃ±a</p>
                            <input 
                              type="password" 
                              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                              value={newAdminData.password}
                              onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-mexican-pink transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-4">Nivel de Acceso</p>
                            <select 
                              value={newAdminData.level}
                              onChange={(e) => setNewAdminData(prev => ({ ...prev, level: Number(e.target.value) }))}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-mexican-pink appearance-none transition-all"
                            >
                              <option value={1} className="bg-zinc-900">Nivel 1 (Gerente)</option>
                              <option value={2} className="bg-zinc-900">Nivel 2 (Cajas)</option>
                              <option value={3} className="bg-zinc-900">Nivel 3 (Mesoneros)</option>
                              <option value={4} className="bg-zinc-900">Nivel 4 (Cocina)</option>
                            </select>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-4">Clave Maestra para AutorizaciÃ³n</p>
                          <input 
                            type="password" 
                            placeholder="Ingrese clave maestra..."
                            value={newAdminData.masterKey}
                            onChange={(e) => setNewAdminData(prev => ({ ...prev, masterKey: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-mexican-pink transition-all"
                          />
                        </div>
                        <button 
                          onClick={handleCreateAdmin}
                          className="w-full bg-mexican-pink text-white font-black py-5 rounded-2xl shadow-xl shadow-mexican-pink/20 mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          Crear Acceso Administrativo
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-black text-zinc-900 uppercase tracking-tighter italic px-2 text-lg">Administradores Activos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allAdmins.map(admin => (
                          <div key={admin.id} className="bg-white p-6 rounded-[32px] border border-zinc-200 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                                  <Shield className={cn(
                                    "w-6 h-6",
                                    admin.level === 1 ? "text-mexican-pink" : "text-zinc-400"
                                  )} />
                                </div>
                                <div>
                                  <p className="font-black text-zinc-900 uppercase tracking-tighter">{admin.name || admin.username}</p>
                                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nivel {admin.level} â€¢ @{admin.username}</p>
                                </div>
                              </div>
                              <button 
                                onClick={async () => {
                                  if (confirm(`Â¿Eliminar a ${admin.username}?`)) {
                                    await deleteDoc(doc(db, 'admins', admin.id));
                                    fetchAdminData(1);
                                  }
                                }}
                                className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-zinc-50">
                              <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Editar ContraseÃ±a</p>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    defaultValue={admin.password}
                                    onBlur={async (e) => {
                                      if (e.target.value !== admin.password) {
                                        await updateDoc(doc(db, 'admins', admin.id), { password: e.target.value });
                                        fetchAdminData(1);
                                      }
                                    }}
                                    className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl py-2 px-4 text-xs font-bold focus:outline-none focus:border-mexican-pink"
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Cambiar Nivel</p>
                                <select 
                                  value={admin.level}
                                  onChange={async (e) => {
                                    await updateDoc(doc(db, 'admins', admin.id), { level: Number(e.target.value) });
                                    fetchAdminData(1);
                                  }}
                                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2 px-4 text-xs font-bold focus:outline-none focus:border-mexican-pink appearance-none"
                                >
                                  <option value={1}>Nivel 1 (Gerente)</option>
                                  <option value={2}>Nivel 2 (Cajas)</option>
                                  <option value={3}>Nivel 3 (Mesoneros)</option>
                                  <option value={4}>Nivel 4 (Cocina)</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Kitchen Notification Toast */}
      <AnimatePresence>
        {kitchenNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-6 right-6 z-[100] bg-mexican-green text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest flex-1">{kitchenNotification}</p>
            <button onClick={() => setKitchenNotification(null)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Error Toast */}
      <AnimatePresence>
        {validationError && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-6 right-6 z-[100] bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3"
          >
            <div className="bg-red-500/20 p-2 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest flex-1">{validationError}</p>
            <button onClick={() => setValidationError(null)} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-6 pt-8 flex flex-col gap-4 sticky top-0 bg-white/90 backdrop-blur-md z-30 border-b border-zinc-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://ais-dev-ujzhogslsmmsjskuqps5c6-219087355622.us-east1.run.app/logo.png" 
              alt="Logo" 
              className="w-12 h-12 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const div = document.createElement('div');
                  div.innerHTML = '<h1 class="text-4xl font-extrabold tracking-tighter text-mexican-pink leading-none">LA <span class="text-mexican-green">CHINGADA</span></h1>';
                  parent.appendChild(div);
                }
              }}
            />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tighter text-mexican-pink leading-none">
                LA <span className="text-mexican-green">CHINGADA</span>
              </h1>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">Sabor autÃ©ntico mexicano</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-3 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-mexican-blue transition-colors shadow-sm"
            >
              <Bell className="w-6 h-6 text-zinc-800" />
              {userOrders.filter(o => o.status === 'pending').length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-mexican-blue text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
                >
                  {userOrders.filter(o => o.status === 'pending').length}
                </motion.span>
              )}
            </button>
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
        </div>

        {/* Categories - Moved to Top Header */}
        <div 
          ref={categoryScrollRef}
          className="overflow-x-auto no-scrollbar flex gap-4 pb-2"
        >
          {categories.map(cat => (
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
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {/* Promo Banner */}
        <div className="mb-8">
          <div 
            ref={promoScrollRef}
            className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory"
          >
            {editingPromos.map((promo) => (
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
                      PromociÃ³n Especial
                    </span>
                    <h3 className="text-white font-black text-3xl leading-tight tracking-tighter uppercase italic">{promo.title}</h3>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {editingPromos.map((_, i) => (
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
                    <span className="text-xl font-black tracking-tighter text-mexican-pink">${item.price.toFixed(2)}</span>
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

      {/* Notifications Drawer */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 p-8 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-mexican-blue/10 rounded-2xl">
                    <Bell className="w-6 h-6 text-mexican-blue" />
                  </div>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Notificaciones</h2>
                </div>
                <button onClick={() => setIsNotificationsOpen(false)} className="p-3 bg-zinc-50 rounded-2xl">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {userOrders.length === 0 ? (
                  <div className="py-20 text-center">
                    <Bell className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No tienes notificaciones</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userOrders.map(order => (
                      <div key={order.id} className="bg-zinc-50 rounded-[32px] p-6 border border-zinc-100 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pedido #{order.id.slice(-4)}</p>
                            <h4 className="font-black text-zinc-900 uppercase tracking-tighter italic">Mesa {order.tableNumber}</h4>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                            order.status === 'pending' ? "bg-mexican-blue/10 text-mexican-blue" :
                            order.status === 'confirmed' ? "bg-mexican-green/10 text-mexican-green" :
                            "bg-red-500/10 text-red-500"
                          )}>
                            {order.status === 'pending' ? 'Pendiente' : 
                             order.status === 'confirmed' ? 'Confirmado' : 'Rechazado'}
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs font-bold text-zinc-600">
                              <span>{item.quantity}x {item.name}</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-zinc-200 flex justify-between font-black text-zinc-900">
                            <span>Total</span>
                            <span>${order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>

                        {order.status === 'confirmed' && (
                          <div className="bg-mexican-green/5 border border-mexican-green/20 rounded-2xl p-4 mt-2">
                            <p className="text-mexican-green font-black text-[10px] uppercase tracking-widest mb-2 italic">
                              "{getRandomPhrase()}"
                            </p>
                            <p className="text-zinc-900 font-bold text-[11px] leading-tight">
                              Su orden fue confirmada, en unos minutos estaremos entregando su pedido a su mesa.
                            </p>
                          </div>
                        )}
                        
                        {order.status === 'rejected' && (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mt-2">
                            <p className="text-red-500 font-bold text-[11px] leading-tight">
                              Lo sentimos, su orden no pudo ser procesada. Por favor contacte a un mesero.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                <div className="flex items-center gap-2">
                  {dailyTotal > 0 && (
                    <div className="bg-zinc-100 px-3 py-1.5 rounded-xl flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <History className="w-3 h-3 text-zinc-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Cuenta Hoy: ${dailyTotal.toFixed(2)}</span>
                      </div>
                      <span className="text-[8px] font-black text-mexican-blue uppercase tracking-widest leading-none mt-0.5">Bs. {(dailyTotal * vesRate).toFixed(2)}</span>
                    </div>
                  )}
                  <button onClick={() => setIsCartOpen(false)} className="p-3 bg-zinc-50 rounded-2xl">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2 block">NÃºmero de Mesa</label>
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
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">VacÃ­o</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-extrabold text-zinc-900 leading-tight">{item.name}</h4>
                          {formatPrice(item.price * item.quantity)}
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
                    <div className="flex flex-col">
                      <span className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">Subtotal Pedido</span>
                      <span className="text-2xl font-black text-zinc-900 tracking-tighter">${cartTotal.toFixed(2)}</span>
                      <span className="text-[9px] font-black text-mexican-blue uppercase tracking-widest leading-none">Bs. {(cartTotal * vesRate).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-mexican-pink font-black uppercase tracking-widest text-[10px]">Total Acumulado</span>
                      <span className="text-2xl font-black text-mexican-pink tracking-tighter">${(dailyTotal + cartTotal).toFixed(2)}</span>
                      <span className="text-[9px] font-black text-mexican-blue uppercase tracking-widest leading-none">Bs. {((dailyTotal + cartTotal) * vesRate).toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={placeOrder}
                    className="w-full bg-mexican-pink text-white font-black py-5 rounded-3xl shadow-xl shadow-mexican-pink/30 flex items-center justify-center gap-3 text-xl"
                  >
                    <UtensilsCrossed className="w-6 h-6" />
                    Finalizar Pedido
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
            <div className="flex flex-col items-end">
              <span className="bg-white/20 px-4 py-1.5 rounded-xl text-lg font-black tracking-tighter">${cartTotal.toFixed(2)}</span>
              <div className="flex flex-col items-end gap-0.5 mt-1">
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Total Bs: Bs. {(cartTotal * vesRate).toFixed(2)}</span>
              </div>
            </div>
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
                  {selectedItem.video ? (
                    <video 
                      src={selectedItem.video} 
                      className="w-full h-full object-cover" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                    />
                  ) : (
                    <img 
                      src={selectedItem.image || `https://picsum.photos/seed/${selectedItem.id}/600/800`}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
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
                    {formatPrice(selectedItem.price)}
                  </div>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
                    {selectedItem.description || "Nuestra receta especial preparada con los ingredientes mÃ¡s frescos y el autÃ©ntico sabor de MÃ©xico."}
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
                    <span className="text-5xl">ðŸ˜Š</span>
                  </div>
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tighter mb-2 italic">
                    Â¡GRACIAS, <span className="text-mexican-pink uppercase">{userData.name}</span>!
                  </h2>
                  <p className="text-zinc-500 font-bold text-sm leading-tight">
                    Tu pedido ha sido enviado a cocina. Â¡En breve estarÃ¡ en tu mesa!
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                  <h3 className="text-mexican-blue font-black uppercase tracking-widest text-[10px] mb-6 text-center">
                    Â¿Te provoca algo mÃ¡s?
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
                          {formatPrice(item.price)}
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
                    <p className="text-mexican-pink font-black text-[10px] uppercase tracking-widest text-center mb-2">ðŸ”¥ No te pierdas</p>
                    <p className="text-zinc-900 font-bold text-xs text-center">Â¡Pregunta por nuestras promociones del dÃ­a!</p>
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
