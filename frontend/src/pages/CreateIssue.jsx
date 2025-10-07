import React, { useState, useRef } from "react";
import LocationPicker from "../components/LocationPicker";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SpeechToText from "../components/SpeechToText";

export default function CreateIssue() {
  const [formData, setFormData] = useState({ title: "", content: "", category: "", images: [], videos: [] });
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({ images: [], videos: [] });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate(); 
  const [suggestedCategory, setSuggestedCategory] = useState("");
  const [isCategoryLocked, setIsCategoryLocked] = useState(true);
  const [isClassifying, setIsClassifying] = useState(false);
  const textAreaRef = useRef(null);

  const categories = [
    "Road damage",
    "Waterlogging / Drainage Issues",
    "Improper Waste Management",
    "Street lights/Exposed Wires",
    "Unauthorized loudspeakers",
    "Burning of garbage",
    "Encroachment / Illegal Construction",
    "Damaged Public Property",
    "Stray Animal Menace",
    "General Issue"
  ];

  const uploadFiles = async (filesArray, type) => {
    if (filesArray.length === 0) return;
    const storage = getStorage(app);
    const urls = [];
    const progressArr = Array(filesArray.length).fill(0);
    setUploadProgress(prev => ({ ...prev, [type]: progressArr }));

    await Promise.all(
      filesArray.map((file, idx) => {
        const fileRef = ref(storage, Date.now() + "-" + file.name);
        const uploadTask = uploadBytesResumable(fileRef, file);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            snapshot => {
              progressArr[idx] = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(0);
              setUploadProgress(prev => ({ ...prev, [type]: [...progressArr] }));
            },
            err => reject(err),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              urls.push(url);
              resolve();
            }
          );
        });
      })
    );

    setFormData(prev => ({ ...prev, [type]: [...prev[type], ...urls] }));
    type === "images" ? setImageFiles([]) : setVideoFiles([]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.category || !location || !location.lat || !location.lng) {
      setError("Please fill all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/issues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
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
      }
      else setError("Failed to create issue.");
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySuggestion = async () => {
    if (!formData.images.length) {
      toast.error("Please upload at least one image before suggesting category.");
      return;
    }

    setIsClassifying(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/issues/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: formData.images[0] }), // just send first image
      });

      const data = await res.json();
      if (data?.category) {
        setSuggestedCategory(data.category);
        toast.info(`AI suggests category: ${data.category}`);
      } else {
        toast.error("Could not classify image.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error while classifying image.");
    } finally {
      setIsClassifying(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
  <div className="w-full min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Create Issue</h1>
          <p className="text-sm text-gray-500 mt-1">Provide details and publish your issue.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* AI Category Suggestion System */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>

              <div className="flex items-center gap-3">
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  disabled={isCategoryLocked}
                  required
                  className={`w-full px-4 py-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    isCategoryLocked ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleCategorySuggestion}
                  disabled={isClassifying}
                  className="px-4 py-2 rounded-md bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
                >
                  {isClassifying ? "Classifying..." : "Suggest"}
                </button>
              </div>

              {suggestedCategory && (
                <div className="mt-2 p-3 border rounded-md bg-pink-50 text-sm text-pink-800">
                  <p>AI suggests: <strong>{suggestedCategory}</strong></p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category: suggestedCategory });
                        setSuggestedCategory("");
                        setIsCategoryLocked(true);
                      }}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuggestedCategory("");
                        setIsCategoryLocked(false);
                      }}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="w-full">
                <LocationPicker location={location} setLocation={setLocation} />
              </div>
            </div>

            {/* Description */}
            <div className='relative md:col-span-2'><textarea
              placeholder="Issue Description..."
              ref={textAreaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              className="w-full px-4 py-2  border rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500  min-h-[120px]"
            />
              <SpeechToText textAreaRef={textAreaRef} setText={setFormData} left="10px" bottom="10px" />
            </div>

            {/* Images */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Images
            </label>
            
            {/* Styled File Input and Upload Button */}
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <span className="px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">
                  {imageFiles.length > 0 ? `${imageFiles.length} images selected` : "Choose Files..."}
                </span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="sr-only" // Hides the default ugly input
                  onChange={e => setImageFiles(Array.from(e.target.files))} 
                />
              </label>
              <button
                type="button"
                onClick={() => uploadFiles(imageFiles, "images")}
                disabled={imageFiles.length === 0 || isSubmitting}
                className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
              >
                Upload
              </button>
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
