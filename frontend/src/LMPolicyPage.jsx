import React, { useState } from "react";
import CreatePolicyModal from "./CreatePolicyModal";

const LMPolicyPage = () => {
    const [openModal, setOpenModal] = useState(false);

    return (
        <div style={styles.pageContainer}>
            {/* Header */}
            <div style={styles.headerBar}>
                <h2 style={styles.pageTitle}>LM Policy Management</h2>

                <button
                    style={styles.createButton}
                    onClick={() => setOpenModal(true)}
                >
                    Create User Policy
                </button>
            </div>

            {/* Cards */}
            <div style={styles.cardGrid}>
                {/* Example Card */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={styles.avatar}>S</div>
                        <div>
                            <div style={styles.userName}>Somu</div>
                            <div style={styles.dept}>DevOps Dept</div>
                        </div>
                        <span style={styles.statusActive}>Active</span>
                    </div>

                    <div style={styles.modelRow}>
                        <span style={styles.modelName}>GPT-4</span>
                        <span>1500 / 5000 tokens</span>
                    </div>

                    <div style={styles.modelRow}>
                        <span style={styles.modelName}>Claude-3</span>
                        <span>2250 / 5000 tokens</span>
                    </div>

                    <div style={styles.cardFooter}>
                        <button style={styles.smallBtn}>Edit</button>
                        <button style={styles.smallRedBtn}>Suspend</button>
                        <button style={styles.smallBtn}>Activity</button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {openModal && <CreatePolicyModal onClose={() => setOpenModal(false)} />}
        </div>
    );
};

export default LMPolicyPage;
