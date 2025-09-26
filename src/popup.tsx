"use client"

import { useState, useEffect, useRef } from "react"
import { gsap } from "gsap"
import MemosList from "./features/MemosList"
import { RecordingCard } from "./features/RecordingCard"
import type { VoiceMemo } from "../types"
import './style.css'

export default function Popup() {
  const [activeTab, setActiveTab] = useState<"record" | "memos">("record")
  const [editingMemo, setEditingMemo] = useState<VoiceMemo | null>(null)
  
  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)

  const handleEditMemo = (memo: VoiceMemo) => {
    setEditingMemo(memo)
    setActiveTab("record")
  }

  const handleEditComplete = () => {
    setEditingMemo(null)
    setActiveTab("memos")
  }

  const handleTabChange = (tab: "record" | "memos") => {
    if (tab === activeTab) return
    
    // Animate tab change
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setActiveTab(tab)
          gsap.fromTo(contentRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
          )
        }
      })
    } else {
      setActiveTab(tab)
    }
  }

  useEffect(() => {
    // Initial animation sequence
    const tl = gsap.timeline()
    
    if (containerRef.current) {
      tl.fromTo(containerRef.current, 
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power2.out" }
      )
    }
    
    if (headerRef.current) {
      tl.fromTo(headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.3"
      )
    }
    
    if (tabsRef.current) {
      tl.fromTo(tabsRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "-=0.2"
      )
    }
    
    if (contentRef.current) {
      tl.fromTo(contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.1"
      )
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="w-[22rem] max-h-[580px] bg-white/95 backdrop-blur-2xl border border-gray-200/20 shadow-2xl relative overflow-hidden rounded-3xl flex flex-col"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Subtle background elements */}
      <div 
        ref={backgroundRef}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pink-500/5 to-orange-500/5 rounded-full blur-xl"></div>
      </div>

      {/* Header */}
      <div 
        ref={headerRef}
        className="relative border-b border-gray-200/30 px-6 py-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              SmartMemo
            </h1>
            <p className="text-sm text-gray-500 font-medium">AI Voice Assistant</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div 
        ref={tabsRef}
        className="border-b border-gray-200/30 relative"
      >
        <div className="flex relative px-2 py-1">
          {/* Active tab background */}
          <div 
            className="absolute top-1 bottom-1 bg-gray-100 rounded-xl transition-all duration-300 ease-out"
            style={{
              width: 'calc(50% - 4px)',
              left: activeTab === "record" ? '4px' : 'calc(50% + 4px)'
            }}
          />
          
          <button
            onClick={() => handleTabChange("record")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 relative group rounded-xl ${
              activeTab === "record" 
                ? "text-gray-900" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="font-semibold">{editingMemo ? "Edit Memo" : "Record"}</span>
            </div>
          </button>
          
          <button
            onClick={() => handleTabChange("memos")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 relative group rounded-xl ${
              activeTab === "memos" 
                ? "text-gray-900" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-semibold">Memos</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto relative"
        style={{ maxHeight: 'calc(580px - 140px)' }}
      >
        {activeTab === "record" && (
          <div className="p-6 flex items-center justify-center min-h-[300px]">
            <RecordingCard editingMemo={editingMemo} onEditComplete={handleEditComplete} />
          </div>
        )}
        {activeTab === "memos" && <MemosList onEditMemo={handleEditMemo} />}
      </div>
    </div>
  )
}
