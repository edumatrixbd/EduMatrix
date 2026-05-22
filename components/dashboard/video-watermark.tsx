"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"

export function VideoWatermark() {
  const { user } = useAuth()
  const [ipAddress, setIpAddress] = useState<string>("")

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.text())
      .then(text => {
        if (text) {
          try {
            const data = JSON.parse(text)
            setIpAddress(data.ip)
          } catch (e) {
            setIpAddress("Protected")
          }
        } else {
          setIpAddress("Protected")
        }
      })
      .catch(() => setIpAddress("Protected"))
  }, [])

  if (!user) return null

  const watermarkText = `${user.full_name || (user as any).name || "User"} • ${(user as any).phone || "No phone"} • ${ipAddress}`

  return (
    <div className="absolute top-1/2 left-1/2 pointer-events-none z-10" aria-hidden="true">
      <p
        className="video-watermark text-white text-base font-medium tracking-wider select-none"
        style={{
          opacity: 0.12,
          transform: "translate(-50%, -50%) rotate(-18deg)",
          whiteSpace: "nowrap",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
        }}
      >
        {watermarkText}
      </p>
    </div>
  )
}
