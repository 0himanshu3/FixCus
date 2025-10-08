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
const uploadFiles = async (filesArray, type) => {
  if (!filesArray || filesArray.length === 0) return [];

  const storage = getStorage(app);
  const progressArr = Array(filesArray.length).fill(0);
  setUploadProgress(prev => ({ ...prev, [type]: progressArr }));

  const results = await Promise.all(filesArray.map((file, idx) => {
    return new Promise((resolve) => {
      try {
        // Use a folder to keep paths tidy (optional)
        const path = `${type}/${Date.now()}-${file.name}`;
        const fileRef = ref(storage, path);

        // Set contentType metadata explicitly (helps for videos)
        const metadata = { contentType: file.type || (file.name.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'application/octet-stream') };

        const uploadTask = uploadBytesResumable(fileRef, file, metadata);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            progressArr[idx] = percent;
            setUploadProgress(prev => ({ ...prev, [type]: [...progressArr] }));
            // Helpful debug:
            console.log(`[upload ${type}] ${file.name} progress: ${percent}%`);
          },
          (err) => {
            // Log and resolve with error object so Promise.all continues
            console.error(`[upload ${type}] ERROR uploading ${file.name}:`, err);
            resolve({ success: false, name: file.name, error: err.message || err.code || String(err) });
          },
          async () => {
            try {
              // Snapshot ref should be available; log its fullPath for debugging
              console.log(`[upload ${type}] completed: snapshot ref path:`, uploadTask.snapshot.ref.fullPath);

              const url = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`[upload ${type}] got downloadURL for ${file.name}:`, url);
              resolve({ success: true, name: file.name, url });
            } catch (e) {
              console.error(`[upload ${type}] ERROR getting downloadURL for ${file.name}:`, e);
              resolve({ success: false, name: file.name, error: e.message || e.code || String(e) });
            }
          }
        );
      } catch (outerErr) {
        console.error(`[upload ${type}] unexpected error for ${file.name}:`, outerErr);
        resolve({ success: false, name: file.name, error: outerErr.message || String(outerErr) });
      }
    });
  }));

  // build urls array of successful uploads
  const urls = results.filter(r => r.success).map(r => r.url);
  // log failed ones
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.warn(`[upload ${type}] some files failed:`, failed);
    // optionally show toast for failures
    failed.forEach(f => toast.error(`Failed to upload ${f.name}: ${f.error}`));
  }

  // Update formData only with successful urls
  setFormData(prev => ({ ...prev, [type]: [...prev[type], ...urls] }));

  if (type === "images") setImageFiles([]);
  else setVideoFiles([]);

  return results; // returns full results so caller can inspect per-file outcome
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

            {/* --- NEW: Image Preview Grid --- */}
            {imageFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview ${index}`}
                      className="w-full h-full object-cover rounded-md border-2 border-gray-200"
                      // Revoke the object URL on load to prevent memory leaks
                      onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)} // A new handler to remove the image
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress Section (unchanged) */}
            <div className="mt-2 space-y-1">
              {uploadProgress.images.map((p, i) => (
                <div key={i} className="text-sm text-gray-600">Image {i + 1}: {p}% uploaded</div>
              ))}
            </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Videos</label>
              <div className="flex gap-3 items-center">
                <input type="file" multiple accept="video/*" onChange={e => setVideoFiles([...e.target.files])} />
                <button
                  type="button"
                  onClick={() => uploadFiles(videoFiles, "videos")}
                  className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                >
                  Upload
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {uploadProgress.videos.map((p, i) => (
                  <div key={i} className="text-sm text-gray-600">Video {i + 1}: {p}%</div>
                ))}
              </div>
            </div>

            {error && <div className="md:col-span-2 text-red-600">{error}</div>}

        

          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-3 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
}

