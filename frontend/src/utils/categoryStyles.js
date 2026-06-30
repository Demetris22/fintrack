export const categoryOptions = [
  "Food",
  "Drinks",
  "Transport",
  "Shopping",
  "Gym",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

const categoryStyles = {
  food: {
    icon: "FD",
    color: "#0f8a5f",
    background: "#e7f7ef",
  },
  drinks: {
    icon: "DR",
    color: "#2458d3",
    background: "#e7efff",
  },
  coffee: {
    icon: "CF",
    color: "#2458d3",
    background: "#e7efff",
  },
  transport: {
    icon: "TR",
    color: "#b45309",
    background: "#fff4db",
  },
  shopping: {
    icon: "SH",
    color: "#4253b8",
    background: "#eef2ff",
  },
  gym: {
    icon: "GM",
    color: "#c93434",
    background: "#fff0f0",
  },
  fitness: {
    icon: "FT",
    color: "#c93434",
    background: "#fff0f0",
  },
  bills: {
    icon: "BL",
    color: "#0d7490",
    background: "#e7f8fc",
  },
  entertainment: {
    icon: "EN",
    color: "#b83280",
    background: "#fceef8",
  },
  health: {
    icon: "HL",
    color: "#0f8a5f",
    background: "#e7f7ef",
  },
  education: {
    icon: "ED",
    color: "#4253b8",
    background: "#eef2ff",
  },
  other: {
    icon: "OT",
    color: "#5b687a",
    background: "#f0f4f8",
  },
  uncategorized: {
    icon: "OT",
    color: "#5b687a",
    background: "#f0f4f8",
  },
};

export function getCategoryStyle(category) {
  const key = (category || "uncategorized").toLowerCase().trim();

  return categoryStyles[key] || categoryStyles.other;
}
