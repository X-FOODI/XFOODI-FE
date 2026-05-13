'use client';

import React from 'react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              RestX
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/menu" className="text-gray-700 hover:text-blue-600 transition-colors">
              Menu
            </Link>
            <Link href="/reservations" className="text-gray-700 hover:text-blue-600 transition-colors">
              Reservations
            </Link>
            <Link href="/orders" className="text-gray-700 hover:text-blue-600 transition-colors">
              Orders
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
