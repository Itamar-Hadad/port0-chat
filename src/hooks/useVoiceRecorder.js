import { useRef, useState } from 'react'

const MAX_RECORDING_MS = 2 * 60 * 1000

export function useVoiceRecorder(onRecordingComplete) {
  const [isRecording, setIsRecording] = useState(false)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [error, setError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const tickRef = useRef(null)
  const autoStopRef = useRef(null)
  const durationRef = useRef(0)

  async function startRecording() {
    setError(null)
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      setError(err.message)
      return
    }
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    const recorder = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      clearInterval(tickRef.current)
      clearTimeout(autoStopRef.current)
      stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      onRecordingComplete(new Blob(chunksRef.current, { type: mimeType }), durationRef.current)
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
    durationRef.current = 0
    setDurationSeconds(0)
    tickRef.current = setInterval(() => {
      durationRef.current += 1
      setDurationSeconds(durationRef.current)
    }, 1000)
    autoStopRef.current = setTimeout(stopRecording, MAX_RECORDING_MS)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  return { isRecording, durationSeconds, error, startRecording, stopRecording }
}
