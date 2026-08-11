import React, { useEffect, useState } from 'react';

interface Props {
  nodeId: string;
  onClose: () => void;
}

export const CiscoTerminal: React.FC<Props> = ({ nodeId, onClose }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    };
    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove as EventListener);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove as EventListener);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove as EventListener);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, dragStart]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  useEffect(() => {
    const terminalData: Record<string, string[]> = {
      'mlt_sw1': [
        "Mlt-SW1>enable",
        "Mlt-SW1#show cdp neighbors",
        "Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge",
        "                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone",
        "Device ID    Local Intrfce   Holdtme    Capability   Platform    Port ID",
        "ICT-SW       Gig 1/0/7        121            S       2960        Fas 0/1",
        "CORE-R2      Gig 1/0/2        121            R       C2900       Gig 0/0",
        "Admin-SW     Gig 1/0/6        121            S       2960        Fas 0/1",
        "HR-SW        Gig 1/0/4        121            S       2960        Fas 0/1",
        "ServerRoom-SW",
        "             Gig 1/0/8        121            S       2960        Fas 0/1",
        "Finance-SW   Gig 1/0/5        121            S       2960        Fas 0/1",
        "CORE-R1      Gig 1/0/1        121            R       C2900       Gig 0/0",
        "Sales-SW     Gig 1/0/3        121            S       2960        Fas 0/1",
        "Mlt-SW1#"
      ],
      'main_router': [
        "Main_Router>enable",
        "Main_Router#show ip route",
        "Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP",
        "Gateway of last resort is not set",
        "",
        "      192.168.0.0/24 is variably subnetted, 4 subnets, 2 masks",
        "C        192.168.1.0/24 is directly connected, GigabitEthernet0/0/0",
        "L        192.168.1.1/32 is directly connected, GigabitEthernet0/0/0",
        "C        192.168.3.0/24 is directly connected, GigabitEthernet0/0/1",
        "L        192.168.3.1/32 is directly connected, GigabitEthernet0/0/1"
      ],
      'college_router': [
        "College_Router>enable",
        "College_Router#show access-lists",
        "Standard IP access list 10 (Yellow Zone Bypass)",
        "    10 permit 192.168.1.0, wildcard bits 0.0.0.255 (45 matches)",
        "Extended IP access list 100 (AB2 Girls Only)",
        "    10 permit ip 192.168.3.2 0.0.0.3 host 192.168.1.10 (22 matches)",
        "    20 deny ip any any (134 matches)"
      ],
      'hostel_router': [
        "Hostel_Router>enable",
        "Hostel_Router#show access-lists",
        "Extended IP access list 110 (AB1 Boys Only)",
        "    10 permit ip 192.168.3.6 0.0.0.3 host 192.168.1.14 (89 matches)",
        "    20 deny ip any any (412 matches)"
      ]
    };

    const fullText = terminalData[nodeId];
    if (!fullText) return;

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < fullText.length) {
        setLines(prev => [...prev, fullText[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 150); // Simulate typing speed

    return () => {
      clearInterval(interval);
      setLines([]);
    };
  }, [nodeId]);

  if (!['mlt_sw1', 'main_router', 'college_router', 'hostel_router'].includes(nodeId)) return null;

  return (
    <div 
      className="absolute bottom-4 right-4 w-[calc(100vw-32px)] sm:w-[500px] md:w-[600px] max-w-[600px] bg-black border-2 border-gray-600 rounded shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[100] flex flex-col font-mono text-sm overflow-hidden"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      <div 
        className="bg-gray-800 text-gray-300 px-3 py-2 md:py-1 flex justify-between items-center border-b border-gray-600 cursor-move select-none touch-none"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <span className="font-bold text-xs tracking-wider">Terminal - {nodeId}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          onTouchEnd={(e) => { e.stopPropagation(); onClose(); }}
          className="hover:text-red-400 font-bold transition-colors cursor-pointer px-2 py-1 bg-gray-700/50 rounded md:bg-transparent md:p-0"
        >
          X
        </button>
      </div>
      <div className="p-4 text-green-500 h-[320px] overflow-y-auto whitespace-pre">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <div className="w-2 h-4 bg-green-500 animate-[pulse_1s_ease-in-out_infinite] inline-block align-middle ml-1 mt-1"></div>
      </div>
    </div>
  );
};
