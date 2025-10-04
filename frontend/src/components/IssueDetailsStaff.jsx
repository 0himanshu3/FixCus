// IssueDetailsStaff.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
} from "firebase/storage";
import { app } from "../firebase";

/**
 IssueDetailsStaff
 - Worker: can update & submit proof for their tasks (buttons removed once task is approved / completed)
 - Coordinator: can update & submit proof for own tasks (buttons removed once task is approved), can view workers and approve/reject worker proofs
 - Supervisor: can view coordinators & approve/reject proofs, assign tasks to coordinators, resolve issue
**/

export default function IssueDetailsStaff() {
    const { slug } = useParams();
    const { user } = useSelector((state) => state.auth);

    const [issue, setIssue] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [assignedRole, setAssignedRole] = useState(null);
    const [userTasks, setUserTasks] = useState([]);
    const [issueTasks, setIssueTasks] = useState([]);

    const [showImageSlider, setShowImageSlider] = useState(false);
    const [currentImageIdx, setCurrentImageIdx] = useState(0); // Update modal

    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [updateModalTask, setUpdateModalTask] = useState(null);
    const [updateText, setUpdateText] = useState(""); // Proof modal

    const [proofModalOpen, setProofModalOpen] = useState(false);
    const [proofModalTask, setProofModalTask] = useState(null);
    const [proofText, setProofText] = useState("");
    const [proofFiles, setProofFiles] = useState([]);
    const [proofUploadProgress, setProofUploadProgress] = useState([]); // Assign modal

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignModalAssignee, setAssignModalAssignee] = useState(null);
    const [assignModalData, setAssignModalData] = useState({
        title: "",
        description: "",
        deadline: "",
    });

    const [issueSummary, setIssueSummary] = useState(""); // Supervisor resolve modal states

    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [resolveSummary, setResolveSummary] = useState("");
    const [resolveFiles, setResolveFiles] = useState([]);
    const [resolveUploadProgress, setResolveUploadProgress] = useState([]); // ratings: { userId: { rating: number, comment: string, role: string, name: string } }
    const [resolveRatings, setResolveRatings] = useState({});
    const [isResolving, setIsResolving] = useState(false); // Helper: treat a date string as end-of-day and check if it's in the past


    // Supervisor-specific UI state
    const [supervisorTasksSectionOpen, setSupervisorTasksSectionOpen] = useState(true); // optional toggle
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [reassignTask, setReassignTask] = useState(null);
    const [reassignAssignee, setReassignAssignee] = useState(null); // coordinator id/email
    const [reassignDeadline, setReassignDeadline] = useState("");

    const [superCompleteModalOpen, setSuperCompleteModalOpen] = useState(false);
    const [superCompleteTask, setSuperCompleteTask] = useState(null);
    const [superCompleteText, setSuperCompleteText] = useState("");
    const [superCompleteFiles, setSuperCompleteFiles] = useState([]);
    const [superCompleteUploadProgress, setSuperCompleteUploadProgress] = useState([]);
    const [isReassigning, setIsReassigning] = useState(false);
    const [isCompletingAsSupervisor, setIsCompletingAsSupervisor] = useState(false);

    // Open the reassign modal (pass in task object)
    const openReassignModal = (task) => {
        setReassignTask(task);
        setReassignAssignee(null);
        setReassignDeadline("");
        setReassignModalOpen(true);
    };

    // Submit reassign to a coordinator
    const submitReassignToCoordinator = async () => {
        if (!reassignTask) return alert("No task selected");
        if (!reassignAssignee) return alert("Select a coordinator to reassign to");
        if (!reassignDeadline) return alert("Please select a new deadline");

        const today = new Date().toISOString().split("T")[0];
        if (reassignDeadline < today) return alert("Deadline cannot be in the past");

        try {
            setIsReassigning(true);
            // Expected backend endpoint: POST /api/v1/issues/reassign/:taskId
            const res = await fetch(`/api/v1/issues/reassign/${reassignTask._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    coordinatorId: reassignAssignee, // id or email (use consistent id)
                    roleOfAssignee: "Coordinator",
                    deadline: reassignDeadline,
                }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error("Reassign failed: " + txt);
            }
            setReassignModalOpen(false);
            setReassignTask(null);
            setReassignAssignee(null);
            setReassignDeadline("");
            await refreshAfterAction();
        } catch (err) {
            console.error("submitReassignToCoordinator error:", err);
            alert("Error reassigning task");
        } finally {
            setIsReassigning(false);
        }
    };

    // Open complete-as-supervisor modal
    const openSuperCompleteModal = (task) => {
        setSuperCompleteTask(task);
        setSuperCompleteText("");
        setSuperCompleteFiles([]);
        setSuperCompleteUploadProgress([]);
        setSuperCompleteModalOpen(true);
    };

    // Submit completion by supervisor (uploads images then marks Completed without needing approval)
    const submitCompleteBySupervisor = async () => {
        if (!superCompleteTask) return alert("No task selected");
        if (!superCompleteText.trim()) return alert("Please enter completion notes");

        try {
            setIsCompletingAsSupervisor(true);
            const urls = await uploadFilesToFirebase(superCompleteFiles, setSuperCompleteUploadProgress);

            const res = await fetch(`/api/v1/issues/completeBySupervisor/${superCompleteTask._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    completionText: superCompleteText,
                    completionImages: urls,
                    // optional: mark completedBySupervisor: true
                }),
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error("Complete by supervisor failed: " + txt);
            }

            alert("Task marked completed.");
            setSuperCompleteModalOpen(false);
            setSuperCompleteTask(null);
            setSuperCompleteText("");
            setSuperCompleteFiles([]);
            setSuperCompleteUploadProgress([]);
            await refreshAfterAction();
        } catch (err) {
            console.error("submitCompleteBySupervisor error:", err);
            alert("Error completing task as supervisor");
        } finally {
            setIsCompletingAsSupervisor(false);
        }
    };

    const hasDeadlinePassed = (deadline) => {
        if (!deadline) return false;
        try {
            const dl = new Date(deadline); // If deadline is a date-only string (yyyy-mm-dd) set it to end of that day
            dl.setHours(23, 59, 59, 999);
            return dl < new Date();
        } catch (e) {
            return false;
        }
    }; // Firebase upload helper (now accepts an optional progress setter)

    const uploadFilesToFirebase = async (
        files,
        setProgress = setProofUploadProgress
    ) => {
        if (!files || files.length === 0) return [];

        const storage = getStorage(app);
        const urls = [];
        const progressArr = Array(files.length).fill(0);
        setProgress(progressArr);

        await Promise.all(
            files.map((file, idx) => {
                const fileRef = ref(storage, `${Date.now()}-${file.name}`);
                const uploadTask = uploadBytesResumable(fileRef, file);

                return new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const pct = Math.round(
                                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                            );
                            progressArr[idx] = pct;
                            setProgress([...progressArr]);
                        },
                        (err) => reject(err),
                        async () => {
                            try {
                                const downloadUrl = await getDownloadURL(
                                    uploadTask.snapshot.ref
                                );
                                urls.push(downloadUrl);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }
                    );
                });
            })
        );

        setTimeout(() => setProgress([]), 600);
        return urls;
    }; // Fetch issue and derive user role & tasks (expects staffsAssigned[].user and staffsAssigned[].tasks to be included in issue response)

    const fetchIssue = async () => {
        if (!slug || !user) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/issues/${slug}`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch issue");
            const data = await res.json();
            const issueData = data.issue;
            setIssue(issueData); // find assigned staff entry for current user

            const assignedStaff = (issueData.staffsAssigned || []).find((s) => {
                const u = s.user || {};
                return (
                    (u._id && String(u._id) === String(user._id)) ||
                    (u.id && String(u.id) === String(user._id)) ||
                    (u.email && u.email === user.email)
                );
            });

            if (assignedStaff) {
                setAssignedRole(assignedStaff.role);
                setUserTasks(
                    Array.isArray(assignedStaff.tasks) ? assignedStaff.tasks : []
                );
            } else {
                setAssignedRole(null);
                setUserTasks([]);
            } // flatten tasks from all staff entries for coordinator/supervisor views

            const flat = [];
            (issueData.staffsAssigned || []).forEach((s) => {
                if (Array.isArray(s.tasks)) s.tasks.forEach((t) => flat.push(t));
            });
            setIssueTasks(flat);
        } catch (err) {
            console.error("fetchIssue error:", err);
            setIssue(null);
            setAssignedRole(null);
            setUserTasks([]);
            setIssueTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIssue(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, user]);

    const refreshAfterAction = async () => {
        await fetchIssue();
    }; // Submit update (worker/coordinator)

    const submitTaskUpdate = async () => {
        if (!updateModalTask || !updateText.trim()) {
            alert("Please enter update text.");
            return;
        } // Guard: if task already approved/completed do nothing (UI shouldn't allow this path, but guard anyway)

        if (updateModalTask.status === "Completed") {
            alert("Task is already completed.");
            setUpdateModalOpen(false);
            return;
        } // Guard: prevent updates if deadline has passed

        if (
            hasDeadlinePassed(updateModalTask.deadline) &&
            updateModalTask.status !== "Completed"
        ) {
            alert(
                "Cannot submit update — task deadline has passed and is marked overdue."
            );
            setUpdateModalOpen(false);
            return;
        }

        try {
            const res = await fetch(`/api/v1/issues/update/${updateModalTask._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ updateText }),
            });
            if (!res.ok) throw new Error("Failed to submit update");
            setUpdateModalOpen(false);
            setUpdateText("");
            await refreshAfterAction();
        } catch (err) {
            console.error(err);
            alert("Error submitting update");
        }
    }; // Submit proof (worker/coordinator)

    const submitTaskProof = async () => {
        if (!proofModalTask) return alert("No task selected");
        if (!proofText.trim()) return alert("Please enter proof description");
        if (!proofFiles || proofFiles.length === 0)
            return alert("Attach at least one image"); // Guard if already completed

        if (proofModalTask.status === "Completed") {
            alert("Task already completed.");
            setProofModalOpen(false);
            return;
        } // Guard: prevent proof submission if deadline passed

        if (
            hasDeadlinePassed(proofModalTask.deadline) &&
            proofModalTask.status !== "Completed"
        ) {
            alert(
                "Cannot submit proof — task deadline has passed and is marked overdue."
            );
            setProofModalOpen(false);
            return;
        }

        try {
            const urls = await uploadFilesToFirebase(
                proofFiles,
                setProofUploadProgress
            );

            const res = await fetch(
                `/api/v1/issues/submitProof/${proofModalTask._id}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        proofText,
                        proofImages: urls,
                    }),
                }
            );
            if (!res.ok) {
                const txt = await res.text();
                throw new Error("Submit proof failed: " + txt);
            }
            setProofModalOpen(false);
            setProofText("");
            setProofFiles([]);
            setProofUploadProgress([]);
            await refreshAfterAction();
        } catch (err) {
            console.error("submitTaskProof error:", err);
            alert("Error submitting proof");
        }
    }; // Approve or reject proof (coordinator/supervisor)

    const approveOrRejectProof = async (taskId, approve) => {
        try {
            const res = await fetch(`/api/v1/issues/approveReject/${taskId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ approve }),
            });
            if (!res.ok) throw new Error("Failed to set approval");
            await refreshAfterAction();
        } catch (err) {
            console.error(err);
            alert("Error approving/rejecting proof");
        }
    };

    const [isAssigning, setIsAssigning] = useState(false); // Assign task to a specific assignee (modal per-person)
    const assignTaskToAssignee = async () => {
        if (isAssigning) return; // Prevent duplicate submits

        if (!assignModalAssignee) return alert("No assignee selected");
        if (!assignModalData.title || !assignModalData.deadline)
            return alert("Title and deadline required");

        const today = new Date().toISOString().split("T")[0];
        if (assignModalData.deadline < today)
            return alert("Deadline cannot be in the past");

        try {
            setIsAssigning(true);

            const body = {
                issueId: issue._id,
                assignedTo: assignModalAssignee.id,
                roleOfAssignee: assignModalAssignee.role,
                title: assignModalData.title,
                description: assignModalData.description,
                deadline: assignModalData.deadline,
            };
            const res = await fetch(`/api/v1/issues/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error("Assign failed: " + txt);
            }
            setAssignModalOpen(false);
            setAssignModalAssignee(null);
            setAssignModalData({ title: "", description: "", deadline: "" });
            await refreshAfterAction();
        } catch (err) {
            console.error(err);
            alert("Error assigning task");
        } finally {
            setIsAssigning(false);
        }
    }; // Supervisor resolve (legacy simple resolve preserved but not used for supervisor UI anymore)

    const openResolveModal = () => {
        const ratingsInit = {}; // build list skipping the current user (supervisor)

        const staffList = (issue?.staffsAssigned || []).filter((s) => {
            if (!s.user) return false;
            const u = s.user || {};
            const isCurrent =
                (u._id && String(u._id) === String(user._id)) ||
                (u.id && String(u.id) === String(user._id)) ||
                (u.email && u.email === user.email);
            return !isCurrent;
        });

        staffList.forEach((s) => {
            const uid =
                s.user._id || s.user.id || s.user?.email || `${Math.random()}`;
            ratingsInit[uid] = {
                rating: 5,
                comment: "",
                role: s.role,
                name: s.user.name || s.user.email || "Unnamed",
                userId: uid,
            };
        });

        setResolveRatings(ratingsInit);
        setResolveSummary("");
        setResolveFiles([]);
        setResolveModalOpen(true);
    };

    const submitResolution = async () => {
        if (!resolveSummary.trim())
            return alert("Please add a summary of the resolution.");
        if (!issue) return alert("Issue not loaded");

        try {
            setIsResolving(true);
            const urls = await uploadFilesToFirebase(
                resolveFiles,
                setResolveUploadProgress
            ); // Build staffPerformance array (backend expects this field name, not "ratings")

            const staffPerformance = (issue?.staffsAssigned || [])
                .filter((s) => {
                    // Skip supervisor (current user)
                    if (!s.user) return false;
                    const u = s.user;
                    const isCurrent =
                        (u._id && String(u._id) === String(user._id)) ||
                        (u.id && String(u.id) === String(user._id)) ||
                        (u.email && u.email === user.email);
                    return !isCurrent;
                })
                .map((s) => {
                    const uid = s.user._id || s.user.id || s.user.email;
                    const r = resolveRatings[uid];
                    return {
                        name: s.user.name || s.user.email || "Unnamed",
                        email: s.user.email || "",
                        role: s.role || "",
                        rating: r?.rating || 0,
                        comment: r?.comment || "",
                        userId: uid,
                    };
                });

            const res = await fetch(`/api/v1/issues/resolve/${issue._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    summary: resolveSummary,
                    resolutionImages: urls,
                    staffPerformance, // key name matches backend
                }),
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error("Resolve failed: " + txt);
            }

            alert("Issue resolved and resolution report submitted.");
            setResolveModalOpen(false);
            setResolveSummary("");
            setResolveFiles([]);
            setResolveUploadProgress([]);
            setResolveRatings({});
            await refreshAfterAction();
        } catch (err) {
            console.error("submitResolution error:", err);
            alert("Error submitting resolution");
        } finally {
            setIsResolving(false);
        }
    }; // prevent background scroll when resolve modal is open

    useEffect(() => {
        const originalOverflow = window.getComputedStyle(document.body).overflow;
        if (resolveModalOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            // restore on close / unmount
            document.body.style.overflow = originalOverflow;
        };
    }, [resolveModalOpen]);

    const workersAssigned = (issue?.staffsAssigned || []).filter(
        (s) => s.role === "Worker" && s.user
    );
    const coordinatorsAssigned = (issue?.staffsAssigned || []).filter(
        (s) => s.role === "Coordinator" && s.user
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                {" "}
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                {" "}
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Issue not found.</p>
                {" "}
            </div>
        );
    }

    const isResolved = issue.status === "Resolved";

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-400 to-pink-300 rounded-2xl p-6 shadow-2xl border-4 border-purple-600">
                    <h1 className="text-4xl font-black text-purple-900 tracking-tight overflow-hidden">{issue.title}</h1>

                    <div className="flex flex-wrap gap-3 items-center mt-4">
                        {issue.category && (
                            <span className="bg-purple-700 text-pink-100 px-4 py-2 rounded-full font-bold text-sm border-2 border-pink-300 shadow-md">
                                🎪 {issue.category}
                            </span>
                        )}
                        <span className="bg-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm border-2 border-purple-300 shadow-md">
                            ⚡ Priority: {issue.priority}
                        </span>
                        <span className="bg-purple-600 text-pink-100 px-4 py-2 rounded-full font-bold text-sm border-2 border-pink-300 shadow-md">
                            📋 Status: {issue.status}
                        </span>
                        {/* Resolved Badge */}
                        {isResolved && (
                            <span className="bg-green-100 text-green-800 font-black px-4 py-2 rounded-full border-2 border-green-400 shadow-md">
                                ✅ This issue is resolved. Actions are disabled.
                            </span>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-pink-200 rounded-xl p-5 shadow-lg border-4 border-purple-500">
                    <p className="text-purple-900 font-semibold text-lg">
                        <strong className="text-purple-700">📍 Location:</strong> {issue.issueLocation}
                    </p>
                    <p className="text-purple-900 font-semibold text-lg mt-2">
                        <strong className="text-purple-700">📅 Published:</strong> {new Date(issue.issuePublishDate).toLocaleDateString()}
                    </p>
                </div>

                {/* Assigned Role Badge */}
                {assignedRole && (
                    <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-xl p-4 shadow-lg border-4 border-purple-600">
                        <p className="text-white font-black text-lg">🎭 You are assigned as {assignedRole}</p>
                    </div>
                )}

                {/* Images Section */}
                {issue.images?.length > 0 && (
                    <div className="bg-gradient-to-br from-pink-300 to-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
                        <h2 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">🎨 Images</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {issue.images.slice(0, 6).map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Issue ${idx}`}
                                    className="w-full h-36 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform border-4 border-purple-400 shadow-md"
                                    onClick={() => {
                                        setCurrentImageIdx(idx);
                                        setShowImageSlider(true);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Image Slider Modal */}
                <AnimatePresence>
                    {showImageSlider && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-purple-900/95"
                        >
                            <button
                                className="absolute top-5 right-5 text-pink-300 text-5xl hover:text-pink-100 font-bold"
                                onClick={() => setShowImageSlider(false)}
                            >
                                &times;
                            </button>
                            <div className="relative w-4/5 max-w-3xl">
                                <img
                                    src={issue.images[currentImageIdx]}
                                    alt={`Slide ${currentImageIdx}`}
                                    className="w-full h-96 object-contain rounded-xl border-4 border-pink-400 shadow-2xl"
                                />
                                <button
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-300 text-5xl hover:text-pink-100 bg-purple-800/50 rounded-full w-14 h-14 flex items-center justify-center"
                                    onClick={() =>
                                        setCurrentImageIdx(
                                            (p) => (p - 1 + issue.images.length) % issue.images.length
                                        )
                                    }
                                >
                                    &#8592;
                                </button>
                                <button
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-pink-300 text-5xl hover:text-pink-100 bg-purple-800/50 rounded-full w-14 h-14 flex items-center justify-center"
                                    onClick={() =>
                                        setCurrentImageIdx((p) => (p + 1) % issue.images.length)
                                    }
                                >
                                    &#8594;
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Videos Section */}
                {issue.videos?.length > 0 && (
                    <div className="bg-gradient-to-br from-pink-300 to-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
                        <h2 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">🎬 Videos</h2>
                        <div className="space-y-4">
                            {issue.videos.map((vid, idx) => (
                                <video key={idx} src={vid} controls className="w-full h-64 rounded-lg border-4 border-purple-400 shadow-md" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Upvotes/Downvotes/Comments */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 justify-center">
                        <div className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full font-black text-lg shadow-xl border-4 border-purple-600">
                            👍 Upvotes: {issue.upvotes?.length || 0}
                        </div>
                        <div className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full font-black text-lg shadow-xl border-4 border-purple-600">
                            👎 Downvotes: {issue.downvotes?.length || 0}
                        </div>
                    </div>

                    <div className="bg-pink-200 rounded-xl p-5 shadow-xl border-4 border-purple-600">
                        <h2 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">💬 Comments</h2>
                        <div className="space-y-3">
                            {issue.comments?.length > 0 ? (
                                issue.comments.map((c) => (
                                    <div key={c._id} className="bg-white rounded-lg p-4 shadow-md border-2 border-pink-400">
                                        <p className="text-purple-900 font-semibold">
                                            <strong className="text-purple-700">{c.user?.name}</strong>: {c.content}
                                        </p>
                                        <p className="text-sm text-purple-600 mt-2">
                                            🎪 {new Date(c.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-purple-700 font-semibold">No comments yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Worker / Coordinator: Your Assigned Tasks */}
                {(assignedRole === "Worker" || assignedRole === "Coordinator") && (
                    <div className="bg-gradient-to-r from-pink-300 to-pink-200 rounded-xl p-6 shadow-xl border-4 border-purple-600">
                        <h2 className="text-3xl font-black text-purple-900 mb-4 overflow-hidden">🎯 Your Assigned Tasks</h2>

                        {userTasks.length === 0 ? (
                            <p className="text-purple-700 font-semibold">No tasks assigned to you for this issue.</p>
                        ) : (
                            userTasks.map((task) => {
                                const proofSubmitted = Boolean(task.taskProofSubmitted);
                                const isCompleted = task.status === "Completed";
                                const isOverdue = hasDeadlinePassed(task.deadline) && !isCompleted;

                                return (
                                    <div key={task._id} className="bg-white rounded-lg p-4 mb-4 shadow-md border-2 border-pink-400">
                                        <div className="flex justify-between">
                                            <div>
                                                <h3 className="font-black text-xl text-purple-900 overflow-hidden">{task.title}</h3>
                                                <p className="text-sm text-purple-700">{task.description}</p>
                                                <p className="text-xs text-purple-600 mt-1">
                                                    📅 Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}
                                                </p>
                                                <p className="text-xs text-purple-600">
                                                    📋 Status: {isCompleted ? task.status : (isOverdue ? "Incomplete — Overdue" : task.status)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-purple-700">👤 Assigned By: {task.assignedBy?.name || "N/A"}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            {!proofSubmitted && !isCompleted ? (
                                                isOverdue ? (
                                                    <span className="inline-block px-4 py-2 bg-red-100 text-red-800 rounded-full font-bold border-2 border-red-400">
                                                        ⏰ Deadline passed — actions disabled
                                                    </span>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="px-4 py-2 bg-purple-600 text-pink-100 rounded-full font-bold hover:bg-purple-700 shadow-md border-2 border-pink-300 transform hover:scale-105 transition-all"
                                                            onClick={() => {
                                                                setUpdateModalTask(task);
                                                                setUpdateText("");
                                                                setUpdateModalOpen(true);
                                                            }}
                                                        >
                                                            📝 Give Task Update
                                                        </button>
                                                        <button
                                                            className="px-4 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-md border-2 border-purple-300 transform hover:scale-105 transition-all"
                                                            onClick={() => {
                                                                setProofModalTask(task);
                                                                setProofText("");
                                                                setProofFiles([]);
                                                                setProofModalOpen(true);
                                                            }}
                                                        >
                                                            ✅ Submit Task Completion Proof
                                                        </button>
                                                    </div>
                                                )
                                            ) : isCompleted ? (
                                                <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold border-2 border-green-400">
                                                    ✅ Completed / Approved
                                                </span>
                                            ) : (
                                                <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-bold border-2 border-yellow-400">
                                                    ⏳ Proof submitted — awaiting review
                                                </span>
                                            )}
                                        </div>

                                        {/* Proof preview */}
                                        {task.taskCompletionProof && (
                                            <div className="mt-3 bg-pink-50 p-3 rounded-lg border-2 border-purple-300">
                                                <p className="font-bold text-purple-900">📸 Proof:</p>
                                                <p className="text-purple-800">{task.taskCompletionProof}</p>
                                                {task.taskProofImages?.length > 0 && (
                                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                                        {task.taskProofImages.map((pi, i) => (
                                                            <img key={i} src={pi} alt={`proof-${i}`} className="w-full h-20 object-cover rounded border-2 border-purple-300" />
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-xs text-purple-600 mt-1">
                                                    Proof Submitted: {task.taskProofSubmitted ? "Yes" : "No"}
                                                </p>
                                            </div>
                                        )}

                                        {/* Updates */}
                                        {task.taskUpdates?.length > 0 && (
                                            <div className="mt-3">
                                                <h4 className="font-black text-purple-900 overflow-hidden">📋 Updates</h4>
                                                <ul className="list-disc ml-5 space-y-1">
                                                    {(task.taskUpdates || []).map((u, idx) => (
                                                        <li key={idx} className="text-sm text-purple-800">
                                                            {u.updateText}
                                                            <div className="text-xs text-purple-600">
                                                                — {u.updatedBy?.name || "Unknown"} on {new Date(u.updatedAt).toLocaleString()}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Coordinator: Workers & Tasks */}
                {assignedRole === "Coordinator" && (
                    <div className="bg-gradient-to-r from-pink-300 to-pink-200 rounded-xl p-6 shadow-xl border-4 border-purple-600">
                        <h2 className="text-3xl font-black text-purple-900 mb-4 overflow-hidden">👷 Workers Assigned to This Issue</h2>

                        {workersAssigned.length === 0 ? (
                            <p className="text-purple-700 font-semibold">No workers assigned.</p>
                        ) : (
                            workersAssigned.map((w) => {
                                const workerTasks = Array.isArray(w.tasks) ? w.tasks : [];
                                return (
                                    <div key={w.user._id} className="bg-white rounded-lg p-4 mb-4 shadow-md border-2 border-pink-400">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-black text-xl text-purple-900 overflow-hidden">{w.user.name}</h3>
                                                <p className="text-xs text-purple-600">{w.user.email}</p>
                                            </div>
                                            <button
                                                className={`px-4 py-2 rounded-full text-white font-bold shadow-md border-2 transform hover:scale-105 transition-all ${isAssigning || assignModalOpen || isResolved
                                                    ? "bg-gray-400 cursor-not-allowed border-gray-500"
                                                    : "bg-purple-600 hover:bg-purple-700 border-pink-300"
                                                    }`}
                                                onClick={() => {
                                                    if (isAssigning || assignModalOpen || isResolved) return;
                                                    setAssignModalAssignee({
                                                        id: w.user.id,
                                                        role: "Worker",
                                                        name: w.user.name,
                                                    });
                                                    setAssignModalData({
                                                        title: "",
                                                        description: "",
                                                        deadline: "",
                                                    });
                                                    setAssignModalOpen(true);
                                                }}
                                                disabled={isAssigning || assignModalOpen || isResolved}
                                            >
                                                🎯 Assign Task
                                            </button>
                                        </div>

                                        <div className="mt-3 space-y-2">
                                            {workerTasks.length === 0 ? (
                                                <p className="text-purple-700 font-semibold">No tasks for this worker.</p>
                                            ) : (
                                                workerTasks.map((task) => {
                                                    const isCompleted = task.status === "Completed";
                                                    const isOverdue = hasDeadlinePassed(task.deadline) && !isCompleted;
                                                    return (
                                                        <div key={task._id} className="p-3 bg-pink-50 rounded-lg border-2 border-purple-300">
                                                            <div className="flex justify-between">
                                                                <div>
                                                                    <p className="font-bold text-purple-900">{task.title}</p>
                                                                    <p className="text-xs text-purple-700">
                                                                        📅 Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-purple-700">
                                                                        📋 Status: {isCompleted ? task.status : (isOverdue ? "Incomplete — Overdue" : task.status)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {task.taskProofSubmitted && !isCompleted && (
                                                                <div className="mt-2 flex gap-2">
                                                                    <button
                                                                        className="px-3 py-1 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-md border-2 border-purple-300"
                                                                        onClick={() => approveOrRejectProof(task._id, true)}
                                                                    >
                                                                        ✅ Approve
                                                                    </button>
                                                                    <button
                                                                        className="px-3 py-1 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 shadow-md border-2 border-purple-300"
                                                                        onClick={() => approveOrRejectProof(task._id, false)}
                                                                    >
                                                                        ❌ Reject
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {isCompleted && (
                                                                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold border-2 border-green-400">
                                                                    ✅ Completed / Approved
                                                                </span>
                                                            )}

                                                            {task.taskCompletionProof && (
                                                                <div className="mt-2 text-sm">
                                                                    <p className="text-purple-900">
                                                                        <strong>📸 Proof:</strong> {task.taskCompletionProof}
                                                                    </p>
                                                                    {task.taskProofImages?.length > 0 && (
                                                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                                                            {task.taskProofImages.map((pi, i) => (
                                                                                <img key={i} src={pi} alt={`task-proof-${i}`} className="w-full h-20 object-cover rounded border-2 border-purple-300" />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {task.taskUpdates?.length > 0 && (
                                                                <div className="mt-2">
                                                                    <h4 className="font-bold text-purple-900 overflow-hidden">📋 Updates</h4>
                                                                    <ul className="list-disc ml-5">
                                                                        {task.taskUpdates.map((u, idx) => (
                                                                            <li key={idx} className="text-sm text-purple-800">
                                                                                {u.updateText}
                                                                                <div className="text-xs text-purple-600">
                                                                                    — {u.updatedBy?.name || "Unknown"} on {new Date(u.updatedAt).toLocaleString()}
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Supervisor: Coordinators & Tasks */}
                {assignedRole === "Supervisor" && (
                    <div className="bg-gradient-to-r from-pink-300 to-pink-200 rounded-xl p-6 shadow-xl border-4 border-purple-600">
                        <h2 className="text-3xl font-black text-purple-900 mb-4 overflow-hidden">🎭 Coordinators Assigned to This Issue</h2>

                        {coordinatorsAssigned.length === 0 ? (
                            <p className="text-purple-700 font-semibold">No coordinators assigned.</p>
                        ) : (
                            coordinatorsAssigned.map((c) => {
                                const coordTasks = Array.isArray(c.tasks) ? c.tasks : [];
                                return (
                                    <div key={c.user._id} className="bg-white rounded-lg p-4 mb-4 shadow-md border-2 border-pink-400">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-black text-xl text-purple-900 overflow-hidden">{c.user.name}</h3>
                                                <p className="text-xs text-purple-600">{c.user.email}</p>
                                            </div>
                                            <button
                                                className={`px-4 py-2 text-white rounded-full font-bold shadow-md border-2 transform hover:scale-105 transition-all ${isResolved
                                                    ? "bg-gray-400 cursor-not-allowed border-gray-500"
                                                    : "bg-purple-600 hover:bg-purple-700 border-pink-300"
                                                    }`}
                                                onClick={() => {
                                                    if (isResolved) return;
                                                    setAssignModalAssignee({
                                                        id: c.user.id,
                                                        role: "Coordinator",
                                                        name: c.user.name,
                                                    });
                                                    setAssignModalData({
                                                        title: "",
                                                        description: "",
                                                        deadline: "",
                                                    });
                                                    setAssignModalOpen(true);
                                                }}
                                                disabled={isResolved}
                                            >
                                                🎯 Assign Task
                                            </button>
                                        </div>

                                        <div className="mt-3 space-y-2">
                                            {coordTasks.length === 0 ? (
                                                <p className="text-purple-700 font-semibold">No tasks for this coordinator.</p>
                                            ) : (
                                                coordTasks.map((task) => {
                                                    const isCompleted = task.status === "Completed";
                                                    const isOverdue = hasDeadlinePassed(task.deadline) && !isCompleted;
                                                    return (
                                                        <div key={task._1d ? task._1d : task._id} className="p-3 bg-pink-50 rounded-lg border-2 border-purple-300">
                                                            <div className="flex justify-between">
                                                                <div>
                                                                    <p className="font-bold text-purple-900">{task.title}</p>
                                                                    <p className="text-xs text-purple-700">
                                                                        📅 Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-purple-700">
                                                                        📋 Status: {isCompleted ? task.status : (isOverdue ? "Incomplete — Overdue" : task.status)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {task.taskProofSubmitted && !isCompleted && (
                                                                <div className="mt-2 flex gap-2">
                                                                    <button
                                                                        className="px-3 py-1 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-md border-2 border-purple-300"
                                                                        onClick={() => approveOrRejectProof(task._id, true)}
                                                                    >
                                                                        ✅ Approve
                                                                    </button>
                                                                    <button
                                                                        className="px-3 py-1 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 shadow-md border-2 border-purple-300"
                                                                        onClick={() => approveOrRejectProof(task._id, false)}
                                                                    >
                                                                        ❌ Reject
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {isCompleted && (
                                                                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold border-2 border-green-400">
                                                                    ✅ Completed / Approved
                                                                </span>
                                                            )}

                                                            {task.taskCompletionProof && (
                                                                <div className="mt-2 text-sm">
                                                                    <p className="text-purple-900">
                                                                        <strong>📸 Proof:</strong> {task.taskCompletionProof}
                                                                    </p>
                                                                    {task.taskProofImages?.length > 0 && (
                                                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                                                            {task.taskProofImages.map((pi, i) => (
                                                                                <img key={i} src={pi} alt={`coord-proof-${i}`} className="w-full h-20 object-cover rounded border-2 border-purple-300" />
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {task.taskUpdates?.length > 0 && (
                                                                <div className="mt-2">
                                                                    <h4 className="font-bold text-purple-900 overflow-hidden">📋 Updates</h4>
                                                                    <ul className="list-disc ml-5">
                                                                        {task.taskUpdates.map((u, idx) => (
                                                                            <li key={idx} className="text-sm text-purple-800">
                                                                                {u.updateText}
                                                                                <div className="text-xs text-purple-600">
                                                                                    — {u.updatedBy?.name || "Unknown"} on {new Date(u.updatedAt).toLocaleString()}
                                                                                </div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <h2 className="text-3xl font-black text-purple-900 mb-4 overflow-hidden">🧭 Tasks Escalated from Workers/Coordinators</h2>

                        {/* Show tasks assigned to supervisors (flatten or use current user's tasks) */}
                        {(issue?.staffsAssigned || []).filter(s => s.role === "Supervisor" && s.user).length === 0 ? (
                            <p className="text-purple-700 font-semibold">No supervisor tasks.</p>
                        ) : (
                            // flatten supervisor tasks
                            (issue?.staffsAssigned || [])
                                .filter(s => s.role === "Supervisor" && Array.isArray(s.tasks))
                                .flatMap(s => s.tasks)
                                .map((task, idx) => {
                                    const isCompleted = task.status === "Completed";
                                    const isOverdue = hasDeadlinePassed(task.deadline) && !isCompleted;
                                    const isDisabled = isResolved || isCompleted;

                                    return (
                                        <div key={task._id || task.id || `sup-task-${idx}`} className="bg-white rounded-lg p-4 mb-4 shadow-md border-2 border-pink-400">
                                            <div className="flex justify-between">
                                                <div>
                                                    <h3 className="font-black text-xl text-purple-900 overflow-hidden">{task.title}</h3>
                                                    <p className="text-sm text-purple-700">{task.description}</p>
                                                    <p className="text-xs text-purple-600 mt-1">
                                                        📅 Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}
                                                    </p>
                                                    <p className="text-xs text-purple-600">
                                                        📋 Status: {isCompleted ? task.status : (isOverdue ? "Incomplete — Overdue" : task.status)}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    {/* Reassign to coordinator */}
                                                    <button
                                                        className={`px-3 py-1 bg-yellow-600 text-white rounded-full font-bold hover:bg-yellow-700 shadow-md border-2 border-purple-300
            ${isDisabled ? "opacity-60 cursor-not-allowed hover:bg-yellow-600" : ""}`}
                                                        onClick={() => {
                                                            if (isDisabled) return;
                                                            setReassignTask(task);
                                                            setReassignAssignee(null);
                                                            setReassignDeadline("");
                                                            setReassignModalOpen(true);
                                                        }}
                                                        disabled={isDisabled}
                                                        aria-disabled={isDisabled}
                                                    >
                                                        🔁 Reassign to Coordinator
                                                    </button>

                                                    {/* Complete it yourself */}
                                                    <button
                                                        className={`px-3 py-1 bg-green-700 text-white rounded-full font-bold hover:bg-green-800 shadow-md border-2 border-purple-300
            ${isDisabled ? "opacity-60 cursor-not-allowed hover:bg-green-700" : ""}`}
                                                        onClick={() => {
                                                            if (isDisabled) return;
                                                            openSuperCompleteModal(task);
                                                        }}
                                                        disabled={isDisabled}
                                                        aria-disabled={isDisabled}
                                                    >
                                                        ✅ Complete it Yourself
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Proof preview + completed proof images */}
                                            {(task.taskCompletionProof || (isCompleted && task.taskProofImages?.length > 0)) && (
                                                <div className="mt-3 bg-pink-50 p-3 rounded-lg border-2 border-purple-300">
                                                    <p className="font-bold text-purple-900">📸 Proof:</p>

                                                    {task.taskCompletionProof && (
                                                        <p className="text-purple-800">{task.taskCompletionProof}</p>
                                                    )}

                                                    {isCompleted && task.taskProofImages?.length > 0 && (
                                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                                            {task.taskProofImages.map((pi, i) => (
                                                                <img
                                                                    key={i}
                                                                    src={pi}
                                                                    alt={`sup-proof-${i}`}
                                                                    className="w-full h-20 object-cover rounded border-2 border-purple-300"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* small status line */}
                                                    <p className="text-xs text-purple-600 mt-2">
                                                        Proof Submitted: {task.taskProofSubmitted ? "Yes" : "No"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                        {/* Resolve Issue Section */}
                        <div className="mt-6 bg-white rounded-xl p-5 shadow-lg border-4 border-purple-500">
                            <h3 className="font-black text-2xl text-purple-900 mb-3 overflow-hidden">🎊 Resolve Issue</h3>
                            <p className="text-sm text-purple-700 mb-4 font-semibold">
                                Previously you could enter a quick summary — now use the new button below to submit a full resolution report with images and ratings for staff.
                            </p>
                            <button
                                className={`w-full px-6 py-3 text-white rounded-full font-black text-lg shadow-lg border-4 transform hover:scale-105 transition-all ${isResolved
                                    ? "bg-gray-400 cursor-not-allowed border-gray-500"
                                    : "bg-green-600 hover:bg-green-700 border-purple-500"
                                    }`}
                                onClick={openResolveModal}
                                disabled={isResolved}
                            >
                                ✅ Submit Issue Resolution Report and Resolve Issue
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------------- MODALS ---------------- */}
                {/* Reassign Modal */}
                <AnimatePresence>
                    {reassignModalOpen && reassignTask && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-purple-900/90 z-50 flex items-center justify-center px-4">
                            <div className="bg-gradient-to-br from-pink-200 to-pink-300 p-6 rounded-2xl w-full max-w-md relative shadow-2xl border-4 border-purple-600">
                                <button className="absolute top-2 right-3 text-3xl font-black text-purple-900" onClick={() => setReassignModalOpen(false)}>&times;</button>
                                <h3 className="text-2xl font-black text-purple-900 mb-3">🔁 Reassign — {reassignTask.title}</h3>

                                <label className="block text-sm font-bold text-purple-900 mb-1">Select Coordinator</label>
                                <select
                                    value={reassignAssignee || ""}
                                    onChange={(e) => setReassignAssignee(e.target.value)}
                                    className="w-full border-4 border-purple-500 p-3 rounded-lg mb-3 text-purple-900 font-semibold"
                                >
                                    <option value="">-- Select coordinator --</option>
                                    {(coordinatorsAssigned || []).map((c) => (
                                        <option key={c.user._id || c.user.id || c.user.email} value={c.user._id || c.user.id || c.user.email}>
                                            {c.user.name || c.user.email}
                                        </option>
                                    ))}
                                </select>

                                <label className="block text-sm font-bold text-purple-900 mb-1">New deadline</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={reassignDeadline}
                                    onChange={(e) => setReassignDeadline(e.target.value)}
                                    className="w-full border-4 border-purple-500 p-3 rounded-lg mb-4 text-purple-900 font-semibold"
                                />

                                <div className="flex gap-2 justify-end">
                                    <button className="px-4 py-2 bg-gray-300 text-purple-900 rounded-full" onClick={() => setReassignModalOpen(false)}>Cancel</button>
                                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-full" onClick={submitReassignToCoordinator} disabled={isReassigning}>
                                        {isReassigning ? "Reassigning..." : "Reassign"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* Complete-as-Supervisor Modal */}
                <AnimatePresence>
                    {superCompleteModalOpen && superCompleteTask && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-purple-900/90 z-50 flex items-center justify-center px-4">
                            <div className="bg-gradient-to-br from-pink-200 to-pink-300 p-6 rounded-2xl w-full max-w-md relative shadow-2xl border-4 border-purple-600">
                                <button className="absolute top-2 right-3 text-3xl font-black text-purple-900" onClick={() => setSuperCompleteModalOpen(false)}>&times;</button>
                                <h3 className="text-2xl font-black text-purple-900 mb-3">✅ Complete — {superCompleteTask.title}</h3>

                                <textarea
                                    rows={3}
                                    value={superCompleteText}
                                    onChange={(e) => setSuperCompleteText(e.target.value)}
                                    className="w-full border-4 border-purple-500 p-3 rounded-lg mb-3 text-purple-900 font-semibold"
                                    placeholder="Describe completion details (required)"
                                />

                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setSuperCompleteFiles(Array.from(e.target.files))}
                                    className="mb-3 w-full"
                                />

                                {superCompleteUploadProgress.length > 0 && (
                                    <div className="mb-3 bg-white rounded-lg p-2 border-2 border-purple-400">
                                        <p className="text-sm text-purple-700 font-bold">Upload progress:</p>
                                        {superCompleteUploadProgress.map((p, i) => (
                                            <div key={i} className="text-xs text-purple-800">File {i + 1}: {p}%</div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 justify-end">
                                    <button className="px-4 py-2 bg-gray-300 text-purple-900 rounded-full" onClick={() => setSuperCompleteModalOpen(false)}>Cancel</button>
                                    <button className="px-4 py-2 bg-green-600 text-white rounded-full" onClick={submitCompleteBySupervisor} disabled={isCompletingAsSupervisor}>
                                        {isCompletingAsSupervisor ? "Submitting..." : "Submit & Complete"}
                                    </button>
                                </div>

                                <p className="text-xs text-purple-700 mt-3 font-semibold">This will mark the task as Completed immediately (no approval required).</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* Update Modal */}
                <AnimatePresence>
                    {updateModalOpen && updateModalTask && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-purple-900/90 z-50 flex items-center justify-center px-4"
                        >
                            <div className="bg-gradient-to-br from-pink-200 to-pink-300 p-6 rounded-2xl w-full max-w-md relative shadow-2xl border-4 border-purple-600">
                                <button
                                    className="absolute top-2 right-3 text-3xl font-black text-purple-900 hover:text-purple-700"
                                    onClick={() => setUpdateModalOpen(false)}
                                >
                                    &times;
                                </button>
                                <h3 className="text-2xl font-black text-purple-900 mb-3 overflow-hidden">📝 Add Update — {updateModalTask.title}</h3>
                                <textarea
                                    rows={4}
                                    value={updateText}
                                    onChange={(e) => setUpdateText(e.target.value)}
                                    className="w-full border-4 border-purple-500 p-3 rounded-lg mb-4 text-purple-900 font-semibold focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
                                    placeholder="Describe progress..."
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        className="px-4 py-2 bg-gray-300 text-purple-900 rounded-full font-bold border-2 border-purple-500 hover:bg-gray-400"
                                        onClick={() => setUpdateModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-purple-700 text-pink-100 rounded-full font-bold border-2 border-pink-400 hover:bg-purple-800 shadow-md"
                                        onClick={submitTaskUpdate}
                                    >
                                        Submit Update
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Proof Modal */}
                <AnimatePresence>
                    {proofModalOpen && proofModalTask && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-purple-900/90 z-50 flex items-center justify-center px-4"
                        >
                            <div className="bg-gradient-to-br from-pink-200 to-pink-300 p-6 rounded-2xl w-full max-w-md relative shadow-2xl border-4 border-purple-600">
                                <button
                                    className="absolute top-2 right-3 text-3xl font-black text-purple-900 hover:text-purple-700"
                                    onClick={() => setProofModalOpen(false)}
                                >
                                    &times;
                                </button>
                                <h3 className="text-2xl font-black text-purple-900 mb-3 overflow-hidden">📸 Submit Proof — {proofModalTask.title}</h3>
                                <textarea
                                    rows={3}
                                    value={proofText}
                                    onChange={(e) => setProofText(e.target.value)}
                                    className="w-full border-4 border-purple-500 p-3 rounded-lg mb-3 text-purple-900 font-semibold focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
                                    placeholder="Description of proof (required)"
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setProofFiles(Array.from(e.target.files))}
                                    className="mb-3 w-full text-purple-900 font-semibold"
                                />
                                {proofUploadProgress.length > 0 && (
                                    <div className="mb-3 bg-white rounded-lg p-2 border-2 border-purple-400">
                                        <p className="text-sm text-purple-700 font-bold">Upload progress:</p>
                                        {proofUploadProgress.map((p, i) => (
                                            <div key={i} className="text-xs text-purple-800">File {i + 1}: {p}%</div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end">
                                    <button
                                        className="px-4 py-2 bg-gray-300 text-purple-900 rounded-full font-bold border-2 border-purple-500 hover:bg-gray-400"
                                        onClick={() => setProofModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-green-600 text-white rounded-full font-bold border-2 border-purple-400 hover:bg-green-700 shadow-md"
                                        onClick={submitTaskProof}
                                    >
                                        Submit Proof
                                    </button>
                                </div>
                                <p className="text-xs text-purple-700 mt-3 font-semibold">
                                    Images are uploaded to Firebase and URLs are sent to the server.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Assign Modal */}
                <AnimatePresence>
                    {assignModalOpen && assignModalAssignee && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-purple-900/90 z-50 flex items-center justify-center px-4"
                        >
                            <div className="bg-gradient-to-br from-pink-200 to-pink-300 p-6 rounded-2xl w-full max-w-md relative shadow-2xl border-4 border-purple-600">
                                <button
                                    className="absolute top-2 right-3 text-3xl font-black text-purple-900 hover:text-purple-700"
                                    onClick={() => setAssignModalOpen(false)}
                                >
                                    &times;
                                </button>
                                <h3 className="text-2xl font-black text-purple-900 mb-3 overflow-hidden">
                                    🎯 Assign Task to {assignModalAssignee.name} ({assignModalAssignee.role})
                                </h3>
                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={assignModalData.title}
                                    onChange={(e) =>
                                        setAssignModalData({
                                            ...assignModalData,
                                            title: e.target.value,
                                        })
                                    }
                                    className="w-full border-4 border-purple-500 p-3 rounded-lg mb-3 text-purple-900 font-semibold focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
                                />
                                <textarea
                                    placeholder="Description"
                                    value={assignModalData.description}
                                    onChange={(e) =>
                                        setAssignModalData({
                                            ...assignModalData,
                                            description: e.target.value,
                                        })
                                    }
                                    className="w-full border-4 border-purple-500 p-3 rounded-lg mb-3 text-purple-900 font-semibold focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
                                />
                                <input
                                    type="date"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={assignModalData.deadline}
                                    onChange={(e) =>
                                        setAssignModalData({
                                            ...assignModalData,
                                            deadline: e.target.value,
                                        })
                                    }
                                    className="w-full border-4 border-purple-500 p-3 rounded-lg mb-4 text-purple-900 font-semibold focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        className="px-4 py-2 bg-gray-300 text-purple-900 rounded-full font-bold border-2 border-purple-500 hover:bg-gray-400"
                                        onClick={() => setAssignModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-green-600 text-white rounded-full font-bold border-2 border-purple-400 hover:bg-green-700 shadow-md"
                                        onClick={assignTaskToAssignee}
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Resolve Modal (Supervisor) */}
                <AnimatePresence>
                    {resolveModalOpen && (
                        <motion.div
                            key="resolve-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-purple-900/95 z-50 overflow-y-auto"
                            style={{ WebkitOverflowScrolling: "touch" }}
                        >
                            <div className="min-h-screen px-4 py-8 flex items-center justify-center">
                                <div
                                    className="bg-gradient-to-br from-pink-200 to-pink-300 p-6 rounded-2xl w-full max-w-3xl relative shadow-2xl border-4 border-purple-600"
                                    style={{
                                        maxHeight: "calc(100vh - 4rem)",
                                        overflowY: "auto",
                                        WebkitOverflowScrolling: "touch",
                                        overscrollBehavior: "contain",
                                    }}
                                >
                                    <button
                                        className="absolute top-2 right-3 text-3xl font-black text-purple-900 hover:text-purple-700"
                                        onClick={() => setResolveModalOpen(false)}
                                    >
                                        &times;
                                    </button>

                                    <h3 className="text-2xl font-black text-purple-900 mb-4 overflow-hidden">
                                        🎊 Submit Issue Resolution Report & Resolve Issue
                                    </h3>

                                    <label className="block text-sm font-black text-purple-900 mb-2">Summary of resolution (required)</label>
                                    <textarea
                                        rows={4}
                                        value={resolveSummary}
                                        onChange={(e) => setResolveSummary(e.target.value)}
                                        className="w-full border-4 border-purple-500 p-3 rounded-lg mb-4 text-purple-900 font-semibold focus:border-pink-500 focus:ring-4 focus:ring-pink-300"
                                        placeholder="Describe what was done, outcomes, next steps..."
                                    />

                                    <label className="block text-sm font-black text-purple-900 mb-2">
                                        Resolution images / proof (optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => setResolveFiles(Array.from(e.target.files))}
                                        className="mb-4 w-full text-purple-900 font-semibold"
                                    />
                                    {resolveUploadProgress.length > 0 && (
                                        <div className="mb-4 bg-white rounded-lg p-2 border-2 border-purple-400">
                                            <p className="text-sm text-purple-700 font-bold">Upload progress:</p>
                                            {resolveUploadProgress.map((p, i) => (
                                                <div key={i} className="text-xs text-purple-800">File {i + 1}: {p}%</div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <h4 className="font-black text-xl text-purple-900 mb-3 overflow-hidden">⭐ Rate staff performance</h4>
                                        <p className="text-xs text-purple-700 mb-3 font-semibold">
                                            Provide a rating (1-5) and optional comment for each worker/coordinator involved.
                                        </p>

                                        <div className="space-y-3">
                                            {(issue?.staffsAssigned || [])
                                                .filter((s) => {
                                                    if (!s.user) return false;
                                                    const u = s.user || {};
                                                    return !(
                                                        (u._id && String(u._id) === String(user._id)) ||
                                                        (u.id && String(u.id) === String(user._id)) ||
                                                        (u.email && u.email === user.email)
                                                    );
                                                })
                                                .map((s) => {
                                                    const uid =
                                                        s.user._id ||
                                                        s.user.id ||
                                                        s.user?.email ||
                                                        String(s.user?.name) ||
                                                        String(Math.random());
                                                    const r = resolveRatings[uid] || {
                                                        rating: 5,
                                                        comment: "",
                                                        role: s.role,
                                                        name: s.user.name || s.user.email,
                                                        userId: uid,
                                                    };

                                                    if (!resolveRatings[uid]) {
                                                        Promise.resolve().then(() => {
                                                            setResolveRatings((prev) => {
                                                                if (prev && prev[uid]) return prev;
                                                                return { ...prev, [uid]: r };
                                                            });
                                                        });
                                                    }

                                                    return (
                                                        <div key={uid} className="p-4 bg-white rounded-lg shadow-md border-2 border-pink-400">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-black text-purple-900">
                                                                        {r.name} <span className="text-xs text-purple-600">({s.role})</span>
                                                                    </p>
                                                                    <p className="text-xs text-purple-600">{s.user.email}</p>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    <label className="text-sm font-bold text-purple-900">Rating</label>
                                                                    <select
                                                                        value={r.rating}
                                                                        onChange={(e) =>
                                                                            setResolveRatings((prev) => ({
                                                                                ...prev,
                                                                                [uid]: { ...r, rating: Number(e.target.value) },
                                                                            }))
                                                                        }
                                                                        className="border-2 border-purple-500 p-2 rounded-lg text-purple-900 font-bold focus:border-pink-500 focus:ring-2 focus:ring-pink-300"
                                                                    >
                                                                        <option value={1}>1</option>
                                                                        <option value={2}>2</option>
                                                                        <option value={3}>3</option>
                                                                        <option value={4}>4</option>
                                                                        <option value={5}>5</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <textarea
                                                                rows={2}
                                                                placeholder="Optional comment"
                                                                value={r.comment}
                                                                onChange={(e) =>
                                                                    setResolveRatings((prev) => ({
                                                                        ...prev,
                                                                        [uid]: { ...r, comment: e.target.value },
                                                                    }))
                                                                }
                                                                className="w-full border-2 border-purple-500 p-2 rounded-lg mt-3 text-purple-900 font-semibold focus:border-pink-500 focus:ring-2 focus:ring-pink-300"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end mt-6">
                                        <button
                                            className="px-4 py-2 bg-gray-300 text-purple-900 rounded-full font-bold border-2 border-purple-500 hover:bg-gray-400"
                                            onClick={() => setResolveModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className={`px-4 py-2 bg-green-600 text-white rounded-full font-bold border-2 border-purple-400 hover:bg-green-700 shadow-md ${isResolving ? "opacity-60 cursor-not-allowed" : ""
                                                }`}
                                            onClick={submitResolution}
                                            disabled={isResolving}
                                        >
                                            {isResolving ? "Submitting..." : "✅ Submit & Resolve"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

}
