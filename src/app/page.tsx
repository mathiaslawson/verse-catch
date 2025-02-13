"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3001';

const AudioStreamer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      setError(null);
    });

    socket.on('status', (status) => {
      setIsConnected(status.connected);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setIsConnected(false);
      setError('Failed to connect to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    socket.on('transcription', (data: { text: string }) => {
      setTranscription(prev => prev + ' ' + data.text);
    });

    socket.on('error', (data: { message: string, details?: string }) => {
      setError(data.message);
      console.error('Server error:', data.details || data.message);
    });

    socketRef.current = socket;

    
    return () => {
      socket.disconnect();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000 
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          const arrayBuffer = await event.data.arrayBuffer();
          socketRef.current.emit('audio-stream', arrayBuffer);
        }
      };

      mediaRecorder.start(1000); 
      setIsRecording(true);
      setError(null);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Error accessing microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Audio Streamer 
          <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            ({isConnected ? 'Connected' : 'Disconnected'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-2 text-red-500 bg-red-50 rounded">
            {error}
          </div>
        )}
        
        <div className="flex justify-center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            className="w-32"
            disabled={!isConnected}
          >
            {isRecording ? (
              <>
                <MicOff className="mr-2 h-4 w-4" /> Stop
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" /> Start
              </>
            )}
          </Button>
        </div>
        
        <div className="p-4 bg-gray-100 rounded-lg min-h-32">
          <p className="text-gray-700">{transcription || 'Transcription will appear here...'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioStreamer;