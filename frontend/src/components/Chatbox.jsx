import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, ImagePlus } from 'lucide-react';
import axios from 'axios';

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Chào bạn! ✨ Mình là AI Trợ lý của PLVCinema, bạn đang phân vân chưa biết xem phim gì hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh định dạng JPG/PNG!');
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800; // Nén ảnh xuống tối đa 800px để gửi qua API nhanh hơn
        
        if (width > MAX_WIDTH) {
          height = Math.floor(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage({
          preview: compressedBase64,
          rawBase64: compressedBase64.split(',')[1],
          mimeType: 'image/jpeg'
        });
      };
    };
    
    // Reset input để chọn lại file cũ nếu muốn
    e.target.value = null;
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage = input.trim();
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage, image: currentImage?.preview }]);
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
      const payload = {
        message: userMessage,
        imageBase64: currentImage?.rawBase64,
        imageMimeType: currentImage?.mimeType
      };
      
      const response = await axios.post(`${apiUrl}/v1/chat`, payload);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Xin lỗi, hệ thống tư vấn đang gặp sự cố. Bạn vui lòng thử lại sau vài giây nhé! 🛠️' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-gray-50/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] w-[calc(100vw-2rem)] sm:w-[400px] h-[min(580px,calc(100vh-6rem))] flex flex-col mb-4 sm:mb-6 overflow-hidden border border-white/20 transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-5 fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white p-5 flex justify-between items-center z-10 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative bg-white/20 backdrop-blur-sm p-2 rounded-2xl shadow-inner">
                <Bot size={24} className="text-white drop-shadow-md" />
                <Sparkles size={12} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-wide drop-shadow-sm">Cố Vấn Điện Ảnh AI</h3>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                  <p className="text-xs text-indigo-100 font-medium">Đang trực tuyến ⚡</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <X size={22} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-gray-50 to-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
               <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end group`}>
                  
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white ml-2' 
                      : 'bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white mr-2 ring-2 ring-white'
                  }`}>
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  {/* Bubble */}
                  <div className={`py-3 px-4 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-3xl rounded-br-sm shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]' 
                      : 'bg-white text-gray-800 rounded-3xl rounded-bl-sm shadow-md border border-gray-100/80'
                  }`}>
                    {msg.image && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/20">
                        <img src={msg.image} alt="User Upload" className="max-w-full h-auto max-h-48 object-cover rounded shadow-inner" />
                      </div>
                    )}
                    {msg.content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex max-w-[85%] flex-row items-end">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white mr-2 ring-2 ring-white shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="py-4 px-5 rounded-3xl bg-white border border-gray-100 rounded-bl-sm shadow-md flex space-x-2">
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 bg-white border-t border-gray-100/80 shadow-[0_-5px_20px_-15px_rgba(0,0,0,0.1)] rounded-b-3xl relative">
            
            {/* Image Preview Overlay */}
            {selectedImage && (
              <div className="absolute bottom-[80px] left-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="relative inline-block bg-white p-1 rounded-xl shadow-lg border border-indigo-100">
                  <img src={selectedImage.preview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                  <button 
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 hover:scale-110 transition-all shadow-md focus:outline-none"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center bg-gray-50 hover:bg-white border-2 border-gray-100 rounded-full pl-2 pr-2 py-2 focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 focus-within:bg-white transition-all shadow-inner">
              
              {/* Image Upload Button */}
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 text-indigo-500 hover:bg-indigo-100/50 rounded-full transition-colors focus:outline-none disabled:opacity-50"
                title="Đính kèm Hình Ảnh HD"
              >
                <ImagePlus size={22} className={selectedImage ? "text-indigo-600 animate-pulse" : ""} />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedImage ? "Bạn có thắc mắc gì về ảnh này?" : "Hỏi AI bất kỳ điều gì về phim..."}
                className="flex-1 bg-transparent px-3 outline-none text-[15px] py-1 text-gray-700 placeholder-gray-400 truncate"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={`ml-2 p-2 sm:p-2.5 rounded-full outline-none transition-all duration-300 flex items-center justify-center flex-shrink-0
                  ${isLoading || (!input.trim() && !selectedImage)
                    ? 'bg-gray-100 text-gray-400' 
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-105 active:scale-95'}`}
              >
                <Send size={18} className={(input.trim() || selectedImage) && !isLoading ? 'translate-x-0.5' : ''} />
              </button>
            </div>
            <div className="text-center mt-2.5">
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">AI có thể cung cấp thông tin không chính xác. Hãy kiểm tra lại.</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group focus:outline-none"
        >
          {/* Animated Glow Ring */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 rounded-full animate-ping opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
          
          {/* Core Button */}
          <div className="relative flex items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 text-white p-4 sm:p-5 rounded-full shadow-[0_10px_40px_-10px_rgba(79,70,229,0.8)] hover:shadow-[0_20px_50px_-10px_rgba(79,70,229,1)] hover:-translate-y-1 scale-100 hover:scale-105 transition-all duration-300 border border-white/20">
            <MessageCircle size={32} className="group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 drop-shadow-md" />
            <Sparkles size={16} className="absolute top-2 right-2 text-yellow-300 animate-pulse drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]" />
          </div>

          {/* Tooltip */}
          <span className="absolute right-full mr-5 top-1/2 -translate-y-1/2 bg-gray-900/90 backdrop-blur-sm text-white text-[13px] font-medium px-4 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 pointer-events-none transition-all duration-300 whitespace-nowrap border border-white/10 flex items-center space-x-2">
            <span>Hỏi AI chọn phim ngay!</span>
            <span className="animate-bounce">👉</span>
            {/* Arrow tail for tooltip */}
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900/90 rotate-45 border-r border-t border-white/10"></div>
          </span>
        </button>
      )}
    </div>
  );
};

export default Chatbox;
