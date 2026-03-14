import React, { useState, useRef, useEffect } from 'react';
import Select from 'react-select';
import { toPng, toJpeg } from 'html-to-image';
import RichTextEditor from './components/RichTextEditor';
import { 
  Download, Settings, Image as ImageIcon, Layout, Check, 
  Wand2, Layers, Save, Facebook, ZoomIn, MoveHorizontal, MoveVertical, Flame, AlertCircle, Trash2,
  Menu, X, LayoutTemplate, Info, CreditCard, Mail, ArrowRight,
  Twitter, Youtube, Instagram, Linkedin, Globe, Ghost, MessageCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateNewsContent, generateSocialCaption } from './services/ai';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ImageItem {
  id: string;
  url: string;
  zoom: number;
  panX: number;
  panY: number;
}

const CollageRenderer = ({ images, layout, activeImageId }: { images: ImageItem[], layout: string, activeImageId?: string | null }) => {
  if (images.length === 0) return null;

  const renderImage = (img: ImageItem, className: string) => (
    <div key={img.id} className={`overflow-hidden ${className}`}>
      <img 
        src={img.url} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: `${img.panX}% ${img.panY}%`,
          transform: `scale(${img.zoom / 100})`,
          transformOrigin: `${img.panX}% ${img.panY}%`,
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );

  if (layout === 'single' || images.length === 1) {
    const activeImg = activeImageId ? (images.find(i => i.id === activeImageId) || images[0]) : images[0];
    return renderImage(activeImg, "absolute inset-0 z-0");
  }
  if (layout === 'split-h') {
    return (
      <div className="absolute inset-0 z-0 flex">
        {renderImage(images[0], "relative flex-1")}
        {images.length > 1 && renderImage(images[1], "relative flex-1")}
      </div>
    );
  }
  if (layout === 'split-v') {
    return (
      <div className="absolute inset-0 z-0 flex flex-col">
        {renderImage(images[0], "relative flex-1")}
        {images.length > 1 && renderImage(images[1], "relative flex-1")}
      </div>
    );
  }
  if (layout === 'grid-3') {
    return (
      <div className="absolute inset-0 z-0 flex">
        {renderImage(images[0], "relative flex-[2]")}
        <div className="relative flex-1 flex flex-col">
          {images.length > 1 && renderImage(images[1], "relative flex-1")}
          {images.length > 2 && renderImage(images[2], "relative flex-1")}
        </div>
      </div>
    );
  }
  if (layout === 'grid-4') {
    return (
      <div className="absolute inset-0 z-0 grid grid-cols-2 grid-rows-2">
        {renderImage(images[0], "relative w-full h-full")}
        {images.length > 1 && renderImage(images[1], "relative w-full h-full")}
        {images.length > 2 && renderImage(images[2], "relative w-full h-full")}
        {images.length > 3 && renderImage(images[3], "relative w-full h-full")}
      </div>
    );
  }
  return renderImage(images[0], "absolute inset-0 z-0");
};

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  snapchat: Ghost,
  tiktok: MessageCircle,
  website: Globe
};

type LayoutStyle = 'breaking' | 'modern' | 'tv' | 'minimal' | 'trending' | 'quote' | 'split' | 'magazine';
type AspectRatio = '1:1' | '4:5';
type Tab = 'editor' | 'batch' | 'presets';
type Page = 'editor' | 'templates' | 'pricing' | 'about' | 'contact';

interface BatchItem {
  id: string;
  image: string;
  headline: string;
  subheadline: string;
  category: string;
}

interface BrandPreset {
  id: string;
  name: string;
  brandName: string;
  brandColor: string;
  logo: string | null;
  layoutStyle: LayoutStyle;
}

export interface ElementStyle {
  size: number;
  align: 'left' | 'center' | 'right' | 'justify';
  vPos: number;
  spacing: number;
}

const CATEGORIES = [
  "Breaking News", "Politics", "Business", "Technology", "World", 
  "Environment", "Sports", "Health", "Entertainment", "Science", 
  "Finance", "Culture", "Opinions", "Crime", "Weather", "Regional Update"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  // Main Editor State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [multiImageLayout, setMultiImageLayout] = useState<'single' | 'split-h' | 'split-v' | 'grid-3' | 'grid-4'>('single');
  const [headline, setHeadline] = useState('Global Markets Rally as Tech Stocks Surge to Record Highs');
  const [subheadline, setSubheadline] = useState('Investors show renewed confidence following positive economic data and strong earnings reports from major tech companies.');
  const [category, setCategory] = useState('BREAKING NEWS');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  // Element Styling State
  const [categoryStyle, setCategoryStyle] = useState<ElementStyle>({ size: 100, align: 'left', vPos: 0, spacing: 16 });
  const [headlineStyle, setHeadlineStyle] = useState<ElementStyle>({ size: 100, align: 'left', vPos: 0, spacing: 16 });
  const [subheadlineStyle, setSubheadlineStyle] = useState<ElementStyle>({ size: 100, align: 'left', vPos: 0, spacing: 16 });

  const [brandName, setBrandName] = useState('THE DAILY POST');
  const [brandColor, setBrandColor] = useState('#E60000');
  const [logo, setLogo] = useState<string | null>(null);
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>('breaking');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [showBadge, setShowBadge] = useState(false);
  
  // Image Adjustments (now per-image, but we'll keep these for backwards compatibility or remove them)
  // We'll manage zoom/pan on the active image instead.

  // Social Media
  const [caption, setCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Optional Metadata
  const [socialLinks, setSocialLinks] = useState<Array<{id: string, platform: string, handle: string, customIcon?: string}>>([]);
  const [sourceText, setSourceText] = useState('');
  const [newsContentScale, setNewsContentScale] = useState(100);
  const [socialBarScale, setSocialBarScale] = useState(100);

  // AI State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Batch State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [isExportingBatch, setIsExportingBatch] = useState(false);

  // Presets State
  const [presets, setPresets] = useState<BrandPreset[]>([]);
  const [presetName, setPresetName] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Navigation & Responsive State
  const [currentPage, setCurrentPage] = useState<Page>('editor');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scale, setScale] = useState(0.5);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingBatch, setIsDraggingBatch] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingPresetLogo, setIsDraggingPresetLogo] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const targetRatio = aspectRatio === '1:1' ? 1 : 1080/1350;
        const containerRatio = width / height;
        
        let newScale;
        if (containerRatio > targetRatio) {
          // Height is the constraint
          newScale = (height - 32) / (aspectRatio === '1:1' ? 1080 : 1350);
        } else {
          // Width is the constraint
          newScale = (width - 32) / 1080;
        }
        setScale(Math.min(1, Math.max(0.1, newScale)));
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [aspectRatio, currentPage]);

  useEffect(() => {
    const savedPresets = localStorage.getItem('newsBrandPresets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }
  }, []);

  const savePresetsToStorage = (newPresets: BrandPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem('newsBrandPresets', JSON.stringify(newPresets));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const newImage: ImageItem = {
              id: Math.random().toString(36).substr(2, 9),
              url: reader.result as string,
              zoom: 100,
              panX: 50,
              panY: 50
            };
            setImages(prev => {
              const updated = [...prev, newImage];
              if (updated.length === 1) setActiveImageId(newImage.id);
              return updated;
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBatchItems(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          image: reader.result as string,
          headline: 'Pending AI Generation...',
          subheadline: '',
          category: 'NEWS'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMainDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const newImage: ImageItem = {
              id: Math.random().toString(36).substr(2, 9),
              url: reader.result as string,
              zoom: 100,
              panX: 50,
              panY: 50
            };
            setImages(prev => {
              const updated = [...prev, newImage];
              if (updated.length === 1) setActiveImageId(newImage.id);
              return updated;
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handleBatchDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBatch(true);
  };

  const handleBatchDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBatch(false);
  };

  const handleBatchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBatch(false);
    const files = Array.from(e.dataTransfer.files || []) as File[];
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBatchItems(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          image: reader.result as string,
          headline: 'Pending AI Generation...',
          subheadline: '',
          category: 'NEWS'
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoDrop = (e: React.DragEvent, setter: React.Dispatch<React.SetStateAction<string | null>>, dragStateSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    e.preventDefault();
    dragStateSetter(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIGenerate = async () => {
    if (images.length === 0) return alert("Please upload an image first.");
    setIsGeneratingAI(true);
    try {
      const result = await generateNewsContent(images[0].url);
      if (result.headline) setHeadline(result.headline);
      if (result.subheadline) setSubheadline(result.subheadline);
      if (result.category) setCategory(result.category);
    } catch (e) {
      console.error(e);
      alert("Failed to generate AI content. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!headline) return alert("Please provide a headline first.");
    setIsGeneratingCaption(true);
    try {
      const result = await generateSocialCaption(headline, subheadline, category);
      setCaption(result || '');
    } catch (e) {
      console.error(e);
      alert("Failed to generate caption.");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleBatchAIGenerate = async () => {
    setIsGeneratingBatch(true);
    const updatedItems = [...batchItems];
    for (let i = 0; i < updatedItems.length; i++) {
      try {
        const result = await generateNewsContent(updatedItems[i].image);
        updatedItems[i].headline = result.headline || updatedItems[i].headline;
        updatedItems[i].subheadline = result.subheadline || updatedItems[i].subheadline;
        updatedItems[i].category = result.category || updatedItems[i].category;
        setBatchItems([...updatedItems]);
      } catch (e) {
        console.error("Failed batch item", i, e);
      }
    }
    setIsGeneratingBatch(false);
  };

  const exportImage = async (format: 'png' | 'jpeg', filenamePrefix = 'news-post') => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const width = aspectRatio === '1:1' ? 1080 : 1080;
      const height = aspectRatio === '1:1' ? 1080 : 1350;
      
      const options = {
        quality: format === 'png' ? 1 : 0.9,
        pixelRatio: 1,
        width,
        height,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`
        }
      };

      const dataUrl = format === 'png' 
        ? await toPng(canvasRef.current, options)
        : await toJpeg(canvasRef.current, options);
        
      const link = document.createElement('a');
      link.download = `${filenamePrefix}-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
      alert('Failed to export image.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportBatch = async () => {
    if (batchItems.length === 0) return;
    setIsExportingBatch(true);
    
    // Save current state to restore later
    const currentImages = images;
    const currentHeadline = headline;
    const currentSubheadline = subheadline;
    const currentCategory = category;

    for (const item of batchItems) {
      setImages([{ id: 'batch', url: item.image, zoom: 100, panX: 50, panY: 50 }]);
      setHeadline(item.headline);
      setSubheadline(item.subheadline);
      setCategory(item.category);
      // Wait for React to render the new state into the canvas
      await new Promise(resolve => setTimeout(resolve, 600));
      await exportImage('jpeg', `batch-${item.id}`);
    }

    // Restore state
    setImages(currentImages);
    setHeadline(currentHeadline);
    setSubheadline(currentSubheadline);
    setCategory(currentCategory);
    setIsExportingBatch(false);
  };

  const savePreset = () => {
    if (!presetName.trim()) return alert("Please enter a preset name.");
    const newPreset: BrandPreset = {
      id: Math.random().toString(36).substr(2, 9),
      name: presetName,
      brandName,
      brandColor,
      logo,
      layoutStyle
    };
    savePresetsToStorage([...presets, newPreset]);
    setPresetName('');
  };

  const loadPreset = (preset: BrandPreset) => {
    setBrandName(preset.brandName);
    setBrandColor(preset.brandColor);
    setLogo(preset.logo);
    setLayoutStyle(preset.layoutStyle);
  };

  const deletePreset = (id: string) => {
    savePresetsToStorage(presets.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('editor')}>
              <Layout className="w-6 h-6 text-indigo-600" />
              <span className="text-xl font-bold text-neutral-900">AI News Creator</span>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => setCurrentPage('editor')} className={cn("text-sm font-medium transition-colors", currentPage === 'editor' ? "text-indigo-600" : "text-neutral-600 hover:text-neutral-900")}>Editor</button>
              <button onClick={() => setCurrentPage('templates')} className={cn("text-sm font-medium transition-colors", currentPage === 'templates' ? "text-indigo-600" : "text-neutral-600 hover:text-neutral-900")}>Templates</button>
              <button onClick={() => setCurrentPage('pricing')} className={cn("text-sm font-medium transition-colors", currentPage === 'pricing' ? "text-indigo-600" : "text-neutral-600 hover:text-neutral-900")}>Pricing</button>
              <button onClick={() => setCurrentPage('about')} className={cn("text-sm font-medium transition-colors", currentPage === 'about' ? "text-indigo-600" : "text-neutral-600 hover:text-neutral-900")}>About</button>
              <button onClick={() => setCurrentPage('contact')} className={cn("text-sm font-medium transition-colors", currentPage === 'contact' ? "text-indigo-600" : "text-neutral-600 hover:text-neutral-900")}>Contact</button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {['editor', 'templates', 'pricing', 'about', 'contact'].map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page as Page);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "block w-full text-left px-3 py-2 rounded-md text-base font-medium capitalize",
                    currentPage === page ? "bg-indigo-50 text-indigo-600" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {currentPage === 'editor' && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
            {/* Left Sidebar - Inputs */}
            <div className="w-full lg:w-[400px] shrink-0 bg-white border-t lg:border-t-0 lg:border-r border-neutral-200 flex flex-col h-[60vh] lg:h-[calc(100vh-64px)] order-2 lg:order-1">
              <div className="p-4 border-b border-neutral-200 bg-neutral-50 hidden lg:block">
                <h1 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Layout className="w-5 h-5 text-indigo-600" />
                  AI News Creator
                </h1>
                <div className="flex bg-neutral-200/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('editor')}
                    className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", activeTab === 'editor' ? "bg-white shadow-sm text-indigo-700" : "text-neutral-600 hover:text-neutral-900")}
                  >
                    Editor
                  </button>
                  <button 
                    onClick={() => setActiveTab('batch')}
                    className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", activeTab === 'batch' ? "bg-white shadow-sm text-indigo-700" : "text-neutral-600 hover:text-neutral-900")}
                  >
                    Batch
                  </button>
                  <button 
                    onClick={() => setActiveTab('presets')}
                    className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", activeTab === 'presets' ? "bg-white shadow-sm text-indigo-700" : "text-neutral-600 hover:text-neutral-900")}
                  >
                    Presets
                  </button>
                </div>
              </div>
              <div className="p-4 border-b border-neutral-200 bg-neutral-50 lg:hidden">
                <div className="flex bg-neutral-200/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('editor')}
                    className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", activeTab === 'editor' ? "bg-white shadow-sm text-indigo-700" : "text-neutral-600 hover:text-neutral-900")}
                  >
                    Editor
                  </button>
                  <button 
                    onClick={() => setActiveTab('batch')}
                    className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", activeTab === 'batch' ? "bg-white shadow-sm text-indigo-700" : "text-neutral-600 hover:text-neutral-900")}
                  >
                    Batch
                  </button>
                  <button 
                    onClick={() => setActiveTab('presets')}
                    className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", activeTab === 'presets' ? "bg-white shadow-sm text-indigo-700" : "text-neutral-600 hover:text-neutral-900")}
                  >
                    Presets
                  </button>
                </div>
              </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {activeTab === 'editor' && (
            <>
              {/* Image Upload & Adjustments */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700">Background Images</label>
                <label 
                  className={cn(
                    "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer relative group overflow-hidden",
                    isDragging ? "border-indigo-500 bg-indigo-50" : "border-neutral-300 hover:border-indigo-500"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleMainDrop}
                >
                  <input 
                    type="file" 
                    multiple
                    className="sr-only" 
                    accept="image/*" 
                    onChange={handleMainImageUpload} 
                    onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                  />
                  <div className="space-y-1 text-center relative z-10">
                    <ImageIcon className={cn("mx-auto h-10 w-10 transition-colors", isDragging ? "text-indigo-500" : "text-neutral-400 group-hover:text-indigo-500")} />
                    <div className="flex text-sm text-neutral-600 justify-center">
                      <span className="relative font-medium text-indigo-600 group-hover:text-indigo-500">
                        {isDragging ? "Drop images here" : "Upload files or drag and drop"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">PNG, JPG up to 10MB</p>
                  </div>
                </label>

                {images.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-neutral-100">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <div 
                          key={img.id} 
                          className={cn(
                            "relative w-16 h-16 rounded-md overflow-hidden shrink-0 cursor-pointer border-2 transition-colors",
                            activeImageId === img.id ? "border-indigo-500" : "border-transparent hover:border-indigo-300"
                          )}
                          onClick={() => setActiveImageId(img.id)}
                        >
                          <img src={img.url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setImages(prev => {
                                const newImages = prev.filter(i => i.id !== img.id);
                                if (activeImageId === img.id) {
                                  setActiveImageId(newImages.length > 0 ? newImages[0].id : null);
                                }
                                return newImages;
                              });
                            }}
                            className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white p-0.5 rounded-full"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {images.length > 1 && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-neutral-600">Image Layout</label>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { id: 'single', label: 'Single' },
                            { id: 'split-h', label: 'Split H' },
                            { id: 'split-v', label: 'Split V' },
                            { id: 'grid-3', label: 'Grid 3' },
                            { id: 'grid-4', label: 'Grid 4' },
                          ].map(layout => (
                            <button
                              key={layout.id}
                              onClick={() => setMultiImageLayout(layout.id as any)}
                              className={cn(
                                "py-1.5 text-xs font-medium rounded border transition-colors",
                                multiImageLayout === layout.id ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                              )}
                            >
                              {layout.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeImageId && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-neutral-600">Adjust Selected Image</label>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setImages(prev => {
                                  const idx = prev.findIndex(i => i.id === activeImageId);
                                  if (idx <= 0) return prev;
                                  const newImages = [...prev];
                                  [newImages[idx - 1], newImages[idx]] = [newImages[idx], newImages[idx - 1]];
                                  return newImages;
                                });
                              }}
                              className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-indigo-600"
                              title="Move Left"
                            >
                              <ArrowRight className="w-3 h-3 rotate-180" />
                            </button>
                            <button 
                              onClick={() => {
                                setImages(prev => {
                                  const idx = prev.findIndex(i => i.id === activeImageId);
                                  if (idx === -1 || idx === prev.length - 1) return prev;
                                  const newImages = [...prev];
                                  [newImages[idx], newImages[idx + 1]] = [newImages[idx + 1], newImages[idx]];
                                  return newImages;
                                });
                              }}
                              className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-indigo-600"
                              title="Move Right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ZoomIn className="w-4 h-4 text-neutral-500" />
                          <input 
                            type="range" min="100" max="300" 
                            value={images.find(i => i.id === activeImageId)?.zoom || 100} 
                            onChange={(e) => setImages(prev => prev.map(img => img.id === activeImageId ? { ...img, zoom: Number(e.target.value) } : img))} 
                            className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer" 
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <MoveHorizontal className="w-4 h-4 text-neutral-500" />
                          <input 
                            type="range" min="0" max="100" 
                            value={images.find(i => i.id === activeImageId)?.panX || 50} 
                            onChange={(e) => setImages(prev => prev.map(img => img.id === activeImageId ? { ...img, panX: Number(e.target.value) } : img))} 
                            className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer" 
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <MoveVertical className="w-4 h-4 text-neutral-500" />
                          <input 
                            type="range" min="0" max="100" 
                            value={images.find(i => i.id === activeImageId)?.panY || 50} 
                            onChange={(e) => setImages(prev => prev.map(img => img.id === activeImageId ? { ...img, panY: Number(e.target.value) } : img))} 
                            className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Text Inputs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-neutral-700">News Content</label>
                  <button 
                    onClick={handleAIGenerate}
                    disabled={isGeneratingAI || images.length === 0}
                    className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    {isGeneratingAI ? 'Generating...' : 'AI Auto-Fill'}
                  </button>
                </div>

                <div>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <Select
                        options={[
                          ...CATEGORIES.map(cat => ({ value: cat, label: cat })),
                          { value: 'other', label: 'Other (Custom)' }
                        ]}
                        value={isCustomCategory ? { value: 'other', label: 'Other (Custom)' } : { value: category, label: category || 'Select Category...' }}
                        onChange={(selected: any) => {
                          if (selected.value === 'other') {
                            setIsCustomCategory(true);
                            setCategory('');
                          } else {
                            setIsCustomCategory(false);
                            setCategory(selected.value);
                          }
                        }}
                        className="text-sm"
                        placeholder="Search or select category..."
                      />
                    </div>
                  </div>
                  {isCustomCategory && (
                    <input 
                      type="text" 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full mb-2 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Enter custom category..."
                    />
                  )}
                  <StyleControls label="Category" style={categoryStyle} onChange={setCategoryStyle} />
                </div>
                
                <div>
                  <textarea 
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="Enter main headline..."
                  />
                  <StyleControls label="Headline" style={headlineStyle} onChange={setHeadlineStyle} />
                </div>
                
                <div>
                  <RichTextEditor 
                    content={subheadline}
                    onChange={setSubheadline}
                    placeholder="Enter supporting text..."
                  />
                  <StyleControls label="Supporting Text" style={subheadlineStyle} onChange={setSubheadlineStyle} />
                </div>
              </div>

              {/* Optional Metadata */}
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900">Optional Metadata</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Source (Italic)</label>
                    <input 
                      type="text" 
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. Reuters, AP News..."
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-neutral-700">Social Handles</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const newLinks = Object.keys(SOCIAL_ICONS).map(platform => ({
                              id: Math.random().toString(36).substr(2, 9),
                              platform,
                              handle: ''
                            }));
                            setSocialLinks(newLinks);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          + Add All
                        </button>
                        <button 
                          onClick={() => setSocialLinks([...socialLinks, { id: Math.random().toString(36).substr(2, 9), platform: 'twitter', handle: '' }])}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          + Add Handle
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {socialLinks.map((link, index) => (
                        <div key={link.id} className="flex gap-2 items-center bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                          <div className="flex items-center gap-1 border-r border-neutral-200 pr-2 mr-1">
                            <label className="cursor-pointer p-1.5 text-neutral-400 hover:text-indigo-600 transition-colors rounded-md hover:bg-neutral-200" title="Upload Custom Icon">
                              {link.customIcon ? (
                                <img src={link.customIcon} alt="Custom" className="w-4 h-4 object-contain" />
                              ) : (
                                <ImageIcon className="w-4 h-4" />
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const newLinks = [...socialLinks];
                                      newLinks[index].customIcon = ev.target?.result as string;
                                      setSocialLinks(newLinks);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {link.customIcon && (
                              <button 
                                onClick={() => {
                                  const newLinks = [...socialLinks];
                                  newLinks[index].customIcon = undefined;
                                  setSocialLinks(newLinks);
                                }}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                title="Remove Custom Icon"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <select 
                            value={link.platform}
                            onChange={(e) => {
                              const newLinks = [...socialLinks];
                              newLinks[index].platform = e.target.value;
                              setSocialLinks(newLinks);
                            }}
                            className="px-2 py-1.5 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white w-28"
                          >
                            <option value="twitter">Twitter</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="youtube">YouTube</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="tiktok">TikTok</option>
                            <option value="snapchat">Snapchat</option>
                            <option value="website">Website</option>
                          </select>
                          <input 
                            type="text" 
                            value={link.handle}
                            onChange={(e) => {
                              const newLinks = [...socialLinks];
                              newLinks[index].handle = e.target.value;
                              setSocialLinks(newLinks);
                            }}
                            className="flex-1 px-2 py-1.5 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="@username"
                          />
                          <button 
                            onClick={() => setSocialLinks(socialLinks.filter(l => l.id !== link.id))}
                            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {socialLinks.length === 0 && (
                        <div className="text-xs text-neutral-500 italic py-2">No social handles added.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Settings (Editor Tab) */}
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900">Brand Settings</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Brand Name</label>
                    <input 
                      type="text" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Brand Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-9 w-9 rounded cursor-pointer border-0 p-0 shrink-0"
                      />
                      <input 
                        type="text" 
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase min-w-0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Brand Logo</label>
                  <div className="flex items-center gap-3">
                    {logo ? (
                      <div className="relative w-10 h-10 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden group">
                        <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => setLogo(null)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-neutral-100 border border-neutral-200 border-dashed flex items-center justify-center text-neutral-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <label 
                      className={cn(
                        "px-3 py-1.5 bg-white border rounded-lg text-xs font-medium cursor-pointer transition-colors",
                        isDraggingLogo ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingLogo(false); }}
                      onDrop={(e) => handleLogoDrop(e, setLogo, setIsDraggingLogo)}
                    >
                      {isDraggingLogo ? "Drop logo" : "Upload Logo"}
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, setLogo)} 
                        onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Social Media Caption */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-neutral-700 flex items-center gap-1">
                    <Facebook className="w-4 h-4 text-blue-600" /> Facebook Caption
                  </label>
                  <button 
                    onClick={handleGenerateCaption}
                    disabled={isGeneratingCaption || !headline}
                    className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    {isGeneratingCaption ? 'Writing...' : 'AI Generate'}
                  </button>
                </div>
                <textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none bg-neutral-50"
                  placeholder="Generate or write a caption for your social media post..."
                />
              </div>
            </>
          )}

          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4" /> Batch Creation
                </h3>
                <p className="text-xs text-indigo-700 mb-4">Upload multiple images to generate 10+ news posts quickly using AI.</p>
                <label 
                  className={cn(
                    "flex justify-center px-4 py-3 bg-white border border-dashed rounded-lg transition-colors cursor-pointer text-sm font-medium",
                    isDraggingBatch ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-indigo-200 hover:border-indigo-400 text-indigo-600"
                  )}
                  onDragOver={handleBatchDragOver}
                  onDragLeave={handleBatchDragLeave}
                  onDrop={handleBatchDrop}
                >
                  {isDraggingBatch ? "Drop images here" : "Select Multiple Images or Drag & Drop"}
                  <input type="file" multiple className="sr-only" accept="image/*" onChange={handleBatchUpload} />
                </label>
              </div>

              {batchItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={handleBatchAIGenerate}
                      disabled={isGeneratingBatch}
                      className="flex-1 bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Wand2 className="w-4 h-4" /> {isGeneratingBatch ? 'Generating...' : 'AI Generate All'}
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {batchItems.map((item, idx) => (
                      <div key={item.id} className="flex gap-3 bg-white p-2 rounded-lg border border-neutral-200 items-center">
                        <img src={item.image} alt="thumb" className="w-12 h-12 object-cover rounded" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate">{item.headline}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{item.category}</p>
                        </div>
                        <button onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))} className="p-1 text-neutral-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={exportBatch}
                    disabled={isExportingBatch}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> {isExportingBatch ? 'Exporting Batch...' : `Export All (${batchItems.length})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-6">
              {/* Brand Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Current Brand Settings
                </h3>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Brand Name</label>
                  <input 
                    type="text" 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Brand Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-9 w-9 rounded cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Logo (Optional)</label>
                  <div className="flex items-center gap-3">
                    {logo ? (
                      <div className="relative w-10 h-10 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden group">
                        <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => setLogo(null)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-neutral-100 border border-neutral-200 border-dashed flex items-center justify-center text-neutral-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <label 
                      className={cn(
                        "px-3 py-1.5 bg-white border rounded-lg text-xs font-medium cursor-pointer transition-colors",
                        isDraggingPresetLogo ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingPresetLogo(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDraggingPresetLogo(false); }}
                      onDrop={(e) => handleLogoDrop(e, setLogo, setIsDraggingPresetLogo)}
                    >
                      {isDraggingPresetLogo ? "Drop logo" : "Upload Logo"}
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, setLogo)} 
                        onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Preset
                </h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Preset Name"
                  />
                  <button 
                    onClick={savePreset}
                    className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
                  >
                    Save
                  </button>
                </div>

                {presets.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-neutral-500">Saved Presets</p>
                    {presets.map(preset => (
                      <div key={preset.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200 hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => loadPreset(preset)}>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.brandColor }} />
                          <span className="text-sm font-medium text-neutral-800">{preset.name}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }} className="text-neutral-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center - Canvas (Order 1 on mobile, 2 on desktop) */}
      <div className="w-full lg:flex-1 flex flex-col bg-neutral-100 relative overflow-hidden order-1 lg:order-2 h-[50vh] lg:h-[calc(100vh-64px)]">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-10 overflow-x-auto">
          <div className="flex items-center gap-4 lg:gap-6 min-w-max">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="text-xs lg:text-sm font-medium text-neutral-500">Ratio:</span>
              <div className="flex bg-neutral-100 p-1 rounded-lg">
                <button 
                  onClick={() => setAspectRatio('1:1')}
                  className={cn("px-2 lg:px-3 py-1 lg:py-1.5 text-xs font-medium rounded-md transition-all", aspectRatio === '1:1' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700")}
                >
                  1:1
                </button>
                <button 
                  onClick={() => setAspectRatio('4:5')}
                  className={cn("px-2 lg:px-3 py-1 lg:py-1.5 text-xs font-medium rounded-md transition-all", aspectRatio === '4:5' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700")}
                >
                  4:5
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-neutral-200" />

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showBadge} 
                onChange={(e) => setShowBadge(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
              />
              <span className="text-xs lg:text-sm font-medium text-neutral-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 lg:w-4 lg:h-4 text-red-500" /> Auto "LIVE"
              </span>
            </label>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3 ml-4 min-w-max">
            <button 
              onClick={() => exportImage('jpeg')}
              disabled={isExporting || isExportingBatch}
              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-xs lg:text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              JPG
            </button>
            <button 
              onClick={() => exportImage('png')}
              disabled={isExporting || isExportingBatch}
              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-indigo-600 text-white rounded-lg text-xs lg:text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3 h-3 lg:w-4 lg:h-4" />
              {isExporting ? 'Exporting...' : 'PNG'}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 overflow-hidden flex items-center justify-center p-4 lg:p-8">
          <div 
            className="bg-white shadow-2xl transition-all duration-300 ease-in-out flex items-center justify-center relative"
            style={{
              width: 1080 * scale,
              height: (aspectRatio === '1:1' ? 1080 : 1350) * scale,
            }}
          >
            {/* The actual exportable canvas */}
            <div 
              ref={canvasRef}
              className="w-full h-full relative overflow-hidden bg-neutral-900 flex flex-col"
              style={{
                width: 1080,
                height: aspectRatio === '1:1' ? 1080 : 1350,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              {/* Background Image with Adjustments */}
              {images.length > 0 ? (
                <CollageRenderer images={images} layout={multiImageLayout} activeImageId={activeImageId} />
              ) : (
                <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
                  <ImageIcon className="w-32 h-32 text-neutral-700" />
                </div>
              )}

              {/* Content Container */}
              <div className="absolute inset-0 flex flex-col z-10">
                {/* News Content Area */}
                <div className="flex-1 relative" style={{ transform: `scale(${newsContentScale/100})`, transformOrigin: 'center' }}>
                  {/* Layouts */}
                  {layoutStyle === 'breaking' && <BreakingNewsLayout headline={headline} subheadline={subheadline} category={category} brandName={brandName} brandColor={brandColor} logo={logo} categoryStyle={categoryStyle} headlineStyle={headlineStyle} subheadlineStyle={subheadlineStyle} />}
                  {layoutStyle === 'modern' && <ModernCardLayout headline={headline} subheadline={subheadline} category={category} brandName={brandName} brandColor={brandColor} logo={logo} categoryStyle={categoryStyle} headlineStyle={headlineStyle} subheadlineStyle={subheadlineStyle} />}
                  {layoutStyle === 'tv' && <TvBannerLayout headline={headline} subheadline={subheadline} category={category} brandName={brandName} brandColor={brandColor} logo={logo} categoryStyle={categoryStyle} headlineStyle={headlineStyle} subheadlineStyle={subheadlineStyle} />}
                  {layoutStyle === 'minimal' && <MinimalLayout headline={headline} subheadline={subheadline} category={category} brandName={brandName} brandColor={brandColor} logo={logo} categoryStyle={categoryStyle} headlineStyle={headlineStyle} subheadlineStyle={subheadlineStyle} />}
                  {layoutStyle === 'trending' && <TrendingLayout headline={headline} subheadline={subheadline} category={category} brandName={brandName} brandColor={brandColor} logo={logo} categoryStyle={categoryStyle} headlineStyle={headlineStyle} subheadlineStyle={subheadlineStyle} />}
                  {layoutStyle === 'quote' && <QuoteLayout headline={headline} subheadline={subheadline} category={category} brandName={brandName} brandColor={brandColor} logo={logo} categoryStyle={categoryStyle} headlineStyle={headlineStyle} subheadlineStyle={subheadlineStyle} />}
                  {layoutStyle === 'split' && <SplitLayout headline={headline} subheadline={subheadline} category={category} brandName={brandName} brandColor={brandColor} logo={logo} categoryStyle={categoryStyle} headlineStyle={headlineStyle} subheadlineStyle={subheadlineStyle} />}
                  {layoutStyle === 'magazine' && <MagazineLayout headline={headline} subheadline={subheadline} category={category} brandName={brandName} brandColor={brandColor} logo={logo} categoryStyle={categoryStyle} headlineStyle={headlineStyle} subheadlineStyle={subheadlineStyle} />}

                  {/* Auto Breaking Badge Overlay */}
                  {showBadge && (
                    <div className="absolute top-10 right-10 bg-red-600 text-white px-5 py-2 rounded-lg font-black tracking-widest uppercase flex items-center gap-3 shadow-2xl z-50 text-2xl border-2 border-white/20">
                      <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                      LIVE
                    </div>
                  )}
                </div>

                {/* Optional Metadata Bottom Bar */}
                {(socialLinks.length > 0 || sourceText) && (
                  <div 
                    className="shrink-0 bg-black/80 backdrop-blur-md flex justify-between items-center px-10 py-6 border-t border-white/10"
                    style={{ transform: `scale(${socialBarScale/100})`, transformOrigin: 'bottom center' }}
                  >
                    <div className="flex-1">
                      {sourceText && (
                        <span className="text-white/90 text-xl italic font-medium">
                          Source: {sourceText}
                        </span>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-8">
                      {socialLinks.filter(l => l.handle).map(link => (
                        <div key={link.id} className="flex items-center gap-3 text-white">
                          {link.customIcon ? (
                            <img src={link.customIcon} alt={link.platform} className="w-8 h-8 object-contain" />
                          ) : (
                            React.createElement(SOCIAL_ICONS[link.platform] || Twitter, { className: "w-8 h-8" })
                          )}
                          <span className="text-2xl font-medium tracking-wide">{link.handle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Templates (Order 3 on mobile, 3 on desktop) */}
      <div className="w-full lg:w-72 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-neutral-200 flex flex-col h-[40vh] lg:h-[calc(100vh-64px)] order-3 overflow-y-auto">
        <div className="p-4 lg:p-6 border-b border-neutral-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold">Templates</h2>
        </div>
        
        <div className="p-4 lg:p-6 space-y-4">
          <TemplateButton 
            title="Breaking News" 
            description="High impact, urgent style with red accents"
            active={layoutStyle === 'breaking'}
            onClick={() => setLayoutStyle('breaking')}
          />
          <TemplateButton 
            title="Trending News" 
            description="Vibrant, gradient-heavy card for viral stories"
            active={layoutStyle === 'trending'}
            onClick={() => setLayoutStyle('trending')}
          />
          <TemplateButton 
            title="Modern Card" 
            description="Clean, glassmorphism panel for social feeds"
            active={layoutStyle === 'modern'}
            onClick={() => setLayoutStyle('modern')}
          />
          <TemplateButton 
            title="TV Banner" 
            description="Classic broadcast news lower-third style"
            active={layoutStyle === 'tv'}
            onClick={() => setLayoutStyle('tv')}
          />
          <TemplateButton 
            title="Minimal" 
            description="Elegant, typography-focused layout"
            active={layoutStyle === 'minimal'}
            onClick={() => setLayoutStyle('minimal')}
          />
          <TemplateButton 
            title="Quote" 
            description="Large quote mark, italic text centered"
            active={layoutStyle === 'quote'}
            onClick={() => setLayoutStyle('quote')}
          />
          <TemplateButton 
            title="Split Screen" 
            description="Image on top, solid color with text below"
            active={layoutStyle === 'split'}
            onClick={() => setLayoutStyle('split')}
          />
          <TemplateButton 
            title="Magazine" 
            description="Massive headline, elegant serif styling"
            active={layoutStyle === 'magazine'}
            onClick={() => setLayoutStyle('magazine')}
          />
        </div>
      </div>
    </div>
  )}

  {currentPage === 'templates' && (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-neutral-900 mb-4">News Templates</h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">Choose from our collection of professionally designed templates to make your news stand out.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { id: 'breaking', name: 'Breaking News', desc: 'High impact, urgent style with red accents' },
          { id: 'trending', name: 'Trending News', desc: 'Vibrant, gradient-heavy card for viral stories' },
          { id: 'modern', name: 'Modern Card', desc: 'Clean, glassmorphism panel for social feeds' },
          { id: 'tv', name: 'TV Banner', desc: 'Classic broadcast news lower-third style' },
          { id: 'minimal', name: 'Minimal', desc: 'Elegant, typography-focused layout' },
          { id: 'quote', name: 'Quote', desc: 'Large quote mark, italic text centered' },
          { id: 'split', name: 'Split Screen', desc: 'Image on top, solid color with text below' },
          { id: 'magazine', name: 'Magazine', desc: 'Massive headline, elegant serif styling' },
        ].map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group" onClick={() => { setLayoutStyle(t.id as LayoutStyle); setCurrentPage('editor'); }}>
            <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center border-b border-neutral-200 group-hover:bg-indigo-50 transition-colors">
              <Layout className="w-12 h-12 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">{t.name}</h3>
              <p className="text-neutral-600">{t.desc}</p>
              <div className="mt-4 text-indigo-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Use Template <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {currentPage === 'pricing' && (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-neutral-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">Start creating professional news graphics today. No credit card required for the free plan.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {[
          { name: 'Starter', price: 'Free', desc: 'Perfect for trying out the editor.', features: ['3 basic templates', 'Standard export quality', 'Watermarked images'] },
          { name: 'Pro', price: '$12/mo', desc: 'Everything you need for daily publishing.', features: ['All premium templates', 'HD export quality', 'No watermarks', 'Custom branding', 'Batch processing'], popular: true },
          { name: 'Agency', price: '$49/mo', desc: 'For newsrooms and media agencies.', features: ['Everything in Pro', 'Unlimited team members', 'API access', 'Priority support', 'Custom templates'] },
        ].map(p => (
          <div key={p.name} className={cn("bg-white rounded-3xl border p-8 flex flex-col relative", p.popular ? "border-indigo-600 shadow-2xl scale-105 z-10" : "border-neutral-200 shadow-lg")}>
            {p.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase">Most Popular</div>}
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">{p.name}</h3>
            <div className="text-4xl font-black text-neutral-900 mb-4">{p.price}</div>
            <p className="text-neutral-600 mb-8">{p.desc}</p>
            <ul className="space-y-4 mb-8 flex-1">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span className="text-neutral-700">{f}</span>
                </li>
              ))}
            </ul>
            <button className={cn("w-full py-3 rounded-xl font-bold transition-colors", p.popular ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200")}>
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  )}

  {currentPage === 'about' && (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      <h1 className="text-4xl font-black text-neutral-900 mb-8">About AI News Creator</h1>
      <div className="prose prose-lg prose-indigo">
        <p className="text-xl text-neutral-600 leading-relaxed mb-6">
          AI News Creator was built with a simple mission: to empower journalists, content creators, and newsrooms to produce high-quality, engaging news graphics in seconds, not hours.
        </p>
        <p className="text-neutral-600 leading-relaxed mb-6">
          In today's fast-paced digital landscape, speed is just as important as accuracy. We realized that many creators were spending too much time wrestling with complex design tools just to get a breaking news update out to their audience.
        </p>
        <p className="text-neutral-600 leading-relaxed mb-6">
          By combining intuitive design templates with the power of AI, we've created a tool that handles the heavy lifting of layout and formatting, letting you focus on what matters most: the story.
        </p>
      </div>
    </div>
  )}

  {currentPage === 'contact' && (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-neutral-900 mb-4">Get in Touch</h1>
        <p className="text-xl text-neutral-600">Have a question or need support? We're here to help.</p>
      </div>
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-lg">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">First Name</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Last Name</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Message</label>
            <textarea rows={5} className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
          </div>
          <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Send Message
          </button>
        </form>
      </div>
    </div>
  )}
</main>

{/* Footer */}
<footer className="bg-neutral-900 text-white py-12 mt-auto">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
      <div className="col-span-1 md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold">AI News Creator</span>
        </div>
        <p className="text-neutral-400 max-w-sm leading-relaxed">
          The fastest way to create professional news graphics for social media. Powered by AI, designed for humans.
        </p>
      </div>
      <div>
        <h4 className="font-bold mb-4 uppercase tracking-wider text-sm text-neutral-300">Product</h4>
        <ul className="space-y-2">
          <li><button onClick={() => setCurrentPage('editor')} className="text-neutral-400 hover:text-white transition-colors">Editor</button></li>
          <li><button onClick={() => setCurrentPage('templates')} className="text-neutral-400 hover:text-white transition-colors">Templates</button></li>
          <li><button onClick={() => setCurrentPage('pricing')} className="text-neutral-400 hover:text-white transition-colors">Pricing</button></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4 uppercase tracking-wider text-sm text-neutral-300">Company</h4>
        <ul className="space-y-2">
          <li><button onClick={() => setCurrentPage('about')} className="text-neutral-400 hover:text-white transition-colors">About Us</button></li>
          <li><button onClick={() => setCurrentPage('contact')} className="text-neutral-400 hover:text-white transition-colors">Contact</button></li>
          <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-neutral-500 text-sm">
        © {new Date().getFullYear()} AI News Creator. All rights reserved.
      </p>
      <div className="flex gap-4">
        <a href="#" className="text-neutral-500 hover:text-white transition-colors">
          <span className="sr-only">Twitter</span>
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
          </svg>
        </a>
        <a href="#" className="text-neutral-500 hover:text-white transition-colors">
          <span className="sr-only">GitHub</span>
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</footer>
</div>
  );
}

function StyleControls({ label, style, onChange }: { label: string, style: ElementStyle, onChange: (s: ElementStyle) => void }) {
  return (
    <div className="space-y-3 mt-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-neutral-700">{label} Styling</span>
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Size ({style.size}%)</label>
        </div>
        <input 
          type="range" 
          min="50" max="200" 
          value={style.size}
          onChange={(e) => onChange({ ...style, size: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Vertical Position ({style.vPos}px)</label>
        </div>
        <input 
          type="range" 
          min="-100" max="100" 
          value={style.vPos}
          onChange={(e) => onChange({ ...style, vPos: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Spacing Below ({style.spacing}px)</label>
        </div>
        <input 
          type="range" 
          min="0" max="64" step="4"
          value={style.spacing}
          onChange={(e) => onChange({ ...style, spacing: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">Alignment</label>
        <div className="flex gap-1 bg-white p-1 rounded-md border border-neutral-200">
          {(['left', 'center', 'right', 'justify'] as const).map(align => (
            <button
              key={align}
              onClick={() => onChange({ ...style, align })}
              className={cn(
                "flex-1 py-1 text-xs rounded capitalize transition-colors",
                style.align === align ? "bg-indigo-100 text-indigo-700 font-medium" : "text-neutral-600 hover:bg-neutral-50"
              )}
            >
              {align === 'justify' ? 'Just' : align.charAt(0)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateButton({ title, description, active, onClick }: { title: string, description: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all",
        active ? "border-indigo-600 bg-indigo-50/50" : "border-neutral-200 hover:border-indigo-300 hover:bg-neutral-50"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className={cn("font-bold", active ? "text-indigo-900" : "text-neutral-900")}>{title}</h3>
        {active && <Check className="w-4 h-4 text-indigo-600" />}
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed">{description}</p>
    </button>
  );
}

// --- Layout Components ---

interface LayoutProps {
  headline: string;
  subheadline: string;
  category: string;
  brandName: string;
  brandColor: string;
  logo: string | null;
  categoryStyle: ElementStyle;
  headlineStyle: ElementStyle;
  subheadlineStyle: ElementStyle;
}

function BreakingNewsLayout({ headline, subheadline, category, brandName, brandColor, logo, categoryStyle, headlineStyle, subheadlineStyle }: LayoutProps) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
      <div className="absolute inset-0 flex flex-col justify-end p-12 pb-16">
        {category && (
          <div 
            className="flex" 
            style={{ 
              justifyContent: categoryStyle.align === 'center' ? 'center' : categoryStyle.align === 'right' ? 'flex-end' : 'flex-start',
              transform: `translateY(${categoryStyle.vPos}px)`,
              marginBottom: `${categoryStyle.spacing}px`
            }}
          >
            <div className="px-6 py-2 text-white font-bold text-2xl tracking-wider uppercase" style={{ backgroundColor: brandColor, fontSize: `${categoryStyle.size}%` }}>
              {category}
            </div>
          </div>
        )}
        {headline && (
          <h1 
            className="text-white font-black leading-[1.1] tracking-tight drop-shadow-lg" 
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: `${72 * (headlineStyle.size / 100)}px`,
              textAlign: headlineStyle.align,
              transform: `translateY(${headlineStyle.vPos}px)`,
              marginBottom: `${headlineStyle.spacing}px`
            }}
          >
            {headline}
          </h1>
        )}
        {subheadline && (
          <div 
            className="text-neutral-200 leading-snug font-medium max-w-4xl border-l-4 pl-6 rich-text-content" 
            style={{ 
              borderColor: brandColor,
              fontSize: `${30 * (subheadlineStyle.size / 100)}px`,
              textAlign: subheadlineStyle.align,
              transform: `translateY(${subheadlineStyle.vPos}px)`,
              marginBottom: `${subheadlineStyle.spacing}px`
            }}
            dangerouslySetInnerHTML={{ __html: subheadline }}
          />
        )}
      </div>
      <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start">
        {logo ? (
          <img src={logo} alt="Logo" className="h-16 object-contain drop-shadow-md" referrerPolicy="no-referrer" />
        ) : brandName ? (
          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-lg shadow-lg">
            <span className="font-black text-2xl tracking-widest uppercase text-black">{brandName}</span>
          </div>
        ) : <div />}
      </div>
    </>
  );
}

function TrendingLayout({ headline, subheadline, category, brandName, brandColor, logo, categoryStyle, headlineStyle, subheadlineStyle }: LayoutProps) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-12 flex flex-col">
        <div 
          className="flex items-center gap-4"
          style={{ 
            justifyContent: categoryStyle.align === 'center' ? 'center' : categoryStyle.align === 'right' ? 'flex-end' : 'flex-start',
            transform: `translateY(${categoryStyle.vPos}px)`,
            marginBottom: `${categoryStyle.spacing}px`
          }}
        >
          <div className="p-3 rounded-full bg-white/10 backdrop-blur-md">
            <Flame className="w-8 h-8" style={{ color: brandColor }} />
          </div>
          {category && (
            <span className="text-white font-black tracking-widest uppercase" style={{ color: brandColor, fontSize: `${30 * (categoryStyle.size / 100)}px` }}>
              {category}
            </span>
          )}
        </div>
        {headline && (
          <h1 
            className="text-white font-black leading-tight drop-shadow-2xl"
            style={{ 
              fontSize: `${72 * (headlineStyle.size / 100)}px`,
              textAlign: headlineStyle.align,
              transform: `translateY(${headlineStyle.vPos}px)`,
              marginBottom: `${headlineStyle.spacing}px`
            }}
          >
            {headline}
          </h1>
        )}
        {subheadline && (
          <div 
            className="text-neutral-300 font-medium max-w-4xl leading-relaxed rich-text-content"
            style={{ 
              fontSize: `${30 * (subheadlineStyle.size / 100)}px`,
              textAlign: subheadlineStyle.align,
              transform: `translateY(${subheadlineStyle.vPos}px)`,
              marginBottom: `${subheadlineStyle.spacing}px`
            }}
            dangerouslySetInnerHTML={{ __html: subheadline }}
          />
        )}
      </div>
      <div className="absolute top-10 left-10 flex items-center gap-4">
        {logo && <img src={logo} alt="Logo" className="h-12 object-contain" referrerPolicy="no-referrer" />}
        {brandName && !logo && <span className="font-bold text-2xl tracking-wider text-white uppercase drop-shadow-md">{brandName}</span>}
      </div>
    </>
  );
}

function ModernCardLayout({ headline, subheadline, category, brandName, brandColor, logo, categoryStyle, headlineStyle, subheadlineStyle }: LayoutProps) {
  return (
    <>
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex flex-col justify-end p-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20">
          <div 
            className="flex items-center gap-4" 
            style={{ 
              justifyContent: categoryStyle.align === 'center' ? 'center' : categoryStyle.align === 'right' ? 'flex-end' : 'flex-start',
              transform: `translateY(${categoryStyle.vPos}px)`,
              marginBottom: `${categoryStyle.spacing}px`
            }}
          >
            {logo && <img src={logo} alt="Logo" className="h-10 object-contain" referrerPolicy="no-referrer" />}
            {brandName && !logo && <span className="font-bold text-xl tracking-wider text-neutral-800 uppercase">{brandName}</span>}
            {(logo || brandName) && category && <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />}
            {category && (
              <span className="font-bold tracking-widest uppercase" style={{ color: brandColor, fontSize: `${20 * (categoryStyle.size / 100)}px` }}>
                {category}
              </span>
            )}
          </div>
          {headline && (
            <h1 
              className="text-neutral-900 font-black leading-[1.15] tracking-tight" 
              style={{ 
                fontSize: `${60 * (headlineStyle.size / 100)}px`,
                textAlign: headlineStyle.align,
                transform: `translateY(${headlineStyle.vPos}px)`,
                marginBottom: `${headlineStyle.spacing}px`
              }}
            >
              {headline}
            </h1>
          )}
          {subheadline && (
            <div 
              className="text-neutral-600 leading-relaxed font-medium rich-text-content" 
              style={{ 
                fontSize: `${30 * (subheadlineStyle.size / 100)}px`,
                textAlign: subheadlineStyle.align,
                transform: `translateY(${subheadlineStyle.vPos}px)`,
                marginBottom: `${subheadlineStyle.spacing}px`
              }}
              dangerouslySetInnerHTML={{ __html: subheadline }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function TvBannerLayout({ headline, subheadline, category, brandName, brandColor, logo, categoryStyle, headlineStyle, subheadlineStyle }: LayoutProps) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-12 left-12 right-12 flex flex-col shadow-2xl">
        {category && (
          <div 
            className="flex"
            style={{ 
              justifyContent: categoryStyle.align === 'center' ? 'center' : categoryStyle.align === 'right' ? 'flex-end' : 'flex-start',
              transform: `translateY(${categoryStyle.vPos}px)`,
              marginBottom: `${categoryStyle.spacing}px`
            }}
          >
            <div className="px-8 py-3 text-white font-black tracking-widest uppercase flex items-center gap-3" style={{ backgroundColor: brandColor, fontSize: `${24 * (categoryStyle.size / 100)}px` }}>
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              {category}
            </div>
          </div>
        )}
        <div className="bg-white flex">
          {(logo || brandName) && (
            <div className="w-48 bg-neutral-100 flex items-center justify-center p-6 border-r border-neutral-200 shrink-0">
              {logo ? <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" /> : <span className="font-black text-xl text-center uppercase leading-tight text-neutral-800">{brandName}</span>}
            </div>
          )}
          <div className="p-8 flex-1 flex flex-col justify-center">
            {headline && (
              <h1 
                className="text-neutral-900 font-black leading-tight tracking-tight uppercase"
                style={{ 
                  fontSize: `${48 * (headlineStyle.size / 100)}px`,
                  textAlign: headlineStyle.align,
                  transform: `translateY(${headlineStyle.vPos}px)`,
                  marginBottom: `${headlineStyle.spacing}px`
                }}
              >
                {headline}
              </h1>
            )}
          </div>
        </div>
        {subheadline && (
          <div 
            className="bg-neutral-900 text-white px-8 py-4 flex items-center gap-6 overflow-hidden"
            style={{ 
              transform: `translateY(${subheadlineStyle.vPos}px)`,
              marginTop: `${subheadlineStyle.spacing}px`
            }}
          >
            <span className="font-bold text-xl tracking-wider text-neutral-400 shrink-0">UPDATE</span>
            <div 
              className="font-medium whitespace-nowrap truncate rich-text-content"
              style={{ 
                fontSize: `${24 * (subheadlineStyle.size / 100)}px`,
                textAlign: subheadlineStyle.align,
                width: '100%'
              }}
              dangerouslySetInnerHTML={{ __html: subheadline }}
            />
          </div>
        )}
      </div>
    </>
  );
}

function MinimalLayout({ headline, subheadline, category, brandName, brandColor, logo, categoryStyle, headlineStyle, subheadlineStyle }: LayoutProps) {
  return (
    <>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-12 border-2 border-white/30 flex flex-col p-12">
        <div className="flex justify-between items-start">
          {category && (
            <div 
              className="flex"
              style={{ 
                justifyContent: categoryStyle.align === 'center' ? 'center' : categoryStyle.align === 'right' ? 'flex-end' : 'flex-start',
                transform: `translateY(${categoryStyle.vPos}px)`,
                marginBottom: `${categoryStyle.spacing}px`
              }}
            >
              <span className="font-bold tracking-widest uppercase text-white border border-white/50 px-4 py-1.5 rounded-full backdrop-blur-sm" style={{ fontSize: `${20 * (categoryStyle.size / 100)}px` }}>
                {category}
              </span>
            </div>
          )}
          {(logo || brandName) && (
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full">
              {logo && <img src={logo} alt="Logo" className="h-6 object-contain" referrerPolicy="no-referrer" />}
              {brandName && !logo && <span className="font-bold text-lg tracking-wider text-white uppercase">{brandName}</span>}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto mt-12 w-full">
          {headline && (
            <h1 
              className="text-white font-bold leading-[1.15] tracking-tight drop-shadow-2xl w-full" 
              style={{ 
                fontFamily: 'Georgia, serif',
                fontSize: `${72 * (headlineStyle.size / 100)}px`,
                textAlign: headlineStyle.align,
                transform: `translateY(${headlineStyle.vPos}px)`,
                marginBottom: `${headlineStyle.spacing}px`
              }}
            >
              {headline}
            </h1>
          )}
          {subheadline && (
            <div 
              className="relative w-full"
              style={{ 
                transform: `translateY(${subheadlineStyle.vPos}px)`,
                marginTop: `${subheadlineStyle.spacing}px`
              }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full" style={{ backgroundColor: brandColor }} />
              <div 
                className="text-neutral-200 leading-relaxed font-medium drop-shadow-lg w-full rich-text-content" 
                style={{ 
                  fontFamily: 'Georgia, serif',
                  fontSize: `${30 * (subheadlineStyle.size / 100)}px`,
                  textAlign: subheadlineStyle.align
                }}
                dangerouslySetInnerHTML={{ __html: subheadline }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function QuoteLayout({ headline, subheadline, category, brandName, brandColor, logo, categoryStyle, headlineStyle, subheadlineStyle }: LayoutProps) {
  return (
    <>
      <div className="absolute inset-0 flex flex-col justify-center p-16" style={{ backgroundColor: brandColor }}>
        <div className="text-white/20 text-[200px] font-serif leading-none absolute top-8 left-12">"</div>
        <h1 
          className="font-serif italic text-white leading-relaxed z-10 relative px-12 w-full"
          style={{ 
            fontSize: `${48 * (headlineStyle.size / 100)}px`,
            textAlign: headlineStyle.align,
            transform: `translateY(${headlineStyle.vPos}px)`,
            marginBottom: `${headlineStyle.spacing}px`
          }}
        >
          {headline}
        </h1>
        <div 
          className="mt-16 z-10 w-full"
          style={{ 
            transform: `translateY(${subheadlineStyle.vPos}px)`,
            marginTop: `${subheadlineStyle.spacing}px`
          }}
        >
          <div className="w-16 h-1 bg-white/50 mx-auto mb-6"></div>
          <div 
            className="font-medium text-white tracking-widest uppercase w-full rich-text-content"
            style={{ 
              fontSize: `${24 * (subheadlineStyle.size / 100)}px`,
              textAlign: subheadlineStyle.align
            }}
            dangerouslySetInnerHTML={{ __html: subheadline }}
          />
          <p 
            className="text-white/80 mt-2 w-full"
            style={{ 
              fontSize: `${18 * (categoryStyle.size / 100)}px`,
              textAlign: categoryStyle.align,
              transform: `translateY(${categoryStyle.vPos}px)`,
              marginTop: `${categoryStyle.spacing}px`
            }}
          >
            {category}
          </p>
        </div>
        
        <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-4">
          {logo ? (
            <img src={logo} alt="Logo" className="h-8 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
          ) : (
            <span className="font-bold text-white/80 tracking-widest uppercase text-sm">{brandName}</span>
          )}
        </div>
      </div>
    </>
  );
}

function SplitLayout({ headline, subheadline, category, brandName, brandColor, logo, categoryStyle, headlineStyle, subheadlineStyle }: LayoutProps) {
  return (
    <>
      <div className="absolute inset-0 flex flex-col bg-white">
        <div className="h-1/2 relative overflow-hidden bg-transparent">
          {/* Image is handled by the parent container, so we just leave this transparent */}
        </div>
        <div className="h-1/2 p-12 flex flex-col justify-center relative bg-white" style={{ borderTop: `8px solid ${brandColor}` }}>
          <div className="absolute top-8 right-12 flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="font-bold text-neutral-900 tracking-widest uppercase text-sm">{brandName}</span>
            )}
          </div>
          <span 
            className="font-bold tracking-widest uppercase w-full" 
            style={{ 
              color: brandColor,
              fontSize: `${20 * (categoryStyle.size / 100)}px`,
              textAlign: categoryStyle.align,
              transform: `translateY(${categoryStyle.vPos}px)`,
              marginBottom: `${categoryStyle.spacing}px`
            }}
          >
            {category}
          </span>
          <h1 
            className="font-black text-neutral-900 leading-tight w-full"
            style={{ 
              fontSize: `${48 * (headlineStyle.size / 100)}px`,
              textAlign: headlineStyle.align,
              transform: `translateY(${headlineStyle.vPos}px)`,
              marginBottom: `${headlineStyle.spacing}px`
            }}
          >
            {headline}
          </h1>
          <div 
            className="text-neutral-600 leading-relaxed max-w-3xl w-full rich-text-content"
            style={{ 
              fontSize: `${20 * (subheadlineStyle.size / 100)}px`,
              textAlign: subheadlineStyle.align,
              transform: `translateY(${subheadlineStyle.vPos}px)`,
              marginBottom: `${subheadlineStyle.spacing}px`
            }}
            dangerouslySetInnerHTML={{ __html: subheadline }}
          />
        </div>
      </div>
    </>
  );
}

function MagazineLayout({ headline, subheadline, category, brandName, brandColor, logo, categoryStyle, headlineStyle, subheadlineStyle }: LayoutProps) {
  return (
    <>
      <div className="absolute inset-0 bg-white p-8">
        <div className="w-full h-full border-4 p-10 flex flex-col relative" style={{ borderColor: brandColor }}>
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-0" />
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-12">
              <span 
                className="font-bold uppercase tracking-widest" 
                style={{ 
                  color: brandColor,
                  fontSize: `${24 * (categoryStyle.size / 100)}px`,
                  textAlign: categoryStyle.align,
                  transform: `translateY(${categoryStyle.vPos}px)`,
                  marginBottom: `${categoryStyle.spacing}px`
                }}
              >
                {category}
              </span>
              <div className="flex items-center gap-3">
                {logo ? (
                  <img src={logo} alt="Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xl font-medium text-neutral-500 uppercase tracking-widest">{brandName}</span>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h1 
                className="font-serif font-black text-neutral-900 leading-[1.1] uppercase"
                style={{ 
                  fontSize: `${70 * (headlineStyle.size / 100)}px`,
                  textAlign: headlineStyle.align,
                  transform: `translateY(${headlineStyle.vPos}px)`,
                  marginBottom: `${headlineStyle.spacing}px`
                }}
              >
                {headline}
              </h1>
              <div className="w-24 h-2 mb-8" style={{ backgroundColor: brandColor }}></div>
              <div 
                className="font-serif text-neutral-700 leading-relaxed max-w-3xl rich-text-content"
                style={{ 
                  fontSize: `${30 * (subheadlineStyle.size / 100)}px`,
                  textAlign: subheadlineStyle.align,
                  transform: `translateY(${subheadlineStyle.vPos}px)`,
                  marginBottom: `${subheadlineStyle.spacing}px`
                }}
                dangerouslySetInnerHTML={{ __html: subheadline }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}