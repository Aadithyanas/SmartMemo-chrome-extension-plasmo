import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useRef, useState } from "react"
import {RecordingCard}  from "../features/RecordingCard"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16
  let updatedCssText = cssText.replaceAll(":root", ":host(csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize
    return `${pixelsValue}px`
  })
  const styleElement = document.createElement("style")
  styleElement.textContent = updatedCssText
  return styleElement
}

const RecordingPanel = () => {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 10, y: 100 })
  const offset = useRef({ x: 0, y: 0 })

  // Constrain position to viewport bounds
  const constrainPosition = (x: number, y: number) => {
    const panel = panelRef.current
    if (!panel) return { x, y }

    const rect = panel.getBoundingClientRect()
    const maxX = window.innerWidth - rect.width
    const maxY = window.innerHeight - rect.height

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      e.preventDefault() // Prevent text selection while dragging
      
      const newX = e.clientX - offset.current.x
      const newY = e.clientY - offset.current.y
      
      const constrainedPosition = constrainPosition(newX, newY)
      setPosition(constrainedPosition)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      // Add event listeners to document to ensure we capture mouse events even when cursor leaves the panel
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      
      // Disable text selection while dragging
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
    }
  }, [isDragging])

  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault()
    const rect = panelRef.current?.getBoundingClientRect()
    if (rect) {
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      setIsDragging(true)
    }
  }

  // Handle window resize to keep panel in bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => constrainPosition(prev.x, prev.y))
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      ref={panelRef}
      onMouseDown={startDragging}
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 9999,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none", // Prevent text selection on the panel itself
        touchAction: "none" // Prevent touch scrolling on mobile
      }}
    >
      <RecordingCard/>
    </div>
  )
}

export default RecordingPanel