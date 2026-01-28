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

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// // 1. Defined allowed mimetypes as a constant for maintainability
// const ALLOWED_MIMES = [
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     "application/vnd.ms-excel",
// ];

// export const uploadExcel = multer({
//     storage: multer.memoryStorage(),
//     limits: {
//         fileSize: 5 * 1024 * 1024, // 5MB limit
//         files: 1, // Prevent multiple file injection
//     },
//     fileFilter: (req, file, cb) => {
//         if (ALLOWED_MIMES.includes(file.mimetype)) {
//             cb(null, true);
//         } else {
//             // Using a more descriptive error for your error handler
//             const error = new Error(
//                 "Invalid file type. Only Excel files (.xls, .xlsx) are allowed."
//             );
//             error.code = "INVALID_FILE_TYPE";
//             cb(error, false);
//         }
//     },
// });

// // 2. Wrap it to handle errors gracefully in the route
// export const handleUpload = (req, res, next) => {
//     const upload = uploadExcel.single("file");

//     upload(req, res, (err) => {
//         if (err instanceof multer.MulterError) {
//             // Handle Multer-specific errors (e.g., File too large)
//             return res
//                 .status(400)
//                 .json({ error: `Upload error: ${err.message}` });
//         } else if (err) {
//             // Handle custom errors from fileFilter
//             return res.status(400).json({ error: err.message });
//         }
//         next();
//     });
// };
