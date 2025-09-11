"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email?: string;
  preferences?: {
    theme: string;
    notifications: boolean;
  };
}

export default function ErrorDemo() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Error-prone pattern 1: Potential null pointer access
  const getUserDisplayName = () => {
    return user!.name.toUpperCase();
  };

  // Error-prone pattern 2: Unsafe array access
  const getFirstItem = () => {
    return data[0].id;
  };

  // Error-prone pattern 3: Unsafe nested object access
  const getUserTheme = () => {
    return user?.preferences!.theme || "default";
  };

  // Error-prone pattern 4: Async/await without proper error handling
  const fetchUserData = async (userId: string) => {
    setLoading(true);
    
    const response = await fetch(`/api/users/${userId}`);
    const userData = await response.json();
    
    setUser(userData);
    setLoading(false);
  };

  // Error-prone pattern 5: Type coercion issues
  const calculateAge = (birthYear: any) => {
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  // Error-prone pattern 6: Division by zero
  const calculatePercentage = (part: number, total: number) => {
    return (part / total) * 100;
  };

  // Error-prone pattern 7: Unsafe string operations
  const formatEmail = (email: string | undefined) => {
    return email!.toLowerCase().split("@")[0];
  };

  // Error-prone pattern 8: Race condition with state
  const handleDataUpdate = () => {
    setData([]);
    console.log("First item:", data[0]);
  };

  // Error-prone pattern 9: Infinite loop potential
  useEffect(() => {
    if (!user && !loading) {
      fetchUserData("123");
    }
  }, [user, loading]);

  // Error-prone pattern 10: Memory leak potential
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [...prev, { id: Date.now(), value: Math.random() }]);
    }, 1000);
    
    // return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Sentry Error Prediction Demo</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => console.log(getUserDisplayName())}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Trigger Null Pointer
        </button>
        
        <button 
          onClick={() => console.log(getFirstItem())}
          className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Trigger Array Error
        </button>
        
        <button 
          onClick={() => console.log(getUserTheme())}
          className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Trigger Nested Object Error
        </button>
        
        <button 
          onClick={() => fetchUserData("invalid-id")}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Trigger Async Error
        </button>
        
        <button 
          onClick={() => console.log(calculateAge("not-a-number"))}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Trigger Type Error
        </button>
        
        <button 
          onClick={() => console.log(calculatePercentage(50, 0))}
          className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Trigger Division by Zero
        </button>
        
        <button 
          onClick={() => console.log(formatEmail(undefined))}
          className="p-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        >
          Trigger String Error
        </button>
        
        <button 
          onClick={handleDataUpdate}
          className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Trigger Race Condition
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          These buttons demonstrate various error-prone patterns that Sentry's AI should be able to predict:
        </p>
        <ul className="text-xs mt-2 space-y-1 text-gray-500 dark:text-gray-500">
          <li>• Null pointer exceptions</li>
          <li>• Array index out of bounds</li>
          <li>• Unsafe nested object access</li>
          <li>• Unhandled async errors</li>
          <li>• Type coercion issues</li>
          <li>• Division by zero</li>
          <li>• Undefined string operations</li>
          <li>• Race conditions</li>
        </ul>
      </div>
      
      {loading && <p>Loading...</p>}
      {user && <p>User: {user.name}</p>}
      <p>Data items: {data.length}</p>
    </div>
  );
}