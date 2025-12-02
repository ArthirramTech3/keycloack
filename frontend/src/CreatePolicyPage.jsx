import React, { useState } from "react";

const CreatePolicyModal = ({ onClose }) => {
    const [policyName, setPolicyName] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [categories, setCategories] = useState([]);
    const [models, setModels] = useState([]);

    const toggleCategory = (cat) => {
        setCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const toggleModel = (model) => {
        setModels(prev =>
            prev.includes(model) ? prev.filter(c => c !== model) : [...prev, model]
        );
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
                <div style={styles.modalHeader}>
                    <h2>Create User Policy</h2>
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={styles.modalContent}>
                    {/* Policy Name */}
                    <div style={styles.formGroup}>
                        <label>Policy Name</label>
                        <input
                            type="text"
                            value={policyName}
                            onChange={(e) => setPolicyName(e.target.value)}
                            placeholder="Enter policy name"
                            style={styles.input}
                        />
                    </div>

                    {/* User Select */}
                    <div style={styles.formGroup}>
                        <label>Select User</label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            style={styles.input}
                        >
                            <option value="">Select user...</option>
                            <option value="somu">Somu</option>
                            <option value="ramu">Ramu</option>
                        </select>
                    </div>

                    {/* Category */}
                    <div style={styles.formGroup}>
                        <label>Category</label>
                        <div style={styles.categoryList}>
                            {["Development", "Testing", "Production", "Research"].map(cat => (
                                <label key={cat} style={styles.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        checked={categories.includes(cat)}
                                        onChange={() => toggleCategory(cat)}
                                    />
                                    {cat}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Models */}
                    <div style={styles.formGroup}>
                        <label>Model Assignment & Quota</label>

                        <div style={styles.modelList}>
                            {[
                                "GPT-4 Turbo",
                                "Claude-3 Sonnet",
                                "Gemini Pro",
                                "Llama-2 70B"
                            ].map(model => (
                                <div key={model} style={styles.modelItem}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={models.includes(model)}
                                            onChange={() => toggleModel(model)}
                                        />
                                        <span style={{ marginLeft: 10 }}>{model}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div style={styles.modalFooter}>
                        <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button style={styles.createBtn}>Create Policy</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePolicyModal;
