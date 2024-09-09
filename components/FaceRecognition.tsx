'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as faceapi from 'face-api.js'

interface FaceRecognitionProps {
  onFaceMatched: (name: string, time: string) => void;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onFaceMatched }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [labeledFaceDescriptors, setLabeledFaceDescriptors] = useState<faceapi.LabeledFaceDescriptors[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadModelsAndData = async () => {
      try {
        const MODEL_URL = '/models'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ])

        const labeledDescriptors = await loadLabeledDescriptors()
        setLabeledFaceDescriptors(labeledDescriptors)
        setModelsLoaded(true)
      } catch (err) {
        console.error('Error loading models or data:', err)
        setError('Failed to load face recognition models or data. Please check your internet connection and try again.')
      }
    }
    loadModelsAndData()
  }, [])

  useEffect(() => {
    if (modelsLoaded) {
      startVideo()
    }
  }, [modelsLoaded])

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch(err => {
        console.error('Error accessing webcam:', err)
        setError('Failed to access webcam. Please make sure you have granted permission to use the camera.')
      })
  }

  const loadLabeledDescriptors = async () => {
    try {
      const img = await faceapi.fetchImage('/labeled_images/suman/1.png')
      const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
      
      if (!detection) {
        throw new Error('No face detected in the provided image')
      }

      const labeledDescriptors = [
        new faceapi.LabeledFaceDescriptors(
          'Suman',
          [detection.descriptor]
        )
      ]
      return labeledDescriptors
    } catch (error) {
      console.error('Error loading labeled descriptors:', error)
      setError('Failed to load face data. Please check if the image file exists and is accessible.')
      return []
    }
  }

  useEffect(() => {
    if (modelsLoaded && labeledFaceDescriptors) {
      const videoEl = videoRef.current
      const canvasEl = canvasRef.current

      if (videoEl && canvasEl) {
        const recognizeFaces = async () => {
          const displaySize = { width: videoEl.width, height: videoEl.height }
          faceapi.matchDimensions(canvasEl, displaySize)

          const detections = await faceapi.detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors()

          const resizedDetections = faceapi.resizeResults(detections, displaySize)

          const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)

          const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))

          canvasEl.getContext('2d')?.clearRect(0, 0, canvasEl.width, canvasEl.height)

          results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
            drawBox.draw(canvasEl)
            console.log(`Recognized: ${result.label}`)
            if (result.label !== 'unknown') {
              const currentTime = new Date().toLocaleTimeString()
              onFaceMatched(result.label, currentTime)
            }
          })

          requestAnimationFrame(recognizeFaces)
        }

        videoEl.addEventListener('play', recognizeFaces)

        return () => {
          videoEl.removeEventListener('play', recognizeFaces)
        }
      }
    }
  }, [modelsLoaded, labeledFaceDescriptors, onFaceMatched])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="relative">
      <video ref={videoRef} width="640" height="480" autoPlay muted className="mb-4" />
      <canvas ref={canvasRef} width="640" height="480" className="absolute top-0 left-0" />
    </div>
  )
}

export default FaceRecognition