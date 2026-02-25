
export const LABELING_ACTIVITIES = {
  hearingAid: {
    id: "hearingAid",
    title: "Label the Hearing Aid",
    description: "Identify the parts of a hearing aid",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/6c7c30a63_hearingaid.png",
    labels: [
      { id: "earhook", name: "EARHOOK", correctPosition: { top: "22%", left: "30%" } },
      { id: "controlButtons", name: "CONTROL BUTTONS", correctPosition: { top: "24%", right: "8%" } },
      { id: "tubing", name: "TUBING", correctPosition: { top: "42%", left: "10%" } },
      { id: "microphone", name: "MICROPHONE", correctPosition: { top: "48%", right: "10%" } },
      { id: "amplifier", name: "AMPLIFIER", correctPosition: { top: "60%", right: "10%" } },
      { id: "earmold", name: "EARMOLD", correctPosition: { bottom: "28%", left: "12%" } },
      { id: "compartment", name: "COMPARTMENT", correctPosition: { bottom: "12%", right: "10%" } },
    ],
  },
  cochlearImplant: {
    id: "cochlearImplant",
    title: "Label the Cochlear Implant",
    description: "Identify the parts of a cochlear implant",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/707df5261_LABELcochlearimplant.png",
    labels: [
      { id: "coilMagnet", name: "COIL/MAGNET", correctPosition: { top: "18%", right: "14%" } },
      { id: "controlButtons", name: "CONTROL BUTTONS", correctPosition: { top: "28%", right: "12%" } },
      { id: "microphone", name: "MICROPHONE", correctPosition: { top: "34%", left: "22%" } },
      { id: "soundProcessor", name: "SOUND PROCESSOR", correctPosition: { top: "56%", left: "20%" } },
      { id: "batteryPack", name: "BATTERY PACK", correctPosition: { bottom: "26%", left: "22%" } },
      { id: "cable", name: "CABLE", correctPosition: { bottom: "16%", right: "14%" } },
    ],
  },
};
