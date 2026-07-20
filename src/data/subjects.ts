export type SubjectSlot = {
  id: string;
  name: string; // leave blank for user to fill
};

export type YearGroup = {
  year: "Year 11" | "Year 12";
  slots: SubjectSlot[];
};

// Blank subject slots — fill in the `name` for each one as you go.
export const yearGroups: YearGroup[] = [
  {
    year: "Year 11",
    slots: [
      { id: "y11-s1", name: "" },
      { id: "y11-s2", name: "" },
      { id: "y11-s3", name: "" },
      { id: "y11-s4", name: "" },
      { id: "y11-s5", name: "" },
      { id: "y11-s6", name: "" },
    ],
  },
  {
    year: "Year 12",
    slots: [
      { id: "y12-s1", name: "" },
      { id: "y12-s2", name: "" },
      { id: "y12-s3", name: "" },
      { id: "y12-s4", name: "" },
      { id: "y12-s5", name: "" },
      { id: "y12-s6", name: "" },
    ],
  },
];
