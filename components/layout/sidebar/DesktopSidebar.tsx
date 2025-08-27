"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../auth/Auth";

export default function DesktopSidebar() {
  const { showWaves } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const NavItem = ({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) => (
    <div className="tw-block tw-px-3 tw-py-2 tw-rounded-md tw-text-sm tw-text-iron-300 hover:tw-text-white hover:tw-bg-iron-800 tw-transition-colors">
      {href ? (
        <Link href={href} className="tw-no-underline tw-text-inherit">
          {children}
        </Link>
      ) : (
        <button onClick={onClick} className="tw-w-full tw-text-left tw-bg-transparent tw-border-0 tw-p-0 tw-text-inherit">
          {children}
        </button>
      )}
    </div>
  );

  const NavSection = ({ title, children, isExpanded, onToggle }: { 
    title: string; 
    children: React.ReactNode; 
    isExpanded: boolean; 
    onToggle: () => void; 
  }) => (
    <div>
      <NavItem onClick={onToggle}>
        <div className="tw-flex tw-justify-between tw-items-center">
          {title}
          <span className={`tw-transition-transform ${isExpanded ? 'tw-rotate-90' : ''}`}>›</span>
        </div>
      </NavItem>
      {isExpanded && (
        <div className="tw-ml-4 tw-mt-1 tw-space-y-1">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="tw-w-64 tw-h-full tw-bg-black tw-border-r tw-border-iron-700 tw-flex tw-flex-col">
      {/* Logo/Brand Section */}
      <div className="tw-p-4 tw-border-b tw-border-iron-700">
        <Link href="/" className="tw-no-underline">
          <div className="tw-text-white tw-font-bold tw-text-lg">
            6529
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="tw-flex-1 tw-overflow-y-auto tw-p-2">
        <nav className="tw-space-y-1">
          <NavItem href="/">Home</NavItem>
          
          {showWaves && (
            <NavSection 
              title="Brain" 
              isExpanded={expandedSections.includes('brain')}
              onToggle={() => toggleSection('brain')}
            >
              <NavItem href="/my-stream">My Stream</NavItem>
              <NavItem href="/waves">Waves</NavItem>
            </NavSection>
          )}

          <NavSection 
            title="Collections" 
            isExpanded={expandedSections.includes('collections')}
            onToggle={() => toggleSection('collections')}
          >
            <NavItem href="/the-memes">The Memes</NavItem>
            <NavItem href="/6529-gradient">Gradient</NavItem>
            <NavItem href="/nextgen">NextGen</NavItem>
            <NavItem href="/meme-lab">Meme Lab</NavItem>
            <NavItem href="/rememes">ReMemes</NavItem>
          </NavSection>

          <NavSection 
            title="Network" 
            isExpanded={expandedSections.includes('network')}
            onToggle={() => toggleSection('network')}
          >
            <NavItem href="/network">Identities</NavItem>
            <NavItem href="/network/activity">Activity</NavItem>
            <NavItem href="/network/groups">Groups</NavItem>
            <NavItem href="/network/nft-activity">NFT Activity</NavItem>
          </NavSection>

          <NavSection 
            title="Tools" 
            isExpanded={expandedSections.includes('tools')}
            onToggle={() => toggleSection('tools')}
          >
            <NavItem href="/tools/delegation">Delegation Center</NavItem>
            <NavItem href="/api">API</NavItem>
            <NavItem href="/emma">EMMA</NavItem>
            <NavItem href="/block-finder">Block Finder</NavItem>
          </NavSection>

          <NavSection 
            title="About" 
            isExpanded={expandedSections.includes('about')}
            onToggle={() => toggleSection('about')}
          >
            <NavItem href="/about/the-memes">The Memes</NavItem>
            <NavItem href="/about/subscriptions">Subscriptions</NavItem>
            <NavItem href="/about/memes-calendar">Memes Calendar</NavItem>
            <NavItem href="/about">FAQ</NavItem>
          </NavSection>
        </nav>
      </div>

      {/* User Section */}
      <div className="tw-p-4 tw-border-t tw-border-iron-700">
        <div className="tw-text-iron-300 tw-text-sm">User Area</div>
      </div>
    </div>
  );
}