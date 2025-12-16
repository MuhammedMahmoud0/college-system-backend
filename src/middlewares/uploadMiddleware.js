import multer from "multer";

export const uploadExcel = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            file.mimetype === "application/vnd.ms-excel"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only Excel files are allowed"), false);
        }
    },
});
