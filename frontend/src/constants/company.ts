/** Legal entity from the company board-resolution document. GSTIN is not in that document. */
export const company = {
  legalName: "FELISSI PRIVATE LIMITED",
  gstin: "",
  gstinLabel: "GSTIN: To be updated",
  email: "filessipvtltd@gmail.com",
  phone: "9893415041",
  phoneTel: "+919893415041",
  managingDirector: "Mr. Mukesh Joshi",
  authorizedSignatory: "Mr. Mukesh Joshi, Managing Director",
  boardResolutionDate: "16 July 2026",
  directors: ["Mukesh Joshi", "Lucky Nirmalkar"] as const,
  addressLines: [
    "Bharatmata Complex, Shop No. 2,",
    "Raipur Ganj, Raipur,",
    "Chhattisgarh - 492009",
  ],
  address: "Bharatmata Complex, Shop No. 2, Raipur Ganj, Raipur, Chhattisgarh - 492009",
} as const;
