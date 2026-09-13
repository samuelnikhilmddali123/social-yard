export interface Billboard {
  id: string | number;
  name?: string;
  location: string;
  status: 'Active' | 'High Demand';
  price: string;

  image?: string;
  lat: number;
  lng: number;
}

export const FALLBACK_BILLBOARDS: Billboard[] = [
  { 
    id: 1, 
    location: "Benz Circle, Vijayawada", 
    status: "High Demand", 
    price: "₹4,500/hr", 
    image: "/vijayawada-billboard.png", 
    lat: 16.5015, 
    lng: 80.6438 
  },
  { 
    id: 2, 
    location: "MG Road, Vijayawada", 
    status: "Active", 
    price: "₹3,800/hr", 
    image: "/vijayawada-billboard.png", 
    lat: 16.5135, 
    lng: 80.6395 
  },
  { 
    id: 3, 
    location: "PNBS Area, Vijayawada", 
    status: "Active", 
    price: "₹3,200/hr", 
    image: "/vijayawada-billboard.png", 
    lat: 16.5186, 
    lng: 80.6272 
  },
  { 
    id: 4, 
    location: "Cyber Hub, Gurgaon", 
    status: "Active", 
    price: "₹5,000/hr", 
    image: "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1920&q=80", 
    lat: 28.4951, 
    lng: 77.0878 
  },
  { 
    id: 5, 
    location: "Bandra-Worli Sea Link, Mumbai", 
    status: "Active", 
    price: "₹4,200/hr", 
    image: "https://images.unsplash.com/photo-1562613531-df24579cc5cf?auto=format&fit=crop&w=1920&q=80", 
    lat: 19.0371, 
    lng: 72.8174 
  },
];

export const TARGET_LOCATIONS = FALLBACK_BILLBOARDS.map(bb => ({
  name: bb.location,
  price: parseInt(bb.price.replace(/[^\d]/g, '')),
}));

export const DEFAULT_MAP_CENTER = {
  lat: 16.5062,
  lng: 80.6480,
};
