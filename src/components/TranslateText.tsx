"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { translateText } from "services/geminiServices"

interface summaryProps {
    text: string | null
    target: string | null
    onTranslationComplete?: (translatedText: string) => void
}

export const TranslateText: React.FC<summaryProps> = ({ text, target, onTranslationComplete }) => {
    const [processing, setProcessing] = useState<boolean>(false)
    const [translatedtext, setTranslatedText] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [lastTranslationKey, setLastTranslationKey] = useState<string>("")
    const abortControllerRef = useRef<AbortController | null>(null)

    const handleTranslation = async (forceRetry = false) => {
        if (!text || !target) {
            setError("Text or target language is missing")
            return
        }

        const translationKey = `${text}-${target}`

        // Skip if we already have this translation and it's not a retry
        if (!forceRetry && lastTranslationKey === translationKey && translatedtext) {
            return
        }

        // Cancel any ongoing translation
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        setProcessing(true)
        setError(null)

        // Only clear previous translation if it's a different language/text combination
        if (lastTranslationKey !== translationKey) {
            setTranslatedText(null)
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
                    type: "TRANSALTE_TEXT_TO_TARGET_LANG",
                    text,
                    target,
                },
                (response: any) => {
                    // Check if this request was aborted
                    if (abortControllerRef.current?.signal.aborted) {
                        return
                    }

                    setProcessing(false)
                    if (response?.success) {
                        setTranslatedText(response.text)
                        setLastTranslationKey(translationKey)
                        if (onTranslationComplete) {
                            onTranslationComplete(response.text)
                        }
                    } else {
                        setError(response?.error || "Translation failed")
                    }
                },
            )
        } catch (err) {
            if (!abortControllerRef.current?.signal.aborted) {
                setProcessing(false)
                setError("Failed to generate translation")
                console.error("Translation generation failed", err)
            }
        }
    }

    // Auto-translate when text or target language changes
    useEffect(() => {
        if (text && target) {
            const translationKey = `${text}-${target}`
            // Only translate if we don't already have this combination
            if (lastTranslationKey !== translationKey) {
                handleTranslation()
            }
        }

        // Cleanup function to abort ongoing requests
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [text, target])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const handleRetry = () => {
        handleTranslation(true)
    }

    return (
        <div className="w-full">
            {processing && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span className="text-white/80 text-sm">Generating translation...</span>
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

            {translatedtext && !processing && (
                <div className="w-full">
                    <p className="text-white text-sm leading-relaxed break-words whitespace-pre-wrap">{translatedtext}</p>
                </div>
            )}

            {!processing && !translatedtext && !error && text && target && (
                <div className="text-center py-4 text-white/50 text-sm">Preparing translation...</div>
            )}
        </div>
    )
}

export default TranslateText
