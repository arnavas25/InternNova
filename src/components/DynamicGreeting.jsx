import { useState, useEffect } from 'react';

export default function DynamicGreeting() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      setGreeting('Good Morning ☀️');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good Afternoon 🌤️');
    } else if (hour >= 17 && hour < 22) {
      setGreeting('Good Evening 🌙');
    } else {
      setGreeting('Working Late Night? 🦉');
    }
  }, []);

  return (
    <span className="dynamic-greeting font-medium text-blue-600 dark:text-blue-400">
      {greeting}
    </span>
  );
}
