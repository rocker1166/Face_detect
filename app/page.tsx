'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const FaceRecognitionComponent = dynamic(
  () => import('../components/FaceRecognition').then((mod) => mod.default),
  { ssr: false }
)

export default function Home() {
  const [matchInfo, setMatchInfo] = useState<{ name: string; time: string } | null>(null)

  const handleFaceMatched = (name: string, time: string) => {
    setMatchInfo({ name, time })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold mb-4">
          Live Face Recognition
        </h1>
        <FaceRecognitionComponent onFaceMatched={handleFaceMatched} />
        {matchInfo && (
          <div className="mt-4 text-2xl">
            Face matched: {matchInfo.name} at {matchInfo.time}
          </div>
        )}
      </main>
    </div>
  )
}