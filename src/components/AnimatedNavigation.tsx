import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MonitorPlay, Gamepad2, Users, Settings, Calendar, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface AnimatedNavigationProps {
  currentView: 'display' | 'team-settings' | 'game-settings' | 'stats' | 'controller' | 'login' | 'thursday';
  onViewChange: (view: 'display' | 'team-settings' | 'game-settings' | 'stats' | 'controller' | 'thursday') => void;
}

const AnimatedNavigation: React.FC<AnimatedNavigationProps> = ({ currentView, onViewChange }) => {
  const { isTable } = useAuthStore();
  const navRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { 
      id: 'display', 
      icon: MonitorPlay, 
      label: 'Scoreboard', 
      requiresTable: false,
      color: '#ffcc80',
      position: '50px'
    },
    { 
      id: 'controller', 
      icon: Gamepad2, 
      label: 'Controller', 
      requiresTable: true,
      color: '#81d4fa',
      position: '130px'
    },
    { 
      id: 'team-settings', 
      icon: Users, 
      label: 'Teams', 
      requiresTable: true,
      color: '#c5e1a5',
      position: '210px'
    },
    { 
      id: 'game-settings', 
      icon: Settings, 
      label: 'Settings', 
      requiresTable: true,
      color: '#ce93d8',
      position: '290px'
    },
    { 
      id: 'thursday', 
      icon: Calendar, 
      label: 'Thursday', 
      requiresTable: true,
      color: '#ffab91',
      position: '370px'
    }
  ] as const;

  const visibleItems = navItems.filter(item => !item.requiresTable || isTable);

  useEffect(() => {
    // Initialize the first item as active
    const firstItem = visibleItems[0];
    if (firstItem && currentView === firstItem.id) {
      moveToItem(1, firstItem.position, firstItem.color);
    }
  }, []);

  const moveToItem = (id: number, position: string, color: string) => {
    const tl = gsap.timeline();
    
    tl.to("#bgBubble", {duration: 0.15, bottom: "-30px", ease: "power2.out"}, 0)
      .to(".bubble", {duration: 0.1, y: "120%", boxShadow: 'none', ease: "power2.out"}, 0)
      .to(".nav-icon", {duration: 0.05, opacity: 0, ease: "power2.out"}, 0)
      .to("#bgBubble", {duration: 0.2, left: position, ease: "power2.inOut"}, 0.1)
      .to("#bgBubble", {duration: 0.15, bottom: "-50px", ease: "power2.out"}, '-=0.2')
      .to(`#bubble${id}`, {duration: 0.15, y: "0%", opacity: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', ease: "power2.out"}, '-=0.1')
      .to(`#bubble${id} .nav-icon`, {duration: 0.15, y: "0%", opacity: 0.7, ease: "power2.out"}, '-=0.1')
      .to("#navbarContainer", {duration: 0.3, backgroundColor: color, ease: "power2.inOut"}, 0)
      .to("#bg", {duration: 0.3, backgroundColor: color, ease: "power2.inOut"}, 0)
      .to("#bgBubble", {duration: 0.3, backgroundColor: color, ease: "power2.inOut"}, 0);
  };

  const handleItemClick = (item: typeof navItems[0], index: number) => {
    if (item.requiresTable && !isTable) return;
    
    moveToItem(index + 1, item.position, item.color);
    onViewChange(item.id);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4">
      <div 
        id="navbarContainer" 
        ref={navRef}
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{
          width: `${Math.max(400, visibleItems.length * 80)}px`,
          height: '80px',
          backgroundColor: '#ffcc80'
        }}
      >
        {/* Background with goo effect */}
        <div id="bgWrapper" className="absolute bottom-0 w-full h-20" style={{ filter: 'url(#goo)' }}>
          <div id="bg" className="w-full h-full" style={{ backgroundColor: '#ffcc80' }}></div>
          <div 
            id="bgBubble" 
            className="absolute w-16 h-16 rounded-full -bottom-12 transform -translate-x-1/2"
            style={{ 
              backgroundColor: '#ffcc80',
              left: visibleItems.length > 0 ? visibleItems[0].position : '50px'
            }}
          ></div>
        </div>

        {/* White navbar base */}
        <div className="absolute bottom-0 w-full h-12 bg-white"></div>

        {/* Bubbles */}
        <div className="absolute bottom-6 w-full flex justify-around px-4">
          {visibleItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <div
                key={item.id}
                id={`bubble${index + 1}`}
                className={`bubble bg-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive ? 'transform translate-y-0 opacity-100 shadow-md' : 'transform translate-y-full opacity-0'
                }`}
              >
                <IconComponent 
                  size={20} 
                  className={`nav-icon transition-opacity duration-200 ${
                    isActive ? 'opacity-70' : 'opacity-0'
                  }`} 
                />
              </div>
            );
          })}
        </div>

        {/* Menu items */}
        <div className="absolute bottom-0 w-full flex justify-around px-4 pb-2">
          {visibleItems.map((item, index) => {
            const IconComponent = item.icon;
            const isDisabled = item.requiresTable && !isTable;
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item, index)}
                disabled={isDisabled}
                className={`menuElement transform translate-y-full transition-all duration-200 hover:opacity-60 ${
                  isDisabled ? 'opacity-20 cursor-not-allowed' : 'opacity-40 cursor-pointer'
                }`}
                title={isDisabled ? 'Requires Table access' : item.label}
              >
                <IconComponent size={20} />
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG filter for goo effect */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default AnimatedNavigation;