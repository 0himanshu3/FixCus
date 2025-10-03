import React, { useState } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";

export default function CreateIssue() {
  const [formData, setFormData] = useState({ title: "", content: "", category: "", images: [], videos: [] });
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({ images: [], videos: [] });
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!formData.title || !formData.content || !formData.category || !location) {
      setError("Please fill all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/issues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, issueLocation: location, issuePublishDate: new Date() })
      });
      if (res.ok) window.alert("Issue created successfully!");
      else setError("Failed to create issue.");
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-10 px-4">
      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Create Issue</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-1">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Enter issue location"
              required
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-1">Description</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              required
              className="w-full p-3 border rounded-md h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-lg font-medium mb-1">Images</label>
            <div className="flex gap-2 items-center">
              <input type="file" multiple accept="image/*" onChange={e => setImageFiles([...e.target.files])} />
              <button
                type="button"
                onClick={() => uploadFiles(imageFiles, "images")}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Upload Images
              </button>
            </div>
            <div className="mt-1 space-y-1">
              {uploadProgress.images.map((p, i) => (
                <div key={i} className="text-sm text-gray-700">Image {i + 1}: {p}%</div>
              ))}
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-lg font-medium mb-1">Videos</label>
            <div className="flex gap-2 items-center">
              <input type="file" multiple accept="video/*" onChange={e => setVideoFiles([...e.target.files])} />
              <button
                type="button"
                onClick={() => uploadFiles(videoFiles, "videos")}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Upload Videos
              </button>
            </div>
            <div className="mt-1 space-y-1">
              {uploadProgress.videos.map((p, i) => (
                <div key={i} className="text-sm text-gray-700">Video {i + 1}: {p}%</div>
              ))}
            </div>
          </div>

          {error && <div className="text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-purple-700 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Create Issue"}
          </button>
        </form>
      </div>
    </div>
  );
}
