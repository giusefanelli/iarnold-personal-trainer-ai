
import React, { useState, useRef, useEffect } from 'react';
import { WorkoutPlanType, ChatMessage } from '../types';
import { askAboutWorkoutPlan } from '../services/geminiService';
import { SendIcon } from './icons/SendIcon';
import { BodybuilderIcon } from './icons/BodybuilderIcon';

interface Props {
  plan: WorkoutPlanType;
}

// Helper function to render text with clickable Markdown-style links
const renderWithLinks = (text: string) => {
    // Regex to find Markdown links: [link text](url)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts = text.split(linkRegex);

    return (
        <React.Fragment>
            {parts.map((part, i) => {
                // The link text is at index 1, 4, 7, ...
                if (i % 3 === 1) {
                    const url = parts[i + 1]; // The URL is the next part
                    return (
                        <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 font-semibold hover:underline"
                        >
                            {part}
                        </a>
                    );
                }
                // The URL part, we skip it as it's already used
                if (i % 3 === 2) {
                    return null;
                }
                // Regular text part
                return part;
            })}
        </React.Fragment>
    );
};

const WorkoutChat: React.FC<Props> = ({ plan }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat container when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: prompt };
    // Add user message and a temporary empty model message for the loading state
    setMessages(prev => [...prev, userMessage, { role: 'model', text: '' }]);
    setPrompt('');
    setIsLoading(true);

    try {
      const responseText = await askAboutWorkoutPlan(plan, prompt);
      
      // Update the last (model) message with the full response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = responseText;
        return newMessages;
      });

    } catch (error) {
      console.error("Chat error:", error);
       setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = "Si è verificato un errore. Riprova.";
          return newMessages;
        });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="mt-12 p-4 md:p-6 bg-slate-800/50 border border-slate-700 rounded-lg print:hidden">
      <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
        <div className="w-8 h-8 flex-shrink-0">
          <BodybuilderIcon className="w-full h-full text-cyan-400" />
        </div>
        <span>Chiedi a IArnold</span>
      </h3>
      <div 
        ref={chatContainerRef} 
        className="h-64 overflow-y-auto space-y-4 p-4 bg-slate-900/50 rounded-md border border-slate-700/50 mb-4"
        aria-live="polite"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center border border-cyan-700/50">
                 <BodybuilderIcon className="w-6 h-6 text-cyan-400" />
              </div>
            )}
            <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700/50 text-slate-200'}`}>
              <div className="whitespace-pre-wrap">
                {msg.text ? renderWithLinks(msg.text) : <span className="animate-pulse">...</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Chiedi qualcosa sulla tua scheda..."
          className="flex-grow w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
          rows={1}
          disabled={isLoading}
          aria-label="La tua domanda per l'IA"
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="flex-shrink-0 p-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          aria-label="Invia domanda"
        >
          <SendIcon className="w-5 h-5"/>
        </button>
      </form>
    </div>
  );
};

export default WorkoutChat;
