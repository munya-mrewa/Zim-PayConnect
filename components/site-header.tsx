"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SiteHeader() {
  const [isOpen, setIsOpen] = React.useState(false);
  // Mock logged-in state for now - replace with actual auth logic
  const isLoggedIn = false; 

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link className="mr-8 flex items-center space-x-2 font-bold text-xl tracking-tight text-white" href="/">
            Zim-PayConnect
          </Link>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link className="text-zinc-400 hover:text-white transition-colors" href="/#features">
              Features
            </Link>
            <Link className="text-zinc-400 hover:text-white transition-colors" href="/#pricing">
              Pricing
            </Link>
            <Link className="text-zinc-400 hover:text-white transition-colors" href="/about">
              About
            </Link>
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="@shadcn" />
                    <AvatarFallback>ZM</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">User Name</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white cursor-pointer text-red-500 hover:text-red-400">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/10">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-white text-black font-semibold hover:bg-zinc-100 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] border border-transparent hover:border-white/50">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-50 bg-black/95 backdrop-blur-xl border-t border-white/10 p-6 animate-in slide-in-from-top-5 fade-in-20">
          <nav className="flex flex-col space-y-6">
            <Link
              href="/#features"
              className="text-lg font-medium text-zinc-300 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-lg font-medium text-zinc-300 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-lg font-medium text-zinc-300 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <div className="h-[1px] bg-white/10 my-2" />
            <Link
              href="/login"
              className="text-lg font-medium text-zinc-300 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-lg font-medium text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
