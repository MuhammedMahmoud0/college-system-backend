export const studentProfileSelect = {
    student_id: true,
    year_level: true,
    cgpa: true,
    total_credits: true,
    departments: {
        select: {
            department_id: true,
            name: true,
        },
    },
};
