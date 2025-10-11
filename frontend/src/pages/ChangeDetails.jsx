import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "../firebase";
import LocationPicker from "../components/LocationPicker";

function ChangeDetails() {
    // Redux user data
    const { user } = useSelector((state) => state.auth);

    // Local state for profile details
    const [location, setLocation] = useState("");
    const [weekdays, setWeekdays] = useState(false);
    const [weekends, setWeekends] = useState(false);

    // Avatar state
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarURL, setAvatarURL] = useState(null);
    const [imageUploadProgress, setImageUploadProgress] = useState(null);
    const [imageUploadError, setImageUploadError] = useState(null);

    // Modal state for password change
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [category, setCategory] = useState("");

    useEffect(() => {
        if (user) {
            setLocation(user.location || "");
            setWeekdays(user.availability?.weekdays || false);
            setWeekends(user.availability?.weekends || false);
            setAvatarURL(typeof user.avatar === "string" ? user.avatar : user.avatar?.url || null);
        }
    }, [user]);

    // Allowed special symbols (keep in sync with backend)
    const allowedSpecials = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "-"];

    // Password requirement helpers (used by UI & validation)
    const passwordLengthOk = (value) => typeof value === "string" && value.length >= 8 && value.length <= 16;
    const passwordUppercaseOk = (value) => /[A-Z]/.test(value || "");
    const passwordDigitOk = (value) => /\d/.test(value || "");
    const passwordSpecialOk = (value) => /[!@#$%^&*()_+\-]/.test(value || "");

    // Upload avatar to Firebase
    const handleAvatarUpload = async () => {
        if (!avatarFile) {
            setImageUploadError("Please select an image");
            return;
        }

        try {
            setImageUploadError(null);

            const storage = getStorage(app);
            const fileName = new Date().getTime() + "-" + avatarFile.name;
            const storageRef = ref(storage, fileName);

            const uploadTask = uploadBytesResumable(storageRef, avatarFile);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setImageUploadProgress(progress.toFixed(0));
                },
                (error) => {
                    setImageUploadError("Image upload failed");
                    setImageUploadProgress(null);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setAvatarURL(downloadURL);
                    setImageUploadProgress(null);
                    setImageUploadError(null);
                }
            );
        } catch (error) {
            console.error("Avatar upload error:", error);
            setImageUploadError("Image upload failed");
            setImageUploadProgress(null);
        }
    };

    // Apply changes (send to backend)
    const handleApplyChanges = async () => {
        try {
            const payload = {
                user_id: user._id,
                weekdays,
                weekends,
            };

            if (location) payload.location = location;
            if (avatarURL) payload.avatarURL = avatarURL;
            if (category) payload.category = category;

            const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/auth/updateUser`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("User updated successfully!");
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Something went wrong while updating user");
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("An error occurred while updating user details");
        }
    };

    // Handle password change - frontend validation + request
    const handleChangePassword = async () => {
        // Confirm match
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirm password do not match");
            return;
        }

        // Validate rules client-side before sending
        if (!passwordLengthOk(newPassword)) {
            toast.error("Password must be 8–16 characters");
            return;
        }
        if (!passwordUppercaseOk(newPassword)) {
            toast.error("Password must include at least one uppercase letter (A-Z)");
            return;
        }
        if (!passwordDigitOk(newPassword)) {
            toast.error("Password must include at least one digit (0-9)");
            return;
        }
        if (!passwordSpecialOk(newPassword)) {
            toast.error(`Password must include at least one special symbol (${allowedSpecials.join(" ")})`);
            return;
        }

        try {
            const payload = {
                user_id: user._id,
                oldPassword,
                newPassword,
            };

            const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/auth/updatePassword`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Password updated successfully!");
                setShowPasswordModal(false);
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                const errorData = await res.json();
                toast.error(errorData.message || "Something went wrong while updating password");
            }
        } catch (error) {
            console.error("Error updating password:", error);
            toast.error("An error occurred while updating password");
        }
    };

    const categories = [
        "Education & Skill Development",
        "Sports & Cultural Events",
        "Health & Well-being",
        "Women Empowerment",
        "Environmental Sustainability",
        "Social Inclusion & Awareness",
    ];

    // Live requirement booleans for UI
    const reqs = {
        length: passwordLengthOk(newPassword),
        uppercase: passwordUppercaseOk(newPassword),
        digit: passwordDigitOk(newPassword),
        special: passwordSpecialOk(newPassword),
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
            <div className="mb-4 px-6 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md shadow-lg">
                <h3 className="text-2xl font-extrabold tracking-wide text-center">
                    {user?.name || "User Name"}
                </h3>
            </div>

            {/* Avatar Preview */}
            <div className="relative mb-6">
                <div className="h-32 w-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {avatarURL ? (
                        <img src={avatarURL} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-gray-500">No Avatar</span>
                    )}
                </div>
            </div>

            {/* File Input & Upload Button */}
            <div className="mb-6">
                <label className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded cursor-pointer">
                    Select New Avatar
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setAvatarFile(e.target.files[0]);
                            }
                        }}
                    />
                </label>
                <button
                    type="button"
                    onClick={handleAvatarUpload}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded ml-4"
                    disabled={imageUploadProgress}
                >
                    {imageUploadProgress ? `${imageUploadProgress}%` : "Upload Avatar"}
                </button>
            </div>

            {imageUploadError && <p className="text-red-500 mb-4">{imageUploadError}</p>}

            {/* Location */}
            <div className="mb-4 w-full max-w-md">
                <LocationPicker
                    location={location}
                    setLocation={(val) => {
                        setLocation(val);
                    }}
                />
            </div>

            {/* Buttons */}
            <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <button
                    onClick={handleApplyChanges}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded w-full"
                >
                    Apply Changes
                </button>
                <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded w-full"
                >
                    Change Password
                </button>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                        <h3 className="text-xl font-semibold mb-4">Change Password</h3>

                        {/* Old Password */}
                        <div className="mb-3">
                            <label className="block mb-1 font-medium text-gray-700">Current Password</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter current password"
                            />
                        </div>

                        {/* New Password */}
                        <div className="mb-3">
                            <label className="block mb-1 font-medium text-gray-700">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new password"
                            />
                        </div>

                        {/* Confirm New Password */}
                        <div className="mb-3">
                            <label className="block mb-1 font-medium text-gray-700">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Confirm new password"
                            />
                        </div>

                        {/* Live password requirements */}
                        <div className="mb-4 text-sm space-y-1">
                            <div className="flex items-center">
                                <span className={`mr-2 ${reqs.length ? "text-green-600" : "text-gray-400"}`}>
                                    {reqs.length ? "✅" : "⬜"}
                                </span>
                                <span className={`${reqs.length ? "text-gray-700" : "text-gray-400"}`}>8–16 characters</span>
                            </div>
                            <div className="flex items-center">
                                <span className={`mr-2 ${reqs.uppercase ? "text-green-600" : "text-gray-400"}`}>
                                    {reqs.uppercase ? "✅" : "⬜"}
                                </span>
                                <span className={`${reqs.uppercase ? "text-gray-700" : "text-gray-400"}`}>At least one uppercase letter (A-Z)</span>
                            </div>
                            <div className="flex items-center">
                                <span className={`mr-2 ${reqs.digit ? "text-green-600" : "text-gray-400"}`}>
                                    {reqs.digit ? "✅" : "⬜"}
                                </span>
                                <span className={`${reqs.digit ? "text-gray-700" : "text-gray-400"}`}>At least one digit (0-9)</span>
                            </div>
                            <div className="flex items-center">
                                <span className={`mr-2 ${reqs.special ? "text-green-600" : "text-gray-400"}`}>
                                    {reqs.special ? "✅" : "⬜"}
                                </span>
                                <span className={`${reqs.special ? "text-gray-700" : "text-gray-400"}`}>At least one special symbol ({allowedSpecials.join(" ")})</span>
                            </div>
                        </div>

                        {/* Modal Buttons */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChangeDetails;
