
export const LABELING_ACTIVITIES = {
  hearingAid: {
    id: "hearingAid",
    title: "Label the Hearing Aid",
    description: "Identify the parts of a hearing aid",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/e5d5fe917_HAImage.png",
    labels: [
      { id: "microphone", name: "MICROPHONE", correctPosition: { top: "20%", left: "28%" } },
      { id: "controlButtons", name: "CONTROL BUTTONS", correctPosition: { top: "16%", right: "12%" } },
      { id: "tubing", name: "TUBING", correctPosition: { top: "38%", left: "18%" } },
      { id: "earhook", name: "EARHOOK", correctPosition: { top: "32%", right: "15%" } },
      { id: "amplifier", name: "AMPLIFIER", correctPosition: { top: "52%", right: "12%" } },
      { id: "earmold", name: "EARMOLD", correctPosition: { bottom: "22%", left: "18%" } },
      { id: "compartment", name: "COMPARTMENT", correctPosition: { bottom: "8%", right: "12%" } },
    ],
  },
  cochlearImplant: {
    id: "cochlearImplant",
    title: "Label the Cochlear Implant",
    description: "Identify the parts of a cochlear implant",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6998a9f042c4eb98ea121183/fe61a45a8_CIimage.png",
    labels: [
      { id: "coilMagnet", name: "COIL/MAGNET", correctPosition: { top: "16%", right: "8%" } },
      { id: "controlButtons", name: "CONTROL BUTTONS", correctPosition: { top: "22%", right: "22%" } },
      { id: "microphone", name: "MICROPHONE", correctPosition: { top: "28%", left: "30%" } },
      { id: "soundProcessor", name: "SOUND PROCESSOR", correctPosition: { top: "48%", left: "28%" } },
      { id: "batteryPack", name: "BATTERY PACK", correctPosition: { bottom: "28%", left: "28%" } },
      { id: "cable", name: "CABLE", correctPosition: { bottom: "12%", right: "18%" } },
    ],
  },
};
