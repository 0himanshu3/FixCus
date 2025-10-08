import React, { useState, useRef } from "react";
import LocationPicker from "../components/LocationPicker";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SpeechToText from "../components/SpeechToText"; 

export default function CreateIssue() {
  const [mode, setMode] = useState('ai'); 
  const [formData, setFormData] = useState({ title: "", content: "", category: "", images: [] });
  const [imageFiles, setImageFiles] = useState([]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState(null);
  const navigate = useNavigate();
  const textAreaRef = useRef(null);

  const categories = [
    "Road damage", "Waterlogging / Drainage Issues", "Improper Waste Management",
    "Street lights/Exposed Wires", "Unauthorized loudspeakers", "Burning of garbage",
    "Encroachment / Illegal Construction", "Damaged Public Property", "Stray Animal Menace", "General Issue"
  ];

  const uploadFiles = async (filesArray) => {
    if (!filesArray || filesArray.length === 0) return [];
    const storage = getStorage(app);
    const urls = [];
    await Promise.all(
      filesArray.map((file) => {
        const fileRef = ref(storage, `${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);
        return new Promise((resolve, reject) => {
          uploadTask.on("state_changed", null, 
            (err) => reject(err),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              urls.push(url);
              resolve();
            }
          );
        });
      })
    );
    return urls;
  };

  const handleAIGenerate = async () => {
    if (imageFiles.length === 0 || !location) {
      toast.error("Please select at least one image and set a location.");
      return;
    }
    setIsGenerating(true);
    setAiGeneratedData(null);
    setError("");
    try {
      const imageUrls = await uploadFiles([imageFiles[0]]);
      if (imageUrls.length === 0) throw new Error("Image could not be uploaded.");

      const res = await fetch("http://localhost:3000/api/v1/issues/generate-from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrls[0] }),
      });
      
      const result = await res.json();
      if (result.success) {
        setAiGeneratedData(result.data);
        toast.success("AI has generated a draft for your issue!");
      } else {
        throw new Error(result.message || "AI failed to generate details.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAI = () => {
    const finalFormData = {
        title: aiGeneratedData.title,
        content: aiGeneratedData.description,
        category: aiGeneratedData.category,
        images: imageFiles, // Pass the files to be uploaded
    };
    setFormData(finalFormData);
    setTimeout(() => handleSubmit(null, finalFormData), 0);
  };
  
  const handleEditManually = () => {
    setFormData({
        title: aiGeneratedData.title,
        content: aiGeneratedData.description,
        category: aiGeneratedData.category,
        images: [], // Reset as we haven't uploaded yet in manual mode
    });
    setAiGeneratedData(null);
    setMode('manual');
  };

  const handleSubmit = async (e, directData = null) => {
    if (e) e.preventDefault();
    
    const dataToSubmit = directData || formData;

    if (!dataToSubmit.title || !dataToSubmit.content || !dataToSubmit.category || !location) {
      setError("Please fill all required fields.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      // Upload all selected images to get their URLs
      const imageUrls = await uploadFiles(imageFiles);

      const res = await fetch("http://localhost:3000/api/v1/issues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...dataToSubmit,
          images: imageUrls,
          issueLocation: `${location.lat},${location.lng}`,
          issueDistrict: location?.district || "",
          issueState: location?.state || "",
          issueCountry: location?.country || "",
          issuePublishDate: new Date()
        })
      });

      if (res.ok) {
        toast.success("Issue created successfully!");
        navigate("/");
      } else {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create issue.");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };
  
  const handleFileChange = (e) => {
    setImageFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create a New Issue</h1>
            <p className="text-gray-500 mt-1">Choose your preferred method to report an issue.</p>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex justify-center gap-2 p-1 bg-gray-200 rounded-lg mb-8">
            <button onClick={() => setMode('ai')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-all ${mode === 'ai' ? 'bg-purple-600 text-white shadow' : 'text-gray-600'}`}>✨ AI Generate</button>
            <button onClick={() => setMode('manual')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-purple-600 text-white shadow' : 'text-gray-600'}`}>✍️ Manual Entry</button>
          </div>

          {/* AI Generation Mode */}
          {mode === 'ai' && (
            <div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">1. Upload Images of the Issue</label>
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <input type="file" multiple accept="image/*" className="hidden" id="ai-file-input" onChange={handleFileChange} />
                    <label htmlFor="ai-file-input" className="cursor-pointer text-purple-600 font-semibold">Click to select images</label>
                  </div>
                  {imageFiles.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md border" />
                          <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">2. Pin the Location</label>
                  <LocationPicker location={location} setLocation={setLocation} />
                </div>
              </div>
              
              <div className="mt-8 text-center">
                  <button onClick={handleAIGenerate} disabled={isGenerating || isSubmitting} className="w-full max-w-xs px-6 py-3 rounded-lg bg-pink-600 text-white font-bold hover:bg-pink-700 disabled:bg-pink-300">
                    {isGenerating ? "AI is Working..." : "Generate Issue with AI"}
                  </button>
              </div>

              {aiGeneratedData && (
                <div className="mt-8 p-4 border-2 border-purple-400 rounded-lg bg-purple-50">
                  <h3 className="text-xl font-bold text-purple-800">AI Generated Draft</h3>
                  <p className="text-sm text-gray-600 mb-4">Please review the details below.</p>
                  <div className="space-y-3 text-left">
                    <div><p className="font-semibold">Title:</p><p className="p-2 bg-white rounded border">{aiGeneratedData.title}</p></div>
                    <div><p className="font-semibold">Category:</p><p className="p-2 bg-white rounded border">{aiGeneratedData.category}</p></div>
                    <div><p className="font-semibold">Description:</p><p className="p-2 bg-white rounded border whitespace-pre-wrap">{aiGeneratedData.description}</p></div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <button onClick={handleAcceptAI} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-300">
                        {isSubmitting ? 'Creating...' : 'Accept & Create Issue'}
                    </button>
                    <button onClick={handleEditManually} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600">Edit Manually</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Mode */}
          {mode === 'manual' && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-400">
                    <option value="">Select category</option>
                    {categories.map((cat, idx) => (<option key={idx} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <LocationPicker location={location} setLocation={setLocation} />
                </div>
                <div className='relative md:col-span-2'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    ref={textAreaRef}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    placeholder="Describe the issue here, or use the microphone to speak."
                    className="w-full px-4 py-3 border border-gray-300 rounded-md h-40 resize-y focus:outline-none focus:ring-2 focus:ring-purple-400 pr-12" // Added padding-right
                  />
                  <SpeechToText
                    onTranscript={(transcript) => {
                      setFormData(prev => ({ ...prev, content: transcript }));
                    }}
                    initialText={formData.content}
                  />
                </div>
                {/* Images */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
                    
                    {/* Styled File Input */}
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer">
                        <span className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">
                          {imageFiles.length > 0 ? `${imageFiles.length} images selected` : "Choose Files..."}
                        </span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="sr-only"
                          onChange={handleFileChange} 
                        />
                      </label>
                    </div>

                    {/* Image Previews */}
                      {imageFiles.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                          {imageFiles.map((file, index) => (
                            <div key={index} className="relative group aspect-square">
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={`preview ${index}`} 
                                className="w-full h-full object-cover rounded-md border" 
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemoveImage(index)} 
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-60">{isSubmitting ? "Creating..." : "Create Issue"}</button>
              </div>
            </form>
          )}
          {error && <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
        </div>
      </div>
    </div>
  );
}

