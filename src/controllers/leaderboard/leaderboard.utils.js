export const clamp = (num, min, max) => {
    return Math.max(min, Math.min(num, max));
};

export const percentileFromRank = (rank, total) => {
    if (total === 0) return 0;
    return ((total - rank) / total) * 100;
};

export const badgeFor = (type, score, percentile) => {
    if (type === "gpa") {
        if (score >= 3.7) return "Gold";
        if (score >= 3.3) return "Silver";
        if (score >= 2.5) return "Bronze";
        return null;
    }

    if (type === "attendance") {
        if (percentile >= 95) return "Gold";
        if (percentile >= 85) return "Silver";
        if (percentile >= 70) return "Bronze";
        return null;
    }

    if (type === "activities") {
        if (percentile >= 95) return "Gold";
        if (percentile >= 80) return "Silver";
        if (percentile >= 60) return "Bronze";
        return null;
    }
    return null;
};
