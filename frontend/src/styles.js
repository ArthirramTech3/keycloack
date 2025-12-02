const styles = {
    pageContainer: {
        padding: "20px 40px",
        background: "#f4f4f8",
        minHeight: "100vh",
    },
    headerBar: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: "22px",
        fontWeight: "700",
    },
    createButton: {
        background: "#3b82f6",
        padding: "10px 18px",
        borderRadius: 6,
        border: "none",
        color: "white",
        cursor: "pointer",
        fontWeight: "600",
    },

    /* CARD */
    cardGrid: {
        display: "flex",
        gap: "20px",
        marginTop: 20,
    },
    card: {
        background: "white",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
        width: 330,
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        gap: 15,
        marginBottom: 15,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#3b82f6",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: 18,
    },
    userName: { fontWeight: 600 },
    dept: { fontSize: 12, color: "#777" },
    statusActive: {
        background: "#d1fae5",
        color: "#065f46",
        padding: "5px 10px",
        borderRadius: 6,
        marginLeft: "auto",
        fontSize: 12,
    },

    modelRow: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    modelName: {
        fontWeight: 600,
    },

    cardFooter: {
        marginTop: 15,
        display: "flex",
        gap: 8,
    },
    smallBtn: {
        background: "#e5e7eb",
        padding: "6px 10px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontSize: 12,
    },
    smallRedBtn: {
        background: "#ef4444",
        color: "white",
        padding: "6px 10px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontSize: 12,
    },

    /* MODAL */
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        zIndex: 1000,
    },
    modalBox: {
        width: "600px",
        maxHeight: "90vh",
        background: "white",
        borderRadius: 12,
        overflowY: "auto",
        boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
        paddingBottom: 20,
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        padding: "20px",
        borderBottom: "1px solid #e5e7eb",
    },
    closeBtn: {
        background: "none",
        border: "none",
        fontSize: 20,
        cursor: "pointer",
    },
    modalContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
    },
    categoryList: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
    },
    modelList: {
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 10,
        background: "#fafafa",
    },
    modelItem: {
        padding: "8px 0",
        borderBottom: "1px solid #eee",
    },
    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 20,
    },
    cancelBtn: {
        background: "#e5e7eb",
        padding: "10px 18px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
    },
    createBtn: {
        background: "#3b82f6",
        color: "white",
        padding: "10px 18px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
    }
};
