import React, { useState } from "react";
import LocationPicker from "../components/LocationPicker";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function CreateIssue() {
  const [formData, setFormData] = useState({ title: "", content: "", category: "", images: [], videos: [] });
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({ images: [], videos: [] });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const categories = [
    "Education & Skill Development",
    "Sports & Cultural Events",
    "Health & Well-being",
    "Women Empowerment",
    "Environmental Sustainability",
    "Social Inclusion & Awareness"
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
        window.alert("Issue created successfully!");
        navigate("/");
      }
      else setError("Failed to create issue.");
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-md shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Create Issue</h1>
            <p className="text-sm text-gray-500 mt-1">Provide details and publish your issue.</p>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Select category</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="w-full">
                  <LocationPicker location={location} setLocation={setLocation} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md h-40 resize-y focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                <div className="flex gap-3 items-center">
                  <input type="file" multiple accept="image/*" onChange={e => setImageFiles([...e.target.files])} />
                  <button
                    type="button"
                    onClick={() => uploadFiles(imageFiles, "images")}
                    className="px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-800"
                  >
                    Upload Images
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {uploadProgress.images.map((p, i) => (
                    <div key={i} className="text-sm text-gray-600">Image {i + 1}: {p}%</div>
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
                    className="px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-800"
                  >
                    Upload Videos
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

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-5 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
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
