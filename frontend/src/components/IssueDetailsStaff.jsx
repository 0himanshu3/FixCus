// IssueDetailsStaff.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    // Update modal
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [updateModalTask, setUpdateModalTask] = useState(null);
    const [updateText, setUpdateText] = useState("");

    // Proof modal
    const [proofModalOpen, setProofModalOpen] = useState(false);
    const [proofModalTask, setProofModalTask] = useState(null);
    const [proofText, setProofText] = useState("");
    const [proofFiles, setProofFiles] = useState([]);
    const [proofUploadProgress, setProofUploadProgress] = useState([]);

    // Assign modal
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignModalAssignee, setAssignModalAssignee] = useState(null);
    const [assignModalData, setAssignModalData] = useState({ title: "", description: "", deadline: "" });

    const [issueSummary, setIssueSummary] = useState("");

    // Supervisor resolve modal states
    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [resolveSummary, setResolveSummary] = useState("");
    const [resolveFiles, setResolveFiles] = useState([]);
    const [resolveUploadProgress, setResolveUploadProgress] = useState([]);
    // ratings: { userId: { rating: number, comment: string, role: string, name: string } }
    const [resolveRatings, setResolveRatings] = useState({});
    const [isResolving, setIsResolving] = useState(false);

    // Helper: treat a date string as end-of-day and check if it's in the past
    const hasDeadlinePassed = (deadline) => {
        if (!deadline) return false;
        try {
            const dl = new Date(deadline);
            // If deadline is a date-only string (yyyy-mm-dd) set it to end of that day
            dl.setHours(23, 59, 59, 999);
            return dl < new Date();
        } catch (e) {
            return false;
        }
    };

    // Firebase upload helper (now accepts an optional progress setter)
    const uploadFilesToFirebase = async (files, setProgress = setProofUploadProgress) => {
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
                            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                            progressArr[idx] = pct;
                            setProgress([...progressArr]);
                        },
                        (err) => reject(err),
                        async () => {
                            try {
                                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
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
    };

    // Fetch issue and derive user role & tasks (expects staffsAssigned[].user and staffsAssigned[].tasks to be included in issue response)
    const fetchIssue = async () => {
        if (!slug || !user) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/issues/${slug}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch issue");
            const data = await res.json();
            const issueData = data.issue;
            setIssue(issueData);

            // find assigned staff entry for current user
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
                setUserTasks(Array.isArray(assignedStaff.tasks) ? assignedStaff.tasks : []);
            } else {
                setAssignedRole(null);
                setUserTasks([]);
            }

            // flatten tasks from all staff entries for coordinator/supervisor views
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
        fetchIssue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, user]);

    const refreshAfterAction = async () => {
        await fetchIssue();
    };

    // Submit update (worker/coordinator)
    const submitTaskUpdate = async () => {
        if (!updateModalTask || !updateText.trim()) {
            alert("Please enter update text.");
            return;
        }

        // Guard: if task already approved/completed do nothing (UI shouldn't allow this path, but guard anyway)
        if (updateModalTask.status === "Completed") {
            alert("Task is already completed.");
            setUpdateModalOpen(false);
            return;
        }

        // Guard: prevent updates if deadline has passed
        if (hasDeadlinePassed(updateModalTask.deadline) && updateModalTask.status !== "Completed") {
            alert("Cannot submit update — task deadline has passed and is marked overdue.");
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
    };

    // Submit proof (worker/coordinator)
    const submitTaskProof = async () => {
        if (!proofModalTask) return alert("No task selected");
        if (!proofText.trim()) return alert("Please enter proof description");
        if (!proofFiles || proofFiles.length === 0) return alert("Attach at least one image");

        // Guard if already completed
        if (proofModalTask.status === "Completed") {
            alert("Task already completed.");
            setProofModalOpen(false);
            return;
        }

        // Guard: prevent proof submission if deadline passed
        if (hasDeadlinePassed(proofModalTask.deadline) && proofModalTask.status !== "Completed") {
            alert("Cannot submit proof — task deadline has passed and is marked overdue.");
            setProofModalOpen(false);
            return;
        }

        try {
            const urls = await uploadFilesToFirebase(proofFiles, setProofUploadProgress);

            const res = await fetch(`/api/v1/issues/submitProof/${proofModalTask._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    proofText,
                    proofImages: urls,
                }),
            });
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
    };

    // Approve or reject proof (coordinator/supervisor)
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

    const [isAssigning, setIsAssigning] = useState(false);
    // Assign task to a specific assignee (modal per-person)
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
    };


    // Supervisor resolve (legacy simple resolve preserved but not used for supervisor UI anymore)
    const resolveIssue = async () => {
        if (!issueSummary.trim()) return alert("Please add a summary");
        try {
            const res = await fetch(`/api/v1/issues/resolve/${issue._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ summary: issueSummary }),
            });
            if (!res.ok) throw new Error("Resolve failed");
            alert("Issue resolved");
            setIssueSummary("");
            await refreshAfterAction();
        } catch (err) {
            console.error(err);
            alert("Error resolving issue");
        }
    };

    // New: open supervisor resolution modal and initialise ratings
    const openResolveModal = () => {
        const ratingsInit = {};

        // build list skipping the current user (supervisor)
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
            const uid = s.user._id || s.user.id || s.user?.email || `${Math.random()}`;
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
        if (!resolveSummary.trim()) return alert("Please add a summary of the resolution.");
        if (!issue) return alert("Issue not loaded");

        try {
            setIsResolving(true);
            const urls = await uploadFilesToFirebase(resolveFiles, setResolveUploadProgress);

            const ratingsArr = Object.values(resolveRatings).map((r) => ({ userId: r.userId, rating: r.rating, comment: r.comment, role: r.role, name: r.name }));

            const res = await fetch(`/api/v1/issues/resolve/${issue._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ summary: resolveSummary, resolutionImages: urls, ratings: ratingsArr }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error("Resolve failed: " + txt);
            }

            alert("Issue resolved and report submitted.");
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
    };
    // prevent background scroll when resolve modal is open
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

    const workersAssigned = (issue?.staffsAssigned || []).filter((s) => s.role === "Worker" && s.user);
    const coordinatorsAssigned = (issue?.staffsAssigned || []).filter((s) => s.role === "Coordinator" && s.user);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Issue not found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <h1 className="text-3xl font-bold">{issue.title}</h1>
            <div className="flex flex-wrap gap-3">
                {issue.category && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{issue.category}</span>}
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Priority: {issue.priority}</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Status: {issue.status}</span>
            </div>
            <p className="text-gray-600"><strong>Location:</strong> {issue.issueLocation}</p>
            <p className="text-gray-600"><strong>Published:</strong> {new Date(issue.issuePublishDate).toLocaleDateString()}</p>

            {assignedRole && <p className="text-green-700 font-semibold">You are assigned as {assignedRole}</p>}

            {/* Images */}
            {issue.images?.length > 0 && (
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Images</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {issue.images.slice(0, 6).map((img, idx) => (
                            <img key={idx} src={img} alt={`Issue ${idx}`} className="w-full h-32 object-cover rounded-md cursor-pointer hover:scale-105 transition-transform" onClick={() => { setCurrentImageIdx(idx); setShowImageSlider(true); }} />
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showImageSlider && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                        <button className="absolute top-5 right-5 text-white text-3xl" onClick={() => setShowImageSlider(false)}>&times;</button>
                        <div className="relative w-4/5 max-w-3xl">
                            <img src={issue.images[currentImageIdx]} alt={`Slide ${currentImageIdx}`} className="w-full h-96 object-contain rounded-md" />
                            <button className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-3xl" onClick={() => setCurrentImageIdx((p) => (p - 1 + issue.images.length) % issue.images.length)}>&#8592;</button>
                            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-3xl" onClick={() => setCurrentImageIdx((p) => (p + 1) % issue.images.length)}>&#8594;</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Videos */}
            {issue.videos?.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Videos</h2>
                    {issue.videos.map((vid, idx) => <video key={idx} src={vid} controls className="w-full h-64 rounded-md" />)}
                </div>
            )}

            {/* Upvotes/Downvotes/Comments (view-only) */}
            <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-green-500 text-white rounded-md">Upvotes: {issue.upvotes?.length || 0}</div>
                    <div className="px-4 py-2 bg-red-500 text-white rounded-md">Downvotes: {issue.downvotes?.length || 0}</div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Comments</h2>
                    {issue.comments?.length > 0 ? issue.comments.map((c) => (
                        <div key={c._id} className="border p-2 rounded-md bg-gray-50">
                            <p><strong>{c.user?.name}</strong>: {c.content}</p>
                            <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</p>
                        </div>
                    )) : <p className="text-gray-500">No comments yet.</p>}
                </div>
            </div>

            {/* ---------- Your tasks (Worker / Coordinator) ---------- */}
            {(assignedRole === "Worker" || assignedRole === "Coordinator") && (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold">Your Assigned Tasks</h2>

                    {userTasks.length === 0 ? (
                        <p className="text-gray-500">No tasks assigned to you for this issue.</p>
                    ) : (
                        userTasks.map((task) => {
                            const proofSubmitted = Boolean(task.taskProofSubmitted);
                            const isCompleted = task.status === "Completed";
                            const isOverdue = hasDeadlinePassed(task.deadline) && !isCompleted;

                            return (
                                <div key={task._id} className="border p-4 rounded-md mb-4">
                                    <div className="flex justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg">{task.title}</h3>
                                            <p className="text-sm text-gray-600">{task.description}</p>
                                            <p className="text-xs text-gray-500">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}</p>
                                            <p className="text-xs text-gray-500">
                                                Status: {isCompleted ? task.status : (isOverdue ? "Incomplete — Overdue" : task.status)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Assigned By: {task.assignedBy?.name || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        {/* Buttons are only shown when neither proof submitted nor completed, and NOT overdue */}
                                        {!proofSubmitted && !isCompleted ? (
                                            isOverdue ? (
                                                <div>
                                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded">Deadline passed — actions disabled</span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        className="px-3 py-1 bg-blue-500 text-white rounded-md"
                                                        onClick={() => { setUpdateModalTask(task); setUpdateText(""); setUpdateModalOpen(true); }}
                                                    >
                                                        Give Task Update
                                                    </button>

                                                    <button
                                                        className="px-3 py-1 bg-green-500 text-white rounded-md"
                                                        onClick={() => { setProofModalTask(task); setProofText(""); setProofFiles([]); setProofModalOpen(true); }}
                                                    >
                                                        Submit Task Completion Proof
                                                    </button>
                                                </div>
                                            )
                                        ) : isCompleted ? (
                                            <div>
                                                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">Completed / Approved</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Proof submitted — awaiting review</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Proof preview */}
                                    {task.taskCompletionProof && (
                                        <div className="mt-3 bg-gray-50 p-2 rounded">
                                            <p className="font-semibold">Proof:</p>
                                            <p>{task.taskCompletionProof}</p>
                                            {task.taskProofImages?.length > 0 && (
                                                <div className="mt-2 grid grid-cols-3 gap-2">
                                                    {task.taskProofImages.map((pi, i) => <img key={i} src={pi} alt={`proof-${i}`} className="w-full h-20 object-cover rounded" />)}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">Proof Submitted: {task.taskProofSubmitted ? "Yes" : "No"}</p>
                                        </div>
                                    )}

                                    {/* Updates */}
                                    {task.taskUpdates?.length > 0 && (
                                        <div className="mt-3">
                                            <h4 className="font-semibold">Updates</h4>
                                            <ul className="list-disc ml-5">
                                                {(task.taskUpdates || []).map((u, idx) => (
                                                    <li key={idx} className="text-sm text-gray-700">
                                                        {u.updateText}
                                                        <div className="text-xs text-gray-500">— {u.updatedBy?.name || "Unknown"} on {new Date(u.updatedAt).toLocaleString()}</div>
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

            {/* ---------- Coordinator: workers & tasks (approve/reject while not completed) ---------- */}
            {assignedRole === "Coordinator" && (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold">Workers Assigned to This Issue</h2>

                    {workersAssigned.length === 0 ? <p className="text-gray-500">No workers assigned.</p> :
                        workersAssigned.map((w) => {
                            const workerTasks = Array.isArray(w.tasks) ? w.tasks : [];
                            return (
                                <div key={w.user._id} className="border p-4 rounded-md mb-4">
                                    <div className="flex justify-between">
                                        <div>
                                            <h3 className="font-semibold">{w.user.name}</h3>
                                            <p className="text-xs text-gray-500">{w.user.email}</p>
                                        </div>
                                        <div>
                                            <button
                                                className={`px-3 py-1 rounded-md text-white ${isAssigning || assignModalOpen ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"
                                                    }`}
                                                onClick={() => {
                                                    if (isAssigning || assignModalOpen) return; // prevent multiple clicks
                                                    setAssignModalAssignee({ id: w.user.id, role: "Worker", name: w.user.name });
                                                    setAssignModalData({ title: "", description: "", deadline: "" });
                                                    setAssignModalOpen(true);
                                                }}
                                                disabled={isAssigning || assignModalOpen}
                                            >
                                                Assign Task
                                            </button>

                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        {workerTasks.length === 0 ? <p className="text-gray-500">No tasks for this worker.</p> :
                                            workerTasks.map((task) => {
                                                const isCompleted = task.status === "Completed";
                                                const isOverdue = hasDeadlinePassed(task.deadline) && !isCompleted;
                                                return (
                                                    <div key={task._id} className="p-2 bg-gray-50 rounded">
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <p className="font-semibold">{task.title}</p>
                                                                <p className="text-xs text-gray-600">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs">Status: {isCompleted ? task.status : (isOverdue ? "Incomplete — Overdue" : task.status)}</p>
                                                            </div>
                                                        </div>

                                                        {/* only show approve/reject while proof submitted and task not completed */}
                                                        {task.taskProofSubmitted && !isCompleted && (
                                                            <div className="mt-2 flex gap-2">
                                                                <button className="px-3 py-1 bg-green-600 text-white rounded-md" onClick={() => approveOrRejectProof(task._id, true)}>Approve</button>
                                                                <button className="px-3 py-1 bg-red-600 text-white rounded-md" onClick={() => approveOrRejectProof(task._id, false)}>Reject</button>
                                                            </div>
                                                        )}

                                                        {isCompleted && (
                                                            <div className="mt-2">
                                                                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">Completed / Approved</span>
                                                            </div>
                                                        )}

                                                        {task.taskCompletionProof && (
                                                            <div className="mt-2 text-sm">
                                                                <p><strong>Proof:</strong> {task.taskCompletionProof}</p>
                                                                {task.taskProofImages?.length > 0 && (
                                                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                                                        {task.taskProofImages.map((pi, i) => <img key={i} src={pi} alt={`task-proof-${i}`} className="w-full h-20 object-cover rounded" />)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {task.taskUpdates?.length > 0 && (
                                                            <div className="mt-2">
                                                                <h4 className="font-semibold">Updates</h4>
                                                                <ul className="list-disc ml-5">
                                                                    {task.taskUpdates.map((u, idx) => (
                                                                        <li key={idx} className="text-sm text-gray-700">{u.updateText} <div className="text-xs text-gray-500">— {u.updatedBy?.name || "Unknown"} on {new Date(u.updatedAt).toLocaleString()}</div></li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            )}

            {/* ---------- Supervisor: coordinators & tasks (approve/reject while not completed) ---------- */}
            {assignedRole === "Supervisor" && (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold">Coordinators Assigned to This Issue</h2>

                    {coordinatorsAssigned.length === 0 ? <p className="text-gray-500">No coordinators assigned.</p> :
                        coordinatorsAssigned.map((c) => {
                            const coordTasks = Array.isArray(c.tasks) ? c.tasks : [];
                            return (
                                <div key={c.user._id} className="border p-4 rounded-md mb-4">
                                    <div className="flex justify-between">
                                        <div>
                                            <h3 className="font-semibold">{c.user.name}</h3>
                                            <p className="text-xs text-gray-500">{c.user.email}</p>
                                        </div>
                                        <div>
                                            <button className="px-3 py-1 bg-blue-500 text-white rounded-md" onClick={() => { setAssignModalAssignee({ id: c.user.id, role: "Coordinator", name: c.user.name }); setAssignModalData({ title: "", description: "", deadline: "" }); setAssignModalOpen(true); }}>
                                                Assign Task
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        {coordTasks.length === 0 ? <p className="text-gray-500">No tasks for this coordinator.</p> :
                                            coordTasks.map((task) => {
                                                const isCompleted = task.status === "Completed";
                                                const isOverdue = hasDeadlinePassed(task.deadline) && !isCompleted;
                                                return (
                                                    <div key={task._1d ? task._1d : task._id} className="p-2 bg-gray-50 rounded mb-2">
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <p className="font-semibold">{task.title}</p>
                                                                <p className="text-xs text-gray-600">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs">Status: {isCompleted ? task.status : (isOverdue ? "Incomplete — Overdue" : task.status)}</p>
                                                            </div>
                                                        </div>

                                                        {task.taskProofSubmitted && !isCompleted && (
                                                            <div className="mt-2 flex gap-2">
                                                                <button className="px-3 py-1 bg-green-600 text-white rounded-md" onClick={() => approveOrRejectProof(task._id, true)}>Approve</button>
                                                                <button className="px-3 py-1 bg-red-600 text-white rounded-md" onClick={() => approveOrRejectProof(task._id, false)}>Reject</button>
                                                            </div>
                                                        )}

                                                        {isCompleted && (
                                                            <div className="mt-2">
                                                                <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">Completed / Approved</span>
                                                            </div>
                                                        )}

                                                        {task.taskCompletionProof && (
                                                            <div className="mt-2 text-sm">
                                                                <p><strong>Proof:</strong> {task.taskCompletionProof}</p>
                                                                {task.taskProofImages?.length > 0 && (
                                                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                                                        {task.taskProofImages.map((pi, i) => <img key={i} src={pi} alt={`coord-proof-${i}`} className="w-full h-20 object-cover rounded" />)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {task.taskUpdates?.length > 0 && (
                                                            <div className="mt-2">
                                                                <h4 className="font-semibold">Updates</h4>
                                                                <ul className="list-disc ml-5">
                                                                    {task.taskUpdates.map((u, idx) => (
                                                                        <li key={idx} className="text-sm text-gray-700">{u.updateText} <div className="text-xs text-gray-500">— {u.updatedBy?.name || "Unknown"} on {new Date(u.updatedAt).toLocaleString()}</div></li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            );
                        })
                    }

                    <div className="mt-6 border p-4 rounded-md">
                        <h3 className="font-semibold mb-2">Resolve Issue</h3>
                        <p className="text-sm text-gray-600 mb-3">Previously you could enter a quick summary — now use the new button below to submit a full resolution report with images and ratings for staff.</p>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 bg-green-500 text-white rounded-md" onClick={openResolveModal}>Submit Issue Resolution Report and Resolve Issue</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------------- MODALS ---------------- */}

            {/* Update Modal */}
            <AnimatePresence>
                {updateModalOpen && updateModalTask && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-md w-96 relative">
                            <button className="absolute top-2 right-3 text-xl font-bold" onClick={() => setUpdateModalOpen(false)}>&times;</button>
                            <h3 className="text-lg font-semibold mb-2">Add Update — {updateModalTask.title}</h3>
                            <textarea rows={4} value={updateText} onChange={(e) => setUpdateText(e.target.value)} className="w-full border p-2 rounded-md mb-3" placeholder="Describe progress..."></textarea>
                            <div className="flex gap-2 justify-end">
                                <button className="px-3 py-1 bg-gray-300 rounded-md" onClick={() => setUpdateModalOpen(false)}>Cancel</button>
                                <button className="px-3 py-1 bg-blue-600 text-white rounded-md" onClick={submitTaskUpdate}>Submit Update</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Proof Modal */}
            <AnimatePresence>
                {proofModalOpen && proofModalTask && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-md w-96 relative">
                            <button className="absolute top-2 right-3 text-xl font-bold" onClick={() => setProofModalOpen(false)}>&times;</button>
                            <h3 className="text-lg font-semibold mb-2">Submit Proof — {proofModalTask.title}</h3>
                            <textarea rows={3} value={proofText} onChange={(e) => setProofText(e.target.value)} className="w-full border p-2 rounded-md mb-2" placeholder="Description of proof (required)"></textarea>
                            <input type="file" accept="image/*" multiple onChange={(e) => setProofFiles(Array.from(e.target.files))} className="mb-3" />
                            {proofUploadProgress.length > 0 && (
                                <div className="mb-2">
                                    <p className="text-sm text-gray-600">Upload progress:</p>
                                    {proofUploadProgress.map((p, i) => <div key={i} className="text-xs text-gray-700">File {i + 1}: {p}%</div>)}
                                </div>
                            )}
                            <div className="flex gap-2 justify-end">
                                <button className="px-3 py-1 bg-gray-300 rounded-md" onClick={() => setProofModalOpen(false)}>Cancel</button>
                                <button className="px-3 py-1 bg-green-600 text-white rounded-md" onClick={submitTaskProof}>Submit Proof</button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Images are uploaded to Firebase and URLs are sent to the server.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Assign Modal */}
            <AnimatePresence>
                {assignModalOpen && assignModalAssignee && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-md w-96 relative">
                            <button className="absolute top-2 right-3 text-xl font-bold" onClick={() => setAssignModalOpen(false)}>&times;</button>
                            <h3 className="text-lg font-semibold mb-2">Assign Task to {assignModalAssignee.name} ({assignModalAssignee.role})</h3>
                            <input type="text" placeholder="Title" value={assignModalData.title} onChange={(e) => setAssignModalData({ ...assignModalData, title: e.target.value })} className="w-full border p-2 rounded-md mb-2" />
                            <textarea placeholder="Description" value={assignModalData.description} onChange={(e) => setAssignModalData({ ...assignModalData, description: e.target.value })} className="w-full border p-2 rounded-md mb-2"></textarea>
                            <input type="date" min={new Date().toISOString().split("T")[0]} value={assignModalData.deadline} onChange={(e) => setAssignModalData({ ...assignModalData, deadline: e.target.value })} className="w-full border p-2 rounded-md mb-3" />
                            <div className="flex gap-2 justify-end">
                                <button className="px-3 py-1 bg-gray-300 rounded-md" onClick={() => setAssignModalOpen(false)}>Cancel</button>
                                <button className="px-3 py-1 bg-green-600 text-white rounded-md" onClick={assignTaskToAssignee}>Assign</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Resolve Modal (Supervisor) */}
           {/* Resolve Modal (Supervisor) */}
<AnimatePresence>
  {resolveModalOpen && (
  <motion.div
    key="resolve-modal"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 z-50 overflow-y-auto" // Added overflow-y-auto here
    style={{ WebkitOverflowScrolling: "touch" }}
  >
    <div className="min-h-screen px-4 py-8 flex items-center justify-center"> {/* Wrapper for centering */}
      <div
        className="bg-white p-6 rounded-md w-full max-w-3xl relative"
        style={{
          maxHeight: "calc(100vh - 4rem)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <button
          className="absolute top-2 right-3 text-xl font-bold"
          onClick={() => setResolveModalOpen(false)}
        >
          &times;
        </button>

        <h3 className="text-lg font-semibold mb-2">Submit Issue Resolution Report & Resolve Issue</h3>

        <label className="block text-sm font-medium mb-1">Summary of resolution (required)</label>
        <textarea
          rows={4}
          value={resolveSummary}
          onChange={(e) => setResolveSummary(e.target.value)}
          className="w-full border p-2 rounded-md mb-3"
          placeholder="Describe what was done, outcomes, next steps..."
        />

        <label className="block text-sm font-medium mb-1">Resolution images / proof (optional)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setResolveFiles(Array.from(e.target.files))}
          className="mb-3"
        />
        {resolveUploadProgress.length > 0 && (
          <div className="mb-2">
            <p className="text-sm text-gray-600">Upload progress:</p>
            {resolveUploadProgress.map((p, i) => (
              <div key={i} className="text-xs text-gray-700">File {i + 1}: {p}%</div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <h4 className="font-semibold mb-2">Rate staff performance</h4>
          <p className="text-xs text-gray-500 mb-2">
            Provide a rating (1-5) and optional comment for each worker/coordinator involved.
          </p>

          <div className="space-y-3">
            {(
              (issue?.staffsAssigned || []).filter((s) => {
                if (!s.user) return false;
                const u = s.user || {};
                return !(
                  (u._id && String(u._id) === String(user._id)) ||
                  (u.id && String(u.id) === String(user._id)) ||
                  (u.email && u.email === user.email)
                );
              })
            ).map((s) => {
              const uid = s.user._id || s.user.id || s.user?.email || String(s.user?.name) || String(Math.random());
              const r = resolveRatings[uid] || { rating: 5, comment: "", role: s.role, name: s.user.name || s.user.email, userId: uid };

              if (!resolveRatings[uid]) {
                Promise.resolve().then(() => {
                  setResolveRatings((prev) => {
                    if (prev && prev[uid]) return prev;
                    return { ...prev, [uid]: r };
                  });
                });
              }

              return (
                <div key={uid} className="p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {r.name} <span className="text-xs text-gray-500">({s.role})</span>
                      </p>
                      <p className="text-xs text-gray-500">{s.user.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-sm">Rating</label>
                      <select
                        value={r.rating}
                        onChange={(e) =>
                          setResolveRatings((prev) => ({ ...prev, [uid]: { ...r, rating: Number(e.target.value) } }))
                        }
                        className="border p-1 rounded"
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
                      setResolveRatings((prev) => ({ ...prev, [uid]: { ...r, comment: e.target.value } }))
                    }
                    className="w-full border p-2 rounded-md mt-2"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button className="px-3 py-1 bg-gray-300 rounded-md" onClick={() => setResolveModalOpen(false)}>Cancel</button>
          <button
            className={`px-3 py-1 bg-green-600 text-white rounded-md ${isResolving ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={submitResolution}
            disabled={isResolving}
          >
            {isResolving ? "Submitting..." : "Submit & Resolve"}
          </button>
        </div>
      </div>
    </div>
  </motion.div>
)}

</AnimatePresence>



        </div>
    );
}
