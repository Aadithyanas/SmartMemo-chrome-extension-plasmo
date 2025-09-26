"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface SummaryProps {
    text: string | null
    onSummaryComplete?: (summaryText: string) => void
}

export const SummaryText: React.FC<SummaryProps> = ({ text, onSummaryComplete }) => {
    const [processing, setProcessing] = useState<boolean>(false)
    const [summary, setSummary] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [lastSummaryKey, setLastSummaryKey] = useState<string>("")
    const abortControllerRef = useRef<AbortController | null>(null)

    const handleSummary = async (forceRetry = false) => {
        if (!text) {
            setError("Text is missing")
            return
        }

        const summaryKey = text

        // Skip if we already have this summary and it's not a retry
        if (!forceRetry && lastSummaryKey === summaryKey && summary) {
            return
        }

        // Cancel any ongoing summary generation
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        setProcessing(true)
        setError(null)

        // Only clear previous summary if it's different text
        if (lastSummaryKey !== summaryKey) {
            setSummary(null)
        }

        try {
            // Create new abort controller for this request
            abortControllerRef.current = new AbortController()

            // Type assertion for chrome extension API
            const chromeRuntime = (globalThis as any).chrome?.runtime

            if (!chromeRuntime) {
                throw new Error("Chrome extension API not available")
            }

            chromeRuntime.sendMessage(
                {
                    type: "SUMMARIZED_THE_TRANSCRIPT",
                    transcript: text,
                },
                (response: any) => {
                    // Check if this request was aborted
                    if (abortControllerRef.current?.signal.aborted) {
                        return
                    }

                    setProcessing(false)
                    if (response?.success) {
                        setSummary(response.text)
                        setLastSummaryKey(summaryKey)
                        if (onSummaryComplete) {
                            onSummaryComplete(response.text)
                        }
                    } else {
                        setError(response?.error || "Summary failed")
                        console.error("Summary failed:", response?.error)
                    }
                },
            )
        } catch (err) {
            if (!abortControllerRef.current?.signal.aborted) {
                setProcessing(false)
                setError("Failed to generate summary")
                console.error("Summary generation failed", err)
            }
        }
    }

    // Auto-summarize when text changes
    useEffect(() => {
        if (text) {
            const summaryKey = text
            // Only summarize if we don't already have this text summarized
            if (lastSummaryKey !== summaryKey) {
                handleSummary()
            }
        }

        // Cleanup function to abort ongoing requests
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [text])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const handleRetry = () => {
        handleSummary(true)
    }

    return (
        <div className="w-full">
            {processing && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span className="text-white/80 text-sm">Generating summary...</span>
                </div>
            )}

            {error && (
                <div className="p-3 mb-2 bg-red-500/10 text-red-300 rounded-xl text-sm border border-red-500/20">
                    <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={handleRetry}
                            className="ml-2 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-100 text-xs transition-all duration-200"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {summary && !processing && (
                <div className="w-full">
                    <p className="text-white text-sm leading-relaxed break-words whitespace-pre-wrap">{summary}</p>
                </div>
            )}

            {!processing && !summary && !error && text && (
                <div className="text-center py-4 text-white/50 text-sm">Preparing summary...</div>
            )}
        </div>
    )
}

export default SummaryText
